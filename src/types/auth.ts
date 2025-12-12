// User roles enum matching backend
export type UserRole = 'SUPER_ADMIN' | 'UNIVERSITY_ADMIN' | 'ALUMNI' | 'STUDENT';

// User interface from API
export interface ApiUser {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  university_id: number | null;
  created_at: string;
  updated_at: string;
}

// Login request payload
export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
}

// Login response from API
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  website_template: string | null;
}

// Register request payload
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  full_name: string;
}

// Register response from API
export interface RegisterResponse {
  user: ApiUser;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Refresh token response
export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Logout response
export interface LogoutResponse {
  message: string;
}

// University template response
export interface UniversityTemplateResponse {
  website_template: string;
  university_name: string;
  university_id: number;
  username: string;
  role: UserRole;
}

// Update template response
export interface UpdateTemplateResponse {
  message: string;
  website_template: string;
  university_name: string;
  username: string;
}

// API Error response
export interface ApiError {
  detail: string;
}

// Token storage keys
export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'alumni_access_token',
  REFRESH_TOKEN: 'alumni_refresh_token',
  USER: 'alumni_user',
} as const;
