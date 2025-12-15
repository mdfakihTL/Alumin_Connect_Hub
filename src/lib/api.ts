// API Configuration
// Use environment variable if set, otherwise detect based on hostname
const getApiBaseURL = () => {
  // If explicitly set, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Auto-detect: if on Vercel/production, use Render backend
  if (window.location.hostname.includes('vercel.app') || 
      window.location.hostname.includes('alumni-portal')) {
    return 'https://alumni-portal-yw7q.onrender.com/api/v1';
  }
  
  // Default to localhost for development
  return 'http://localhost:8000/api/v1';
};

const API_BASE_URL = getApiBaseURL();

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

    // CRITICAL: Bypass service worker for API calls
    // Use cache: 'no-store' to prevent service worker interception
    const response = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store', // Don't cache API responses
      credentials: 'omit', // Don't send credentials (prevents SW issues)
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

  // University endpoints
  async getUniversity(universityId: string): Promise<UniversityBrandingResponse> {
    return this.request<UniversityBrandingResponse>(`/universities/${universityId}`);
  }

  async updateUniversityBranding(
    universityId: string,
    branding: {
      light_primary?: string;
      light_secondary?: string;
      light_accent?: string;
      dark_primary?: string;
      dark_secondary?: string;
      dark_accent?: string;
    }
  ): Promise<UniversityBrandingResponse> {
    return this.request<UniversityBrandingResponse>(`/universities/${universityId}/branding`, {
      method: 'PUT',
      body: JSON.stringify(branding),
    });
  }

  async updateUniversity(
    universityId: string,
    data: {
      name?: string;
      logo?: string;
      is_enabled?: boolean;
    }
  ): Promise<UniversityBrandingResponse> {
    return this.request<UniversityBrandingResponse>(`/universities/${universityId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Document endpoints
  async getDocumentRequests(statusFilter?: string, page: number = 1, pageSize: number = 20): Promise<{
    requests: Array<{
      id: string;
      document_type: string;
      reason?: string;
      status: string;
      requested_at: string;
      estimated_completion?: string;
    }>;
    total: number;
    page: number;
    page_size: number;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (statusFilter) params.append('status_filter', statusFilter);
    return this.request(`/documents/requests?${params.toString()}`);
  }

  async createDocumentRequest(data: {
    document_type: string;
    reason?: string;
  }): Promise<{
    id: string;
    document_type: string;
    reason?: string;
    status: string;
    requested_at: string;
    estimated_completion?: string;
  }> {
    return this.request('/documents/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelDocumentRequest(requestId: string): Promise<{ message: string; success: boolean }> {
    return this.request(`/documents/requests/${requestId}`, {
      method: 'DELETE',
    });
  }

  // Admin document endpoints
  async getAdminDocumentRequests(statusFilter?: string, page: number = 1, pageSize: number = 20): Promise<{
    requests: Array<{
      id: string;
      user_id: string;
      user_name: string;
      user_email: string;
      document_type: string;
      reason?: string;
      status: string;
      requested_at: string;
      estimated_completion?: string;
    }>;
    total: number;
    page: number;
    page_size: number;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (statusFilter) params.append('status_filter', statusFilter);
    return this.request(`/admin/documents?${params.toString()}`);
  }

  async updateDocumentRequestStatus(
    requestId: string,
    status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed'
  ): Promise<{ message: string; success: boolean }> {
    // Backend expects new_status as a query parameter
    const params = new URLSearchParams({ new_status: status });
    return this.request(`/admin/documents/${requestId}/status?${params.toString()}`, {
      method: 'PUT',
    });
  }

  // Post endpoints
  async getPosts(page: number = 1, pageSize: number = 20, filters?: {
    university_id?: string;
    post_type?: string;
    tag?: string;
    author_id?: string;
  }): Promise<{
    posts: Array<{
      id: string;
      author: { id: string; name: string; avatar?: string; title?: string; company?: string };
      type: string;
      content: string;
      media_url?: string;
      video_url?: string;
      thumbnail_url?: string;
      tag?: string;
      job_title?: string;
      company?: string;
      location?: string;
      likes_count: number;
      comments_count: number;
      shares_count: number;
      is_liked: boolean;
      time: string;
      created_at: string;
    }>;
    total: number;
    page: number;
    page_size: number;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (filters?.university_id) params.append('university_id', filters.university_id);
    if (filters?.post_type) params.append('post_type', filters.post_type);
    if (filters?.tag) params.append('tag', filters.tag);
    if (filters?.author_id) params.append('author_id', filters.author_id);
    
    return this.request(`/posts/?${params.toString()}`);
  }

  async createPost(data: {
    type?: string;
    content: string;
    media_url?: string;
    video_url?: string;
    thumbnail_url?: string;
    tag?: string;
    job_title?: string;
    company?: string;
    location?: string;
  }): Promise<any> {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadMedia(file: File, mediaType: 'image' | 'video'): Promise<{ url: string; type: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', mediaType);

    const url = `${this.baseURL}/posts/upload-media`;
    const headers: HeadersInit = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    // DO NOT set Content-Type header - browser will set it automatically with boundary for FormData

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      cache: 'no-store', // Force network request
      credentials: 'omit', // Avoid CORS issues
    });

    if (!response.ok) {
      let errorMessage = `Upload failed with status ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.detail || error.message || errorMessage;
      } catch {
        errorMessage = await response.text().catch(() => errorMessage);
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async deletePost(postId: string): Promise<{ message: string; success: boolean }> {
    return this.request(`/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  // Lead Intelligence endpoints (super admin only)
  async getLeadIntelligence(filters?: {
    university_id?: string;
    min_score?: number;
    category?: 'hot' | 'warm' | 'cold';
  }): Promise<Array<{
    user_id: string;
    user_name: string;
    user_email: string;
    university_id: string;
    university_name: string;
    graduation_year?: number;
    major?: string;
    ad_clicks: number;
    ad_impressions: number;
    clicked_ads: string[];
    last_ad_interaction?: string;
    roadmap_views: number;
    roadmap_generated: number;
    career_goals: string[];
    ad_engagement_score: number;
    career_engagement_score: number;
    overall_lead_score: number;
    lead_category: string;
  }>> {
    const params = new URLSearchParams();
    if (filters?.university_id) params.append('university_id', filters.university_id);
    if (filters?.min_score) params.append('min_score', filters.min_score.toString());
    if (filters?.category) params.append('category', filters.category);
    
    return this.request(`/lead-intelligence/leads?${params.toString()}`);
  }

  async getTopAds(limit: number = 10): Promise<Array<{
    ad_id: string;
    ad_title: string;
    clicks: number;
    impressions: number;
    ctr: number;
  }>> {
    const params = new URLSearchParams({ limit: limit.toString() });
    return this.request(`/lead-intelligence/top-ads?${params.toString()}`);
  }

  async getCareerPaths(limit: number = 10): Promise<Array<{
    career_goal: string;
    requests: number;
    views: number;
  }>> {
    const params = new URLSearchParams({ limit: limit.toString() });
    return this.request(`/lead-intelligence/career-paths?${params.toString()}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

