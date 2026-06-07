import { Router } from 'express';
import { saveMessage, getHistory, getLastNMessages } from '../db/orientdb.js';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();

router.get('/history', async (req, res) => {
    try {
        const history = await getHistory(100);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el historial' });
    }
});

router.post('/chat', async (req, res) => {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Mensaje vacío' });

    //guardar mensaje del usuario
    await saveMessage({ role: 'user', content: message });

    //obtener contexto de los últimos 10 mensajes
    let context = await getLastNMessages(10);

    // fallback: si BD falla, al menos enviar el mensaje actual
    if (context.length === 0) {
        context = [{ role: 'user', content: message }];
    }

    //configurar SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
        console.log('Enviando a Ollama:', process.env.OLLAMA_URL, process.env.OLLAMA_MODEL);
        console.log('Contexto:', JSON.stringify(context));
        const ollamaRes = await fetch(`${process.env.OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            model: process.env.OLLAMA_MODEL,
            messages: context,
            stream: true,
            keep_alive: -1  // mantener en memoria indefinidamente
            })
        });
        
        console.log('Status Ollama:', ollamaRes.status);
        if (!ollamaRes.ok) {
            const errText = await ollamaRes.text();
            console.error('Error Ollama:', errText);
            res.write(`data: ${JSON.stringify({ error: errText })}\n\n`);
            res.end();
            return;
        }

        let fullResponse = '';
        let buffer = '';
        const reader = ollamaRes.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            console.log('BUFFER:', buffer); // LOG TEMPORAL

            const lines = buffer.split('\n');
            buffer = lines.pop(); // guardar línea incompleta

            for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const json = JSON.parse(line);
                console.log('JSON parseado:', json); // LOG TEMPORAL
                const token = json.message?.content ?? '';
                if (token) {
                    fullResponse += token;
                    res.write(`data: ${JSON.stringify({ token })}\n\n`);
                }
                if (json.done) {
                    if (json.done_reason === 'load') continue;    
                    await saveMessage({ role: 'assistant', content: fullResponse });
                    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                    res.end();
                    return;
                }
            } catch (e) {
                console.log('Error parseando línea:', line, e.message);
            }
            }
        }
    } catch (error) {
        console.error('Error Ollama:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});

export default router;