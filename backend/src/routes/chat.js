import { Router } from 'express';
import {
  listConversations,
  createConversation,
  deleteConversation,
  getConversationMessages,
  chat,
} from '../controllers/chatController.js';

const router = Router();

router.get('/conversations', listConversations);
router.post('/conversations', createConversation);
router.delete('/conversations/:id', deleteConversation);
router.get('/conversations/:id/messages', getConversationMessages);
router.post('/chat', chat);

export default router;
