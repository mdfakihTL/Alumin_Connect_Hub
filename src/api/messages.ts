import { apiClient } from './client';
import type {
  ConversationResponse,
  ConversationMessagesResponse,
  MessageResponse as ChatMessageResponse,
} from './types';

export const messagesApi = {
  // Get all conversations
  getConversations: async (): Promise<{ conversations: ConversationResponse[] }> => {
    return apiClient.get('/messages/conversations');
  },

  // Get conversation with messages
  getConversation: async (conversationId: string): Promise<ConversationMessagesResponse> => {
    return apiClient.get<ConversationMessagesResponse>(`/messages/conversations/${conversationId}`);
  },

  // Get or create conversation with user
  getOrCreateConversation: async (userId: string): Promise<ConversationMessagesResponse> => {
    return apiClient.post<ConversationMessagesResponse>('/messages/conversations', { user_id: userId });
  },

  // Send message
  sendMessage: async (conversationId: string, content: string): Promise<ChatMessageResponse> => {
    return apiClient.post<ChatMessageResponse>(`/messages/conversations/${conversationId}/messages`, { content });
  },

  // Mark conversation as read
  markAsRead: async (conversationId: string): Promise<void> => {
    return apiClient.put(`/messages/conversations/${conversationId}/read`);
  },

  // Get unread count
  getUnreadCount: async (): Promise<{ count: number }> => {
    return apiClient.get('/messages/unread-count');
  },
};

