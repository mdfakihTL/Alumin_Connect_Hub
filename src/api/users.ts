import { apiClient } from './client';
import type {
  UserResponse,
  UserWithProfileResponse,
  UserProfileResponse,
  MessageResponse,
} from './types';

export interface UserUpdateRequest {
  name?: string;
  avatar?: string;
  graduation_year?: number;
  major?: string;
  is_mentor?: boolean;
}

export interface ProfileUpdateRequest {
  bio?: string;
  phone?: string;
  location?: string;
  job_title?: string;
  company?: string;
  linkedin?: string;
  website?: string;
  banner?: string;
  experience?: string;
  education?: string;
}

export const usersApi = {
  // Get current user profile
  getMyProfile: async (): Promise<UserWithProfileResponse> => {
    return apiClient.get<UserWithProfileResponse>('/users/me');
  },

  // Update current user
  updateMe: async (data: UserUpdateRequest): Promise<UserResponse> => {
    return apiClient.put<UserResponse>('/users/me', data);
  },

  // Update current user profile
  updateMyProfile: async (data: ProfileUpdateRequest): Promise<UserProfileResponse> => {
    return apiClient.put<UserProfileResponse>('/users/me/profile', data);
  },

  // Get user by ID
  getUser: async (userId: string): Promise<UserWithProfileResponse> => {
    return apiClient.get<UserWithProfileResponse>(`/users/${userId}`);
  },

  // Search users
  searchUsers: async (params: {
    search?: string;
    university_id?: string;
    graduation_year?: number;
    is_mentor?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<{ users: UserWithProfileResponse[]; total: number }> => {
    return apiClient.get('/users/search', params);
  },

  // Toggle mentor status
  toggleMentor: async (): Promise<MessageResponse> => {
    return apiClient.post<MessageResponse>('/users/me/toggle-mentor');
  },

  // Update avatar
  updateAvatar: async (avatarUrl: string): Promise<UserResponse> => {
    return apiClient.put<UserResponse>('/users/me/avatar', { avatar: avatarUrl });
  },

  // Update banner
  updateBanner: async (bannerUrl: string): Promise<MessageResponse> => {
    return apiClient.put<MessageResponse>('/users/me/banner', { banner: bannerUrl });
  },

  // Mark profile as complete
  completeProfile: async (): Promise<MessageResponse> => {
    return apiClient.post<MessageResponse>('/users/me/complete-profile');
  },

  // Check first login status
  checkFirstLogin: async (): Promise<{ first_login: boolean; is_profile_complete: boolean }> => {
    return apiClient.get('/users/me/first-login');
  },

  // Acknowledge first login (to not show prompt again)
  acknowledgeFirstLogin: async (): Promise<MessageResponse> => {
    return apiClient.post<MessageResponse>('/users/me/acknowledge-first-login');
  },

  // Get alumni locations for world map (university filtered)
  getAlumniLocations: async (): Promise<{
    locations: Array<{
      location: string;
      count: number;
      lat: number;
      lng: number;
      alumni: Array<{ id: string; name: string; avatar: string; job_title?: string; company?: string }>;
    }>;
    total: number;
  }> => {
    return apiClient.get('/users/locations');
  },
};

