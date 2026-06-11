import { Router } from 'express';
import {
  listConversations,
  createConversation,
  deleteConversation,
  getConversationMessages,
  chat,
} from '../controllers/chatController.js';

const router = Router();

// Devuelve todas las conversaciones disponibles
router.get('/conversations', listConversations);

// Crea una nueva conversación
router.post('/conversations', createConversation);

// Elimina una conversación por ID
router.delete('/conversations/:id', deleteConversation);

// Obtiene los mensajes de una conversación concreta
router.get('/conversations/:id/messages', getConversationMessages);

// Endpoint principal de chat con IA
router.post('/chat', chat);

export default router;
