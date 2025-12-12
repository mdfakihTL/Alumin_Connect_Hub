import { apiClient } from './client';
import type {
  GroupResponse,
  GroupCreateRequest,
  GroupListResponse,
  MessageResponse,
} from './types';

export interface GroupMessageResponse {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  is_own: boolean;
  created_at: string;
}

export const groupsApi = {
  // Get all groups
  getGroups: async (params?: {
    page?: number;
    page_size?: number;
    category?: string;
    search?: string;
    joined_only?: boolean;
  }): Promise<GroupListResponse> => {
    return apiClient.get<GroupListResponse>('/groups', params);
  },

  // Get single group
  getGroup: async (groupId: string): Promise<GroupResponse> => {
    return apiClient.get<GroupResponse>(`/groups/${groupId}`);
  },

  // Create group (admin)
  createGroup: async (data: GroupCreateRequest): Promise<GroupResponse> => {
    return apiClient.post<GroupResponse>('/groups', data);
  },

  // Update group (admin)
  updateGroup: async (groupId: string, data: Partial<GroupCreateRequest>): Promise<GroupResponse> => {
    return apiClient.put<GroupResponse>(`/groups/${groupId}`, data);
  },

  // Delete group (admin)
  deleteGroup: async (groupId: string): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse>(`/groups/${groupId}`);
  },

  // Join group
  joinGroup: async (groupId: string): Promise<MessageResponse> => {
    return apiClient.post<MessageResponse>(`/groups/${groupId}/join`);
  },

  // Leave group
  leaveGroup: async (groupId: string): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse>(`/groups/${groupId}/leave`);
  },

  // Get group messages
  getGroupMessages: async (groupId: string, params?: {
    page?: number;
    page_size?: number;
  }): Promise<{ messages: GroupMessageResponse[]; total: number }> => {
    return apiClient.get(`/groups/${groupId}/messages`, params);
  },

  // Send group message
  sendGroupMessage: async (groupId: string, content: string): Promise<GroupMessageResponse> => {
    return apiClient.post<GroupMessageResponse>(`/groups/${groupId}/messages`, { content });
  },

  // Get my joined groups
  getMyGroups: async (): Promise<GroupListResponse> => {
    return apiClient.get<GroupListResponse>('/groups/my-groups');
  },
};

