import { apiClient } from './client';
import type {
  UniversityResponse,
  FundraiserResponse,
  AdResponse,
  MessageResponse,
} from './types';

export const universitiesApi = {
  // Get all universities (public)
  getUniversities: async (): Promise<{ universities: UniversityResponse[]; total: number }> => {
    return apiClient.get('/universities');
  },

  // Get single university
  getUniversity: async (universityId: string): Promise<UniversityResponse> => {
    return apiClient.get<UniversityResponse>(`/universities/${universityId}`);
  },

  // Get university branding
  getBranding: async (universityId: string): Promise<UniversityResponse> => {
    return apiClient.get<UniversityResponse>(`/universities/${universityId}/branding`);
  },

  // Get university fundraisers (uses admin endpoint)
  getFundraisers: async (universityId: string): Promise<FundraiserResponse[]> => {
    try {
      return await apiClient.get<FundraiserResponse[]>('/admin/fundraisers');
    } catch {
      return []; // Return empty array if not authorized or error
    }
  },

  // Get active fundraisers
  getActiveFundraisers: async (universityId: string): Promise<FundraiserResponse[]> => {
    try {
      const fundraisers = await apiClient.get<FundraiserResponse[]>('/admin/fundraisers');
      return fundraisers.filter(f => f.is_active);
    } catch {
      return []; // Return empty array if not authorized or error
    }
  },

  // Get university ads
  getAds: async (universityId?: string): Promise<AdResponse[]> => {
    const params = universityId ? { university_id: universityId } : undefined;
    return apiClient.get<AdResponse[]>('/ads', params);
  },
};

