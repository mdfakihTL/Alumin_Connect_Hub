/**
 * Fundraiser API Client
 * 
 * Handles all fundraiser-related API calls for both admin and alumni users.
 * - Admin: CRUD operations, analytics
 * - Alumni: View active fundraisers, track clicks
 */

import { apiClient } from '@/lib/api';

// ============ TYPES ============

export interface Fundraiser {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  donation_link: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'expired';
  effective_status: string;
  total_clicks: number;
  unique_clicks: number;
  created_at: string | null;
  // Legacy compatibility
  goal_amount: number;
  current_amount: number;
  is_active: boolean;
}

export interface FundraiserListResponse {
  fundraisers: Fundraiser[];
  total: number;
  page: number;
  page_size: number;
}

export interface FundraiserCreate {
  title: string;
  description: string;
  image?: string;
  donation_link: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
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

export interface FundraiserClickCreate {
  fundraiser_id: string;
  session_id?: string;
}

export interface FundraiserClickResponse {
  id: string;
  fundraiser_id: string;
  user_id: string | null;
  clicked_at: string;
  redirect_url: string;
}

export interface ClickByDate {
  date: string;
  clicks: number;
}

export interface FundraiserAnalytics {
  fundraiser_id: string;
  title: string;
  total_clicks: number;
  unique_alumni_clicks: number;
  clicks_by_date: ClickByDate[];
  status: string;
}

export interface FundraiserAnalyticsSummary {
  total_fundraisers: number;
  active_fundraisers: number;
  total_clicks: number;
  unique_alumni: number;
  top_fundraisers: FundraiserAnalytics[];
}

// ============ API CLIENT ============

export const fundraiserApi = {
  // ============ ADMIN ENDPOINTS ============

  /**
   * List all fundraisers for admin with analytics
   */
  listAdmin: async (params?: {
    page?: number;
    page_size?: number;
    status_filter?: string;
  }): Promise<FundraiserListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.status_filter) queryParams.append('status_filter', params.status_filter);
    
    const query = queryParams.toString();
    return apiClient.get<FundraiserListResponse>(`/fundraisers/admin${query ? `?${query}` : ''}`);
  },

  /**
   * Create a new fundraiser
   */
  create: async (data: FundraiserCreate): Promise<Fundraiser> => {
    return apiClient.post<Fundraiser>('/fundraisers/admin', data);
  },

  /**
   * Update an existing fundraiser
   */
  update: async (id: string, data: FundraiserUpdate): Promise<Fundraiser> => {
    return apiClient.put<Fundraiser>(`/fundraisers/admin/${id}`, data);
  },

  /**
   * Delete a fundraiser
   */
  delete: async (id: string): Promise<{ message: string; success: boolean }> => {
    return apiClient.delete<{ message: string; success: boolean }>(`/fundraisers/admin/${id}`);
  },

  /**
   * Get overall analytics summary
   */
  getAnalyticsSummary: async (): Promise<FundraiserAnalyticsSummary> => {
    return apiClient.get<FundraiserAnalyticsSummary>('/fundraisers/admin/analytics');
  },

  /**
   * Get detailed analytics for a specific fundraiser
   */
  getAnalytics: async (id: string): Promise<FundraiserAnalytics> => {
    return apiClient.get<FundraiserAnalytics>(`/fundraisers/admin/${id}/analytics`);
  },

  /**
   * Upload an image for a fundraiser
   * Returns the S3 URL of the uploaded image
   */
  uploadImage: async (file: File): Promise<{ url: string; filename: string; message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Get token - check both possible keys
    const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Not authenticated. Please log in again.');
    }
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/fundraisers/admin/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Failed to upload image');
    }
    
    return response.json();
  },

  // ============ ALUMNI ENDPOINTS ============

  /**
   * List active fundraisers for alumni
   */
  listActive: async (): Promise<Fundraiser[]> => {
    return apiClient.get<Fundraiser[]>('/fundraisers/active');
  },

  /**
   * Get a single fundraiser by ID
   */
  getById: async (id: string): Promise<Fundraiser> => {
    return apiClient.get<Fundraiser>(`/fundraisers/${id}`);
  },

  /**
   * Track a click on a fundraiser donation link
   */
  trackClick: async (fundraiserId: string, sessionId?: string): Promise<FundraiserClickResponse> => {
    return apiClient.post<FundraiserClickResponse>('/fundraisers/click', {
      fundraiser_id: fundraiserId,
      session_id: sessionId || generateSessionId(),
    });
  },
};

// ============ HELPERS ============

/**
 * Generate a unique session ID for click tracking
 */
function generateSessionId(): string {
  const stored = sessionStorage.getItem('fundraiser_session_id');
  if (stored) return stored;
  
  const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  sessionStorage.setItem('fundraiser_session_id', newId);
  return newId;
}

/**
 * Check if a fundraiser is currently active
 */
export function isFundraiserActive(fundraiser: Fundraiser): boolean {
  if (fundraiser.status !== 'active') return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = new Date(fundraiser.start_date);
  const endDate = new Date(fundraiser.end_date);
  
  return startDate <= today && endDate >= today;
}

/**
 * Get days remaining for a fundraiser
 */
export function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const today = new Date();
  const diff = end.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

export default fundraiserApi;

