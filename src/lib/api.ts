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

export interface AdResponse {
  id: string;
  title: string;
  description?: string;
  image?: string;
  link?: string;
  placement: 'left-sidebar' | 'right-sidebar' | 'feed';
  target_universities?: string[];
  is_active: boolean;
  impressions: number;
  clicks: number;
  created_at?: string;
  type?: string;
  // Legacy fields for compatibility
  media_url?: string;
  link_url?: string;
}

// Public ad response (for alumni users)
export interface PublicAdResponse {
  id: string;
  title: string;
  description?: string;
  image?: string;
  link?: string;
  media_url?: string;
  link_url?: string;
  placement: string;
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

    // Always get fresh token from localStorage to ensure we have the latest
    const currentToken = localStorage.getItem('auth_token') || this.token;
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
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
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        // Clear invalid token
        this.setToken(null);
        localStorage.removeItem('auth_token');
        // Try to get error message
        const error = await response.json().catch(() => ({ detail: 'Unauthorized. Please login again.' }));
        throw new Error(error.detail || 'Session expired. Please login again.');
      }
      
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Public methods for external API modules
  public async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  public async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
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
    // Also clear user data from localStorage
    localStorage.removeItem('alumni_user');
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

  // Post endpoints - using /feed/posts path
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
      can_edit: boolean;
      can_delete: boolean;
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
    
    return this.request(`/feed/posts?${params.toString()}`);
  }

  async getPost(postId: string): Promise<{
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
    can_edit: boolean;
    can_delete: boolean;
    time: string;
    created_at: string;
  }> {
    return this.request(`/feed/posts/${postId}`);
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
    return this.request('/feed/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePost(postId: string, data: {
    content?: string;
    media_url?: string;
    video_url?: string;
    thumbnail_url?: string;
    tag?: string;
    job_title?: string;
    company?: string;
    location?: string;
  }): Promise<any> {
    return this.request(`/feed/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadMedia(file: File, mediaType: 'image' | 'video'): Promise<{ url: string; type: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', mediaType);

    const url = `${this.baseURL}/feed/posts/upload-media`;
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

  async uploadDocument(file: File): Promise<{ url: string; filename: string; type: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseURL}/documents/upload`;
    const headers: HeadersInit = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      cache: 'no-store',
      credentials: 'omit',
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
    return this.request(`/feed/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  // Like/Unlike posts
  async likePost(postId: string): Promise<{ likes_count: number; is_liked: boolean }> {
    return this.request(`/feed/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async unlikePost(postId: string): Promise<{ likes_count: number; is_liked: boolean }> {
    return this.request(`/feed/posts/${postId}/like`, {
      method: 'DELETE',
    });
  }

  // Comment endpoints
  async getComments(postId: string): Promise<Array<{
    id: string;
    content: string;
    author: { id: string; name: string; avatar?: string };
    created_at: string;
    time: string;
  }>> {
    return this.request(`/feed/posts/${postId}/comments`);
  }

  async createComment(postId: string, content: string): Promise<{
    id: string;
    content: string;
    author: { id: string; name: string; avatar?: string };
    created_at: string;
    time: string;
  }> {
    return this.request(`/feed/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(postId: string, commentId: string): Promise<{ message: string }> {
    return this.request(`/feed/posts/${postId}/comments/${commentId}`, {
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

  // SuperAdmin Advertisement Management
  async getAds(includeInactive: boolean = true): Promise<{
    ads: AdResponse[];
    total: number;
    active_count: number;
  }> {
    const params = new URLSearchParams({ include_inactive: includeInactive.toString() });
    return this.request(`/superadmin/ads?${params.toString()}`);
  }

  async getAd(adId: string): Promise<AdResponse> {
    return this.request(`/superadmin/ads/${adId}`);
  }

  async createAd(data: {
    title: string;
    description?: string;
    image: string;
    link?: string;
    placement: 'left-sidebar' | 'right-sidebar' | 'feed';
    target_universities?: string[];
  }): Promise<AdResponse> {
    return this.request('/superadmin/ads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAd(adId: string, data: {
    title?: string;
    description?: string;
    image?: string;
    link?: string;
    placement?: 'left-sidebar' | 'right-sidebar' | 'feed';
    target_universities?: string[];
    is_active?: boolean;
  }): Promise<AdResponse> {
    return this.request(`/superadmin/ads/${adId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleAdStatus(adId: string): Promise<AdResponse> {
    return this.request(`/superadmin/ads/${adId}/toggle`, {
      method: 'PATCH',
    });
  }

  async deleteAd(adId: string): Promise<{ message: string; success: boolean }> {
    return this.request(`/superadmin/ads/${adId}`, {
      method: 'DELETE',
    });
  }

  async recordAdImpression(adId: string): Promise<{ success: boolean }> {
    return this.request(`/superadmin/ads/${adId}/impression`, {
      method: 'POST',
    });
  }

  async recordAdClick(adId: string): Promise<{ success: boolean }> {
    return this.request(`/superadmin/ads/${adId}/click`, {
      method: 'POST',
    });
  }

  // SuperAdmin Universities (for ad targeting)
  async getSuperAdminUniversities(): Promise<Array<{
    id: string;
    name: string;
    logo?: string;
    is_enabled: boolean;
    alumni_count: number;
    admin_count: number;
  }>> {
    return this.request('/superadmin/universities');
  }

  // ============ SUPERADMIN ADMIN MANAGEMENT ============
  
  async getSuperAdminAdmins(params?: {
    university_id?: string;
    search?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<{
    admins: Array<{
      id: string;
      name: string;
      email: string;
      avatar?: string;
      university_id?: string;
      university_name: string;
      is_active: boolean;
      force_password_reset: boolean;
      temp_password_expires_at?: string;
      created_at: string;
    }>;
    total: number;
    page: number;
    page_size: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.university_id) queryParams.append('university_id', params.university_id);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    
    const query = queryParams.toString();
    return this.request(`/superadmin/admins${query ? `?${query}` : ''}`);
  }

  async createSuperAdminAdmin(data: {
    email: string;
    name: string;
    university_id: string;
    password?: string;
  }): Promise<{
    id: string;
    name: string;
    email: string;
    university_id: string;
    university_name: string;
    is_active: boolean;
    force_password_reset: boolean;
    created_at: string;
    generated_password?: string;  // Generated password returned from backend
  }> {
    return this.request('/superadmin/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async toggleSuperAdminAdminStatus(adminId: string): Promise<{
    message: string;
    success: boolean;
    is_active: boolean;
  }> {
    return this.request(`/superadmin/admins/${adminId}/toggle-status`, {
      method: 'PUT',
    });
  }

  async deleteSuperAdminAdmin(adminId: string): Promise<{ message: string; success: boolean }> {
    return this.request(`/superadmin/admins/${adminId}`, {
      method: 'DELETE',
    });
  }

  // ============ SUPERADMIN PASSWORD RESETS ============
  
  async getSuperAdminPasswordResets(params?: {
    status_filter?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    requests: Array<{
      id: string;
      admin_id: string;
      admin_name: string;
      admin_email: string;
      university_id?: string;
      university_name: string;
      status: 'pending' | 'approved' | 'rejected';
      requested_at: string;
      processed_at?: string;
      processed_by_name?: string;
      rejection_reason?: string;
    }>;
    total: number;
    pending_count: number;
    approved_count: number;
    rejected_count: number;
    page: number;
    page_size: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.status_filter) queryParams.append('status_filter', params.status_filter);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    
    const query = queryParams.toString();
    return this.request(`/superadmin/password-resets${query ? `?${query}` : ''}`);
  }

  async approveSuperAdminPasswordReset(requestId: string): Promise<{
    message: string;
    success: boolean;
    request_id: string;
    new_password?: string;  // Generated password returned from backend
  }> {
    return this.request(`/superadmin/password-resets/${requestId}/approve`, {
      method: 'POST',
    });
  }

  async rejectSuperAdminPasswordReset(requestId: string, reason?: string): Promise<{
    message: string;
    success: boolean;
    request_id: string;
  }> {
    return this.request(`/superadmin/password-resets/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // ============ SUPERADMIN AUDIT LOGS ============
  
  async getSuperAdminAuditLogs(params?: {
    action_filter?: string;
    target_user_id?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    logs: Array<{
      id: string;
      action: string;
      performed_by_name: string;
      target_user_name?: string;
      details?: string;
      ip_address?: string;
      created_at: string;
    }>;
    total: number;
    page: number;
    page_size: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.action_filter) queryParams.append('action_filter', params.action_filter);
    if (params?.target_user_id) queryParams.append('target_user_id', params.target_user_id);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    
    const query = queryParams.toString();
    return this.request(`/superadmin/audit-logs${query ? `?${query}` : ''}`);
  }

  // Public Ads endpoints (for alumni users)
  async getAdsForUser(): Promise<{
    feed_ads: PublicAdResponse[];
    left_sidebar_ads: PublicAdResponse[];
    right_sidebar_ads: PublicAdResponse[];
  }> {
    return this.request('/ads/for-user');
  }

  async getPublicAds(placement?: 'feed' | 'left-sidebar' | 'right-sidebar'): Promise<PublicAdResponse[]> {
    const params = placement ? `?placement=${placement}` : '';
    return this.request(`/ads${params}`);
  }

  async recordUserAdImpression(adId: string): Promise<{ success: boolean }> {
    return this.request(`/ads/${adId}/impression`, {
      method: 'POST',
    });
  }

  async recordUserAdClick(adId: string): Promise<{ success: boolean }> {
    return this.request(`/ads/${adId}/click`, {
      method: 'POST',
    });
  }

  // ============ NOTIFICATIONS API ============
  
  async getNotifications(params?: {
    type_filter?: string;
    unread_only?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<{
    notifications: NotificationResponse[];
    total: number;
    unread_count: number;
    page: number;
    page_size: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.type_filter) queryParams.append('type_filter', params.type_filter);
    if (params?.unread_only) queryParams.append('unread_only', 'true');
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    
    const query = queryParams.toString();
    return this.request(`/notifications${query ? `?${query}` : ''}`);
  }

  async getUnreadNotificationCount(): Promise<{ unread_count: number }> {
    return this.request('/notifications/unread-count');
  }

  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(): Promise<{ success: boolean }> {
    return this.request('/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  async deleteNotification(notificationId: string): Promise<{ success: boolean }> {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  async clearAllNotifications(): Promise<{ success: boolean }> {
    return this.request('/notifications', {
      method: 'DELETE',
    });
  }

  // ============ USERS/CONNECTIONS API ============
  
  async getSuggestedConnections(limit: number = 5): Promise<SuggestedConnection[]> {
    return this.request(`/users/suggested-connections?limit=${limit}`);
  }

  async getMentors(params?: {
    page?: number;
    page_size?: number;
    search?: string;
  }): Promise<{
    mentors: MentorResponse[];
    total: number;
    page: number;
    page_size: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return this.request(`/users/mentors${query ? `?${query}` : ''}`);
  }

  // ============ ADMIN USER MANAGEMENT API ============
  
  async getAdminUsers(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    role?: string;
  }): Promise<{
    users: Array<{
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
    }>;
    total: number;
    page: number;
    page_size: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    
    const query = queryParams.toString();
    return this.request(`/admin/users${query ? `?${query}` : ''}`);
  }

  async createAdminUser(data: {
    email: string;
    name: string;
    password: string;
    graduation_year?: number;
    major?: string;
    is_mentor?: boolean;
  }): Promise<UserResponse> {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAdminUser(userId: string, data: {
    name?: string;
    graduation_year?: number;
    major?: string;
    is_mentor?: boolean;
    is_active?: boolean;
  }): Promise<UserResponse> {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminUser(userId: string): Promise<{ message: string; success: boolean }> {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async bulkCreateUsers(users: Array<{
    email: string;
    name: string;
    password: string;
    graduation_year?: number;
    major?: string;
  }>): Promise<{
    success_count: number;
    failed_count: number;
    errors: string[];
  }> {
    // Backend expects direct array, not wrapped in { users: [...] }
    return this.request('/admin/users/bulk-import', {
      method: 'POST',
      body: JSON.stringify(users),
    });
  }

  // Alias for bulkCreateUsers (used by AdminUserManagement component)
  async bulkImportUsers(users: Array<{
    email: string;
    name: string;
    password: string;
    graduation_year?: number;
    major?: string;
  }>): Promise<{
    success_count: number;
    failed_count: number;
    errors: string[];
  }> {
    return this.bulkCreateUsers(users);
  }
}

// Notification Response Interface
export interface NotificationResponse {
  id: string;
  type: 'like' | 'comment' | 'connection' | 'event' | 'job' | 'announcement';
  title: string;
  message: string;
  avatar?: string;
  read: boolean;
  time: string;
  created_at: string;
  action_url?: string;
  related_id?: string;
}

// Suggested Connection Interface
export interface SuggestedConnection {
  id: string;
  name: string;
  title?: string;
  company?: string;
  avatar?: string;
  university?: string;
  graduation_year?: string;
  major?: string;
  mutual_connections: number;
  match_reasons?: string[];
}

// Mentor Response Interface
export interface MentorResponse {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  title?: string;
  company?: string;
  major?: string;
  graduation_year?: string;
  location?: string;
  phone?: string;
  bio?: string;
  expertise?: string[];
}

// ============ FUNDRAISER TYPES ============

export interface FundraiserResponse {
  id: string;
  title: string;
  description?: string;
  image?: string;
  donation_link: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'expired';
  effective_status: string;
  total_clicks: number;
  unique_clicks: number;
  created_at?: string;
  // Legacy compatibility
  goal_amount?: number;
  current_amount?: number;
  is_active?: boolean;
}

export interface FundraiserListResponse {
  fundraisers: FundraiserResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface FundraiserCreate {
  title: string;
  description: string;
  image?: string;
  donation_link: string;
  start_date: string;
  end_date: string;
  status?: 'draft' | 'active' | 'expired';
}

export interface FundraiserUpdate {
  title?: string;
  description?: string;
  image?: string;
  donation_link?: string;
  start_date?: string;
  end_date?: string;
  status?: 'draft' | 'active' | 'expired';
}

export interface FundraiserClickResponse {
  id: string;
  fundraiser_id: string;
  user_id?: string;
  clicked_at: string;
  redirect_url: string;
}

export interface FundraiserAnalytics {
  fundraiser_id: string;
  title: string;
  total_clicks: number;
  unique_alumni_clicks: number;
  clicks_by_date: Array<{ date: string; clicks: number }>;
  status: string;
}

export interface FundraiserAnalyticsSummary {
  total_fundraisers: number;
  active_fundraisers: number;
  total_clicks: number;
  unique_alumni: number;
  top_fundraisers: FundraiserAnalytics[];
}

// ============ FUNDRAISER API ============

export const fundraiserApi = {
  // Admin endpoints
  listAdmin: async (params?: { page?: number; page_size?: number; status?: string }): Promise<FundraiserListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.status) queryParams.append('status_filter', params.status);
    const query = queryParams.toString();
    return apiClient.get(`/fundraisers/admin${query ? `?${query}` : ''}`);
  },

  create: async (data: FundraiserCreate): Promise<FundraiserResponse> => {
    return apiClient.post('/fundraisers/admin', data);
  },

  update: async (id: string, data: FundraiserUpdate): Promise<FundraiserResponse> => {
    return apiClient.put(`/fundraisers/admin/${id}`, data);
  },

  delete: async (id: string): Promise<{ message: string; success: boolean }> => {
    return apiClient.delete(`/fundraisers/admin/${id}`);
  },

  getAnalyticsSummary: async (): Promise<FundraiserAnalyticsSummary> => {
    return apiClient.get('/fundraisers/admin/analytics');
  },

  getAnalytics: async (id: string): Promise<FundraiserAnalytics> => {
    return apiClient.get(`/fundraisers/admin/${id}/analytics`);
  },

  // Alumni endpoints
  listActive: async (): Promise<FundraiserResponse[]> => {
    return apiClient.get('/fundraisers/active');
  },

  trackClick: async (fundraiserId: string, sessionId?: string): Promise<FundraiserClickResponse> => {
    return apiClient.post('/fundraisers/click', { fundraiser_id: fundraiserId, session_id: sessionId });
  },

  get: async (id: string): Promise<FundraiserResponse> => {
    return apiClient.get(`/fundraisers/${id}`);
  },
};

export const apiClient = new ApiClient(API_BASE_URL);

