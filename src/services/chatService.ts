import { apiClient, API_ENDPOINTS } from '@/lib/api';
import {
  ChatSession,
  ChatSessionWithMessages,
  SendMessageRequest,
  SendMessageResponse,
} from '@/types/chat';

export const chatService = {
  /**
   * Send a chat message to the AI assistant
   * Use session_id: null to create a new session, or provide existing session_id to continue conversation
   */
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    return apiClient<SendMessageResponse>(API_ENDPOINTS.CHAT.MESSAGE, {
      method: 'POST',
      body: request,
      requireAuth: true,
    });
  },

  /**
   * List all chat sessions for the current user
   */
  async listSessions(): Promise<ChatSession[]> {
    return apiClient<ChatSession[]>(API_ENDPOINTS.CHAT.SESSIONS, {
      method: 'GET',
      requireAuth: true,
    });
  },

  /**
   * Get a specific chat session with all messages
   * Only the session owner can access this
   */
  async getSession(sessionId: number): Promise<ChatSessionWithMessages> {
    return apiClient<ChatSessionWithMessages>(
      API_ENDPOINTS.CHAT.SESSION(sessionId),
      {
        method: 'GET',
        requireAuth: true,
      }
    );
  },

  /**
   * Start a new chat session by sending a message with null session_id
   */
  async startNewSession(message: string): Promise<SendMessageResponse> {
    return this.sendMessage({
      message,
      session_id: null,
    });
  },

  /**
   * Continue an existing chat session
   */
  async continueSession(
    sessionId: number,
    message: string
  ): Promise<SendMessageResponse> {
    return this.sendMessage({
      message,
      session_id: sessionId,
    });
  },
};
