import { apiClient } from './client';
import type {
  SupportTicketResponse,
  SupportTicketCreateRequest,
  SupportTicketListResponse,
  MessageResponse,
} from './types';

export const supportApi = {
  // Get all tickets for current user
  getTickets: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }): Promise<SupportTicketListResponse> => {
    return apiClient.get<SupportTicketListResponse>('/support/tickets', params);
  },

  // Get single ticket
  getTicket: async (ticketId: string): Promise<SupportTicketResponse> => {
    return apiClient.get<SupportTicketResponse>(`/support/tickets/${ticketId}`);
  },

  // Create ticket
  createTicket: async (data: SupportTicketCreateRequest): Promise<SupportTicketResponse> => {
    return apiClient.post<SupportTicketResponse>('/support/tickets', data);
  },

  // Add response to ticket
  addResponse: async (ticketId: string, message: string): Promise<MessageResponse> => {
    return apiClient.post<MessageResponse>(`/support/tickets/${ticketId}/respond`, { message });
  },

  // Close ticket
  closeTicket: async (ticketId: string): Promise<MessageResponse> => {
    return apiClient.put<MessageResponse>(`/support/tickets/${ticketId}/close`);
  },
};

