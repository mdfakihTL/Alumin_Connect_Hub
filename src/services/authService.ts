import { apiClient, API_ENDPOINTS, tokenManager } from '@/lib/api';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ApiUser,
  LogoutResponse,
  UniversityTemplateResponse,
  UpdateTemplateResponse,
  TOKEN_KEYS,
} from '@/types/auth';

export const authService = {
  /**
   * Login with username/email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      {
        method: 'POST',
        body: credentials,
        requireAuth: false,
      }
    );

    // Store tokens
    tokenManager.setTokens(response.access_token, response.refresh_token);

    return response;
  },

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient<RegisterResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      {
        method: 'POST',
        body: data,
        requireAuth: false,
      }
    );

    // Store tokens and user
    tokenManager.setTokens(response.access_token, response.refresh_token);
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(response.user));

    return response;
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<ApiUser> {
    const user = await apiClient<ApiUser>(API_ENDPOINTS.AUTH.ME, {
      method: 'GET',
      requireAuth: true,
    });

    // Update stored user data
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));

    return user;
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await apiClient<LogoutResponse>(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
        requireAuth: true,
      });
    } catch (error) {
      // Log error but still clear local tokens
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local tokens
      tokenManager.clearTokens();
    }
  },

  /**
   * Get university template settings
   */
  async getUniversityTemplate(): Promise<UniversityTemplateResponse> {
    return apiClient<UniversityTemplateResponse>(API_ENDPOINTS.AUTH.TEMPLATE, {
      method: 'GET',
      requireAuth: true,
    });
  },

  /**
   * Update university template (Admin only)
   */
  async updateUniversityTemplate(template: string): Promise<UpdateTemplateResponse> {
    return apiClient<UpdateTemplateResponse>(API_ENDPOINTS.AUTH.TEMPLATE, {
      method: 'PUT',
      body: template,
      requireAuth: true,
    });
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const accessToken = tokenManager.getAccessToken();
    return !!accessToken && !tokenManager.isTokenExpired(accessToken);
  },

  /**
   * Get stored user from localStorage
   */
  getStoredUser(): ApiUser | null {
    try {
      const stored = localStorage.getItem(TOKEN_KEYS.USER);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
    }
    return null;
  },
};
