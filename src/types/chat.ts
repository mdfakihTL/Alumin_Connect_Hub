// Chat message role
export type ChatRole = 'user' | 'assistant';

// Chat message from API
export interface ChatMessage {
  id: number;
  session_id: number;
  role: ChatRole;
  content: string;
  tokens_used: number;
  created_at: string;
}

// Chat session from API
export interface ChatSession {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

// Chat session with messages
export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}

// Send message request
export interface SendMessageRequest {
  message: string;
  session_id: number | null;
}

// Send message response
export interface SendMessageResponse {
  message: string;
  response: string;
  session_id: number;
  tokens_used: number;
}

// Error response
export interface ChatError {
  detail: string;
}
