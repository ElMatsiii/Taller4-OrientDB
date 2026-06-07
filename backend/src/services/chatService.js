import * as db from '../modules/orientdb.js';

export async function listConversations() {
  return db.listConversations();
}

export async function createConversation(title) {
  return db.createConversation(title);
}

export async function deleteConversation(conversationId) {
  return db.deleteConversation(conversationId);
}

export async function getMessages(conversationId) {
  return db.getMessages(conversationId);
}

export async function getRecentMessages(conversationId, limit = 10) {
  return db.getLastMessages(conversationId, limit);
}

export async function saveUserMessage(conversationId, content) {
  return db.saveMessage({ conversationId, role: 'user', content });
}

export async function saveAssistantMessage(conversationId, content) {
  return db.saveMessage({ conversationId, role: 'assistant', content });
}
