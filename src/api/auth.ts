import { apiClient } from './client';
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  PasswordResetResponse,
  UserWithProfileResponse,
  UniversityResponse,
} from './types';

export const authApi = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', data);
    // Store the token
    localStorage.setItem('access_token', response.access_token);
    return response;
  },

  register: async (data: RegisterRequest): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/register', data);
    // Store the token
    localStorage.setItem('access_token', response.access_token);
    return response;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('alumni_user');
      localStorage.removeItem('university_branding');
    }
  },

  getCurrentUser: async (): Promise<UserWithProfileResponse> => {
    return apiClient.get<UserWithProfileResponse>('/auth/me');
  },

  requestPasswordReset: async (email: string): Promise<PasswordResetResponse> => {
    return apiClient.post<PasswordResetResponse>('/auth/request-password-reset', { email });
  },

  getAvailableUniversities: async (): Promise<UniversityResponse[]> => {
    return apiClient.get<UniversityResponse[]>('/auth/universities');
  },

  refreshBranding: async (): Promise<TokenResponse> => {
    return apiClient.post<TokenResponse>('/auth/refresh-branding');
  },
};

