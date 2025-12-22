import { apiClient } from './client';
import type {
  ConnectionResponse,
  ConnectionListResponse,
  ConnectionRequestResponse,
  MessageResponse,
} from './types';

export const connectionsApi = {
  // Get all connections
  getConnections: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
  }): Promise<ConnectionListResponse> => {
    return apiClient.get<ConnectionListResponse>('/connections', params);
  },

  // Get connection suggestions
  getSuggestions: async (params?: {
    limit?: number;
  }): Promise<ConnectionListResponse> => {
    return apiClient.get<ConnectionListResponse>('/connections/suggestions', params);
  },

  // Send connection request
  sendRequest: async (toUserId: string): Promise<MessageResponse> => {
    return apiClient.post<MessageResponse>('/connections/request', { to_user_id: toUserId });
  },

  // Get received requests (backend returns array directly)
  getReceivedRequests: async (): Promise<ConnectionRequestResponse[]> => {
    return apiClient.get('/connections/requests/received');
  },

  // Get sent requests (backend returns array directly)
  getSentRequests: async (): Promise<ConnectionRequestResponse[]> => {
    return apiClient.get('/connections/requests/sent');
  },

  // Accept request
  acceptRequest: async (requestId: string): Promise<MessageResponse> => {
    return apiClient.put<MessageResponse>(`/connections/requests/${requestId}/accept`);
  },

  // Reject request
  rejectRequest: async (requestId: string): Promise<MessageResponse> => {
    return apiClient.put<MessageResponse>(`/connections/requests/${requestId}/reject`);
  },

  // Remove connection
  removeConnection: async (connectionId: string): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse>(`/connections/${connectionId}`);
  },

  // Check if connected to user
  checkConnection: async (userId: string): Promise<{ is_connected: boolean; request_status?: string }> => {
    return apiClient.get(`/connections/check/${userId}`);
  },
};

