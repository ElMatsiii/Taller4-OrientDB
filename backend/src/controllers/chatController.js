import * as db from '../modules/orientdb.js';
import { streamChatResponse } from '../modules/ollama.js';

const sendJSON = (res, payload, status = 200) => res.status(status).json(payload);
const sendServerError = (res, error, message) => {
  console.error(message, error.message);
  return res.status(500).json({ error: message });
};
const sendSSE = (res, payload) => res.write('data: ' + JSON.stringify(payload) + '\n\n');

const prepareSSE = (res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
};

const sanitizeTitle = (title) => title?.trim() || 'Nueva conversación';

/**
 * Devuelve la lista de conversaciones existentes.
 */
export async function listConversations(req, res) {
  try {
    const conversations = await db.listConversations();
    return sendJSON(res, conversations);
  } catch (error) {
    return sendServerError(res, error, 'Error al obtener conversaciones');
  }
}

/**
 * Crea una nueva conversación con título opcional.
 */
export async function createConversation(req, res) {
  try {
    const title = sanitizeTitle(req.body.title);
    const conversation = await db.createConversation(title);
    return sendJSON(res, conversation);
  } catch (error) {
    return sendServerError(res, error, 'Error al crear conversación');
  }
}

/**
 * Elimina una conversación en la base de datos.
 */
export async function deleteConversation(req, res) {
  try {
    await db.deleteConversation(req.params.id);
    return res.status(204).end();
  } catch (error) {
    return sendServerError(res, error, 'Error al eliminar conversación');
  }
}

/**
 * Recupera los mensajes de una conversación específica.
 */
export async function getConversationMessages(req, res) {
  try {
    const messages = await db.getMessages(req.params.id);
    return sendJSON(res, messages);
  } catch (error) {
    return sendServerError(res, error, 'Error al obtener mensajes');
  }
}

/**
 * Maneja el endpoint de chat con IA.
 * Recibe el mensaje del usuario, guarda el historial y transmite la respuesta en tiempo real.
 */
export async function chat(req, res) {
  const { message, conversationId, title } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Mensaje vacío' });
  }

  let currentConversationId = conversationId;
  let createdConversation = null;

  try {
    if (!currentConversationId) {
      createdConversation = await db.createConversation(sanitizeTitle(title));
      currentConversationId = createdConversation.id;
    }

    await db.saveMessage({ conversationId: currentConversationId, role: 'user', content: message });

    let context = await db.getLastMessages(currentConversationId, 10);
    if (context.length === 0) {
      context = [{ role: 'user', content: message }];
    }

    prepareSSE(res);

    if (createdConversation) {
      sendSSE(res, { conversationId: currentConversationId });
    }

    const assistantResponse = await streamChatResponse({
      messages: context,
      onToken: (token) => sendSSE(res, { token }),
    });

    await db.saveMessage({ conversationId: currentConversationId, role: 'assistant', content: assistantResponse });
    sendSSE(res, { done: true });
    res.end();
  } catch (error) {
    console.error('Error en chat:', error.message);
    sendSSE(res, { error: error.message });
    res.end();
  }
}
