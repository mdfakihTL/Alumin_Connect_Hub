// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Types matching backend schemas
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  university_id?: string;
  graduation_year?: number;
  major?: string;
  role: string;
  is_mentor: boolean;
  is_active: boolean;
  created_at: string;
}

export interface UniversityBrandingColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface UniversityBrandingTheme {
  light: UniversityBrandingColors;
  dark: UniversityBrandingColors;
}

export interface UniversityBrandingResponse {
  id: string;
  name: string;
  logo?: string;
  colors?: UniversityBrandingTheme;
  is_enabled: boolean;
}

export interface TokenResponse {
  access_token: string;
  user: UserResponse;
  university?: UniversityBrandingResponse;
  universities?: UniversityBrandingResponse[]; // For superadmin
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  university_id?: string;
  graduation_year?: number;
  major?: string;
}

export interface UserProfileResponse {
  id: string;
  user_id: string;
  bio?: string;
  phone?: string;
  location?: string;
  job_title?: string;
  company?: string;
  linkedin?: string;
  website?: string;
  banner?: string;
  connections_count: number;
  posts_count: number;
  experience?: string;
  education?: string;
}

export interface UserWithProfileResponse extends UserResponse {
  profile?: UserProfileResponse;
  university_name?: string;
  university?: UniversityBrandingResponse;
}

// Event types matching backend schemas
export interface EventResponse {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  attendees: number;
  image?: string;
  description?: string;
  is_virtual: boolean;
  meeting_link?: string;
  organizer: string;
  category?: string;
  is_registered: boolean;
  created_at: string;
}

export interface EventListResponse {
  events: EventResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface EventCreate {
  title: string;
  description?: string;
  image?: string;
  event_date: string;
  event_time?: string;
  location?: string;
  is_virtual: boolean;
  meeting_link?: string;
  category?: string;
  max_attendees?: number;
}

export interface EventUpdate {
  title?: string;
  description?: string;
  image?: string;
  event_date?: string;
  event_time?: string;
  location?: string;
  is_virtual?: boolean;
  meeting_link?: string;
  category?: string;
  max_attendees?: number;
  is_active?: boolean;
}

// API Client
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await this.request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.access_token);
    return response;
  }

  async register(data: RegisterRequest): Promise<TokenResponse> {
    const response = await this.request<TokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.access_token);
    return response;
  }

  async getCurrentUser(): Promise<UserWithProfileResponse> {
    return this.request<UserWithProfileResponse>('/auth/me');
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.request('/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return { success: true, message: 'Password reset email sent' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to request password reset' };
    }
  }

  async logout() {
    this.setToken(null);
  }

  // Event endpoints
  async getEvents(page: number = 1, pageSize: number = 20, filters?: {
    university_id?: string;
    category?: string;
    is_virtual?: boolean;
    search?: string;
  }): Promise<EventListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (filters?.university_id) params.append('university_id', filters.university_id);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.is_virtual !== undefined) params.append('is_virtual', filters.is_virtual.toString());
    if (filters?.search) params.append('search', filters.search);
    
    return this.request<EventListResponse>(`/events?${params.toString()}`);
  }

  async getEvent(eventId: string): Promise<EventResponse> {
    return this.request<EventResponse>(`/events/${eventId}`);
  }

  async createEvent(data: EventCreate): Promise<EventResponse> {
    return this.request<EventResponse>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvent(eventId: string, data: EventUpdate): Promise<EventResponse> {
    return this.request<EventResponse>(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(eventId: string): Promise<{ message: string; success: boolean }> {
    return this.request<{ message: string; success: boolean }>(`/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  async registerForEvent(eventId: string): Promise<{ message: string; success: boolean; attendees: number }> {
    return this.request<{ message: string; success: boolean; attendees: number }>(`/events/${eventId}/register`, {
      method: 'POST',
    });
  }

  async unregisterFromEvent(eventId: string): Promise<{ message: string; success: boolean; attendees: number }> {
    return this.request<{ message: string; success: boolean; attendees: number }>(`/events/${eventId}/register`, {
      method: 'DELETE',
    });
  }

  async getRegisteredEvents(page: number = 1, pageSize: number = 20): Promise<EventListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    return this.request<EventListResponse>(`/events/registered/me?${params.toString()}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

