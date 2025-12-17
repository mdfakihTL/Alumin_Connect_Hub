import { apiClient } from './client';
import type {
  MessageResponse,
  UserResponse,
  EventResponse,
  GroupResponse,
  FundraiserResponse,
  AdResponse,
  SupportTicketResponse,
  DocumentRequestResponse,
} from './types';

// Dashboard stats
export interface AdminDashboardStats {
  total_alumni: number;
  active_mentors: number;
  pending_documents: number;
  upcoming_events: number;
  password_resets: number;
  active_groups: number;
  active_fundraisers: number;
  open_tickets: number;
}

// User management types
export interface AlumniUserCreate {
  email: string;
  password: string;
  name: string;
  graduation_year?: number;
  major?: string;
}

export interface AlumniUserResponse {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  graduation_year?: number;
  major?: string;
  is_mentor: boolean;
  is_active: boolean;
  job_title?: string;
  company?: string;
  created_at: string;
}

export interface BulkImportResponse {
  success_count: number;
  failed_count: number;
  errors: string[];
}

export interface PasswordResetRequest {
  id: string;
  user_name: string;
  user_email: string;
  requested_at: string;
}

export const adminApi = {
  // Dashboard
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    return apiClient.get<AdminDashboardStats>('/admin/dashboard');
  },

  // User Management
  getUsers: async (params?: {
    search?: string;
    graduation_year?: number;
    major?: string;
    is_mentor?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<{ users: AlumniUserResponse[]; total: number; page: number; page_size: number }> => {
    return apiClient.get('/admin/users', params);
  },

  createUser: async (data: AlumniUserCreate): Promise<AlumniUserResponse> => {
    return apiClient.post<AlumniUserResponse>('/admin/users', data);
  },

  bulkImportUsers: async (users: AlumniUserCreate[]): Promise<BulkImportResponse> => {
    return apiClient.post<BulkImportResponse>('/admin/users/bulk-import', users);
  },

  deactivateUser: async (userId: string): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse>(`/admin/users/${userId}`);
  },

  // Password Resets
  getPasswordResets: async (params?: {
    page?: number;
    page_size?: number;
  }): Promise<{ requests: PasswordResetRequest[]; total: number; page: number; page_size: number }> => {
    return apiClient.get('/admin/password-resets', params);
  },

  resetUserPassword: async (userId: string, newPassword: string): Promise<MessageResponse> => {
    return apiClient.post<MessageResponse>(`/admin/password-resets/${userId}/reset`, { new_password: newPassword });
  },

  // Documents
  getDocumentRequests: async (params?: {
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ requests: any[]; total: number; page: number; page_size: number }> => {
    return apiClient.get('/admin/documents', params);
  },

  updateDocumentStatus: async (requestId: string, status: string): Promise<MessageResponse> => {
    return apiClient.put<MessageResponse>(`/admin/documents/${requestId}/status`, undefined);
  },

  // Support Tickets
  getTickets: async (params?: {
    status?: string;
    priority?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ tickets: any[]; total: number; page: number; page_size: number }> => {
    return apiClient.get('/admin/tickets', params);
  },

  updateTicketStatus: async (ticketId: string, status: string): Promise<MessageResponse> => {
    return apiClient.put<MessageResponse>(`/admin/tickets/${ticketId}/status`, undefined);
  },

  respondToTicket: async (ticketId: string, message: string): Promise<MessageResponse> => {
    return apiClient.post<MessageResponse>(`/admin/tickets/${ticketId}/respond`, undefined, { message });
  },

  // Fundraisers
  getFundraisers: async (): Promise<FundraiserResponse[]> => {
    return apiClient.get<FundraiserResponse[]>('/admin/fundraisers');
  },

  createFundraiser: async (data: any): Promise<FundraiserResponse> => {
    return apiClient.post<FundraiserResponse>('/admin/fundraisers', data);
  },

  updateFundraiser: async (fundraiserId: string, data: any): Promise<FundraiserResponse> => {
    return apiClient.put<FundraiserResponse>(`/admin/fundraisers/${fundraiserId}`, data);
  },

  deleteFundraiser: async (fundraiserId: string): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse>(`/admin/fundraisers/${fundraiserId}`);
  },

  // Ads
  getAds: async (): Promise<AdResponse[]> => {
    return apiClient.get<AdResponse[]>('/admin/ads');
  },

  createAd: async (data: any): Promise<AdResponse> => {
    return apiClient.post<AdResponse>('/admin/ads', data);
  },

  updateAd: async (adId: string, data: any): Promise<AdResponse> => {
    return apiClient.put<AdResponse>(`/admin/ads/${adId}`, data);
  },

  deleteAd: async (adId: string): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse>(`/admin/ads/${adId}`);
  },

  // University Branding
  updateBranding: async (data: {
    name?: string;
    logo?: string;
    colors?: any;
  }): Promise<MessageResponse> => {
    return apiClient.put<MessageResponse>('/admin/branding', data);
  },
};

