import * as chatService from '../services/chatService.js';
import { streamChatResponse } from '../modules/ollama.js';

export async function listConversations(req, res) {
  try {
    const conversations = await chatService.listConversations();
    res.json(conversations);
  } catch (error) {
    console.error('Error al obtener conversaciones:', error.message);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
}

export async function createConversation(req, res) {
  try {
    const title = req.body.title?.trim() || 'Nueva conversación';
    const conversation = await chatService.createConversation(title);
    res.json(conversation);
  } catch (error) {
    console.error('Error al crear conversación:', error.message);
    res.status(500).json({ error: 'Error al crear conversación' });
  }
}

export async function deleteConversation(req, res) {
  try {
    await chatService.deleteConversation(req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar conversación:', error.message);
    res.status(500).json({ error: 'Error al eliminar conversación' });
  }
}

export async function getConversationMessages(req, res) {
  try {
    const messages = await chatService.getMessages(req.params.id);
    res.json(messages);
  } catch (error) {
    console.error('Error al obtener mensajes:', error.message);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
}

export async function chat(req, res) {
  const { message, conversationId, title } = req.body;
  if (!message?.trim()) {
    return res.status(400).json({ error: 'Mensaje vacío' });
  }

  let currentConversationId = conversationId;
  let createdConversation = null;

  try {
    if (!currentConversationId) {
      createdConversation = await chatService.createConversation(title?.trim() || 'Nueva conversación');
      currentConversationId = createdConversation.id;
    }

    await chatService.saveUserMessage(currentConversationId, message);

    let context = await chatService.getRecentMessages(currentConversationId, 10);
    if (context.length === 0) {
      context = [{ role: 'user', content: message }];
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    if (createdConversation) {
      res.write('data: ' + JSON.stringify({ conversationId: currentConversationId }) + '\n\n');
    }

    const assistantResponse = await streamChatResponse({
      messages: context,
      onToken: (token) => {
        res.write('data: ' + JSON.stringify({ token }) + '\n\n');
      },
    });

    await chatService.saveAssistantMessage(currentConversationId, assistantResponse);
    res.write('data: ' + JSON.stringify({ done: true }) + '\n\n');
    res.end();
  } catch (error) {
    console.error('Error en chat:', error.message);
    res.write('data: ' + JSON.stringify({ error: error.message }) + '\n\n');
    res.end();
  }
}
