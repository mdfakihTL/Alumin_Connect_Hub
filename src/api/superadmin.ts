import { apiClient } from './client';
import type {
  UniversityResponse,
  MessageResponse,
  UserResponse,
} from './types';

// Dashboard stats
export interface SuperAdminDashboardStats {
  total_universities: number;
  enabled_universities: number;
  total_users: number;
  total_admins: number;
  total_alumni: number;
  total_events: number;
  total_groups: number;
  pending_admin_resets: number;
}

// University create
export interface UniversityCreate {
  id: string;
  name: string;
  logo?: string;
  colors?: any;
}

// Admin user
export interface AdminUserResponse {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  university_id: string;
  university_name: string;
  is_active: boolean;
  created_at: string;
}

export const superadminApi = {
  // Dashboard
  getDashboardStats: async (): Promise<SuperAdminDashboardStats> => {
    return apiClient.get<SuperAdminDashboardStats>('/superadmin/dashboard');
  },

  // Universities
  getUniversities: async (params?: {
    search?: string;
    is_enabled?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<{ universities: UniversityResponse[]; total: number }> => {
    return apiClient.get('/superadmin/universities', params);
  },

  createUniversity: async (data: UniversityCreate): Promise<UniversityResponse> => {
    return apiClient.post<UniversityResponse>('/superadmin/universities', data);
  },

  updateUniversity: async (universityId: string, data: Partial<UniversityCreate & { is_enabled: boolean }>): Promise<UniversityResponse> => {
    return apiClient.put<UniversityResponse>(`/superadmin/universities/${universityId}`, data);
  },

  deleteUniversity: async (universityId: string): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse>(`/superadmin/universities/${universityId}`);
  },

  toggleUniversityStatus: async (universityId: string): Promise<MessageResponse> => {
    return apiClient.post<MessageResponse>(`/superadmin/universities/${universityId}/toggle-status`);
  },

  // Admins
  getAdmins: async (params?: {
    university_id?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ admins: AdminUserResponse[]; total: number }> => {
    return apiClient.get('/superadmin/admins', params);
  },

  createAdmin: async (data: {
    email: string;
    password: string;
    name: string;
    university_id: string;
  }): Promise<AdminUserResponse> => {
    return apiClient.post<AdminUserResponse>('/superadmin/admins', data);
  },

  updateAdmin: async (adminId: string, data: Partial<{
    name: string;
    email: string;
    university_id: string;
  }>): Promise<AdminUserResponse> => {
    return apiClient.put<AdminUserResponse>(`/superadmin/admins/${adminId}`, data);
  },

  deactivateAdmin: async (adminId: string): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse>(`/superadmin/admins/${adminId}`);
  },

  // Global Users
  getAllUsers: async (params?: {
    university_id?: string;
    role?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ users: UserResponse[]; total: number; page: number; page_size: number }> => {
    return apiClient.get('/superadmin/users', params);
  },

  // Password Resets (for admins)
  getAdminPasswordResets: async (): Promise<{ requests: any[] }> => {
    return apiClient.get('/superadmin/password-resets');
  },

  resetAdminPassword: async (adminId: string, newPassword: string): Promise<MessageResponse> => {
    return apiClient.post<MessageResponse>(`/superadmin/password-resets/${adminId}/reset`, { new_password: newPassword });
  },

  // Global Ads
  getGlobalAds: async (): Promise<any[]> => {
    return apiClient.get('/superadmin/ads');
  },

  createGlobalAd: async (data: any): Promise<any> => {
    return apiClient.post('/superadmin/ads', data);
  },

  updateGlobalAd: async (adId: string, data: any): Promise<any> => {
    return apiClient.put(`/superadmin/ads/${adId}`, data);
  },

  deleteGlobalAd: async (adId: string): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse>(`/superadmin/ads/${adId}`);
  },

  // Analytics
  getAnalytics: async (params?: {
    start_date?: string;
    end_date?: string;
    university_id?: string;
  }): Promise<any> => {
    return apiClient.get('/superadmin/analytics', params);
  },
};

