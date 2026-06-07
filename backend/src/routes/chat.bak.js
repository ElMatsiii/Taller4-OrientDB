import { Router } from 'express';
import {
  saveMessage,
  getMessages,
  getLastMessages,
  createConversation,
  listConversations,
  deleteConversation,
} from '../db/orientdb.js';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();

router.get('/conversations', async (req, res) => {
  try {
    const conversations = await listConversations();
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
});

router.post('/conversations', async (req, res) => {
  try {
    const title = req.body.title?.trim() || 'Nueva conversación';
    const conversation = await createConversation(title);
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear conversación' });
  }
});

router.delete('/conversations/:id', async (req, res) => {
  try {
    await deleteConversation(req.params.id);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar conversación' });
  }
});

router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const messages = await getMessages(req.params.id);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

router.post('/chat', async (req, res) => {
  const { message, conversationId, title } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Mensaje vacío' });

  let currentConversationId = conversationId;
  let createdConversation = null;

  if (!currentConversationId) {
    createdConversation = await createConversation(title?.trim() || 'Nueva conversación');
    currentConversationId = createdConversation.id;
  }

  await saveMessage({ conversationId: currentConversationId, role: 'user', content: message });

  let context = await getLastMessages(currentConversationId, 10);
  if (context.length === 0) {
    context = [{ role: 'user', content: message }];
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (createdConversation) {
    res.write('data: ' + JSON.stringify({ conversationId: currentConversationId }) + '

');
  }

  try {
    console.log('Enviando a Ollama:', process.env.OLLAMA_URL, process.env.OLLAMA_MODEL);
    console.log('Contexto:', JSON.stringify(context));
    const ollamaRes = await fetch(${process.env.OLLAMA_URL}/api/chat, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL,
        messages: context,
        stream: true,
        keep_alive: -1,
      }),
    });

    console.log('Status Ollama:', ollamaRes.status);
    if (!ollamaRes.ok) {
      const errText = await ollamaRes.text();
      console.error('Error Ollama:', errText);
      res.write('data: ' + JSON.stringify({ error: errText }) + '

');
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
      const lines = buffer.split('
');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const json = JSON.parse(line);
          const token = json.message?.content ?? '';
          if (token) {
            fullResponse += token;
            res.write('data: ' + JSON.stringify({ token }) + '

');
          }

          if (json.done) {
            if (json.done_reason === 'load') continue;
            await saveMessage({ conversationId: currentConversationId, role: 'assistant', content: fullResponse });
            res.write('data: ' + JSON.stringify({ done: true }) + '

');
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
    res.write('data: ' + JSON.stringify({ error: error.message }) + '

');
    res.end();
  }
});

export default router;
