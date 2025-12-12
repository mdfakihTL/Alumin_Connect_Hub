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

  // Get university fundraisers
  getFundraisers: async (universityId: string): Promise<FundraiserResponse[]> => {
    return apiClient.get<FundraiserResponse[]>(`/universities/${universityId}/fundraisers`);
  },

  // Get active fundraisers
  getActiveFundraisers: async (universityId: string): Promise<FundraiserResponse[]> => {
    return apiClient.get<FundraiserResponse[]>(`/universities/${universityId}/fundraisers/active`);
  },

  // Get university ads
  getAds: async (universityId?: string): Promise<AdResponse[]> => {
    const params = universityId ? { university_id: universityId } : undefined;
    return apiClient.get<AdResponse[]>('/ads', params);
  },
};

