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
  total_posts: number;
  total_events: number;
  total_groups: number;
  total_ads: number;
  active_ads: number;
  pending_admin_resets: number;
  universities: Array<{
    id: string;
    name: string;
    logo?: string;
    alumni_count: number;
    admin_count: number;
    posts_count: number;
    is_enabled: boolean;
  }>;
}

// University create
export interface UniversityCreate {
  id: string;
  name: string;
  logo?: string;
  colors?: string;  // JSON string of color configuration
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

// Global user (all roles)
export interface GlobalUserResponse {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  university_id?: string;
  university_name?: string;
  graduation_year?: number;
  major?: string;
  is_mentor: boolean;
  is_active: boolean;
  created_at?: string;
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
    is_mentor?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<{ 
    users: GlobalUserResponse[]; 
    total: number; 
    page: number; 
    page_size: number;
    role_counts: { superadmin: number; admin: number; alumni: number; mentor: number };
  }> => {
    return apiClient.get('/superadmin/users', params);
  },

  createGlobalUser: async (data: {
    email: string;
    password: string;
    name: string;
    role: string;
    university_id?: string;
    graduation_year?: number;
    major?: string;
    is_mentor?: boolean;
  }): Promise<GlobalUserResponse> => {
    return apiClient.post<GlobalUserResponse>('/superadmin/users', data);
  },

  toggleUserStatus: async (userId: string): Promise<{ message: string; success: boolean; is_active: boolean }> => {
    return apiClient.put(`/superadmin/users/${userId}/toggle-status`);
  },

  deleteGlobalUser: async (userId: string): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse>(`/superadmin/users/${userId}`);
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

