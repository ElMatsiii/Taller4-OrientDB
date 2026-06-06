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
    const context = await getLastNMessages(10);

    //configurar SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
        //llamar a ollama con streaming
        const ollamaRes = await fetch(`${process.env.OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                model: process.env.OLLAMA_MODEL,
                messages: context,
                stream: true
            })
        });

        let fullResponse = '';

        for await (const chunk of ollamaRes.body) {
            const text = new TextDecoder().decode(chunk);
            const lines = text.split('\n').filter(Boolean);

            for (const line of lines) {
                try {
                    const json = JSON.parse(line);
                    const token = json.message?.content ?? '';
                    if (token) {
                        fullResponse += token;
                        res.write(`data: ${JSON.stringify({ token })}\n\n`);
                    }

                    if (json.done) {
                        await saveMessage({ role: 'assistant', content: fullResponse });
                        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                        res.end();
                    }
                } catch (err) {
                    console.error('Error al parsear línea de Ollama:', err);
                }
            }
        }
    } catch (error) {
        res.write(`data: ${JSON.stringify({ error: 'Error al comunicarse con Ollama' })}\n\n`);
        res.end();
    }
});

export default router;