import { apiClient } from './client';
import type {
  NotificationResponse,
  NotificationListResponse,
  MessageResponse,
} from './types';

export const notificationsApi = {
  // Get all notifications
  getNotifications: async (params?: {
    page?: number;
    page_size?: number;
    unread_only?: boolean;
  }): Promise<NotificationListResponse> => {
    return apiClient.get<NotificationListResponse>('/notifications', params);
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<MessageResponse> => {
    return apiClient.put<MessageResponse>(`/notifications/${notificationId}/read`);
  },

  // Mark all as read
  markAllAsRead: async (): Promise<MessageResponse> => {
    return apiClient.put<MessageResponse>('/notifications/read-all');
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse>(`/notifications/${notificationId}`);
  },

  // Clear all notifications
  clearAll: async (): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse>('/notifications/clear-all');
  },

  // Get unread count
  getUnreadCount: async (): Promise<{ count: number }> => {
    return apiClient.get('/notifications/unread-count');
  },
};

