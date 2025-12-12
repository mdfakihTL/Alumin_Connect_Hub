import { apiClient } from './client';
import type {
  MentorResponse,
  MessageResponse,
} from './types';

export interface MentorFilters {
  expertise?: string;
  availability?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export const mentorsApi = {
  // Get available mentors
  getMentors: async (params?: MentorFilters): Promise<{ mentors: MentorResponse[]; total: number }> => {
    return apiClient.get('/mentors', params);
  },

  // Get mentor by ID
  getMentor: async (mentorId: string): Promise<MentorResponse> => {
    return apiClient.get<MentorResponse>(`/mentors/${mentorId}`);
  },

  // Get my mentor profile (if I'm a mentor)
  getMyMentorProfile: async (): Promise<MentorResponse> => {
    return apiClient.get<MentorResponse>('/mentors/me');
  },

  // Update my mentor profile
  updateMyMentorProfile: async (data: Partial<{
    title: string;
    company: string;
    location: string;
    bio: string;
    expertise: string[];
    availability: string;
  }>): Promise<MentorResponse> => {
    return apiClient.put<MentorResponse>('/mentors/me', data);
  },

  // Request mentorship
  requestMentorship: async (mentorId: string, message?: string): Promise<MessageResponse> => {
    return apiClient.post<MessageResponse>(`/mentors/${mentorId}/request`, { message });
  },

  // Get my mentorship requests (as mentee)
  getMyMentorshipRequests: async (): Promise<{ requests: any[] }> => {
    return apiClient.get('/mentors/my-requests');
  },

  // Get mentorship requests to me (as mentor)
  getIncomingRequests: async (): Promise<{ requests: any[] }> => {
    return apiClient.get('/mentors/incoming-requests');
  },

  // Accept mentorship request
  acceptMentorshipRequest: async (requestId: string): Promise<MessageResponse> => {
    return apiClient.put<MessageResponse>(`/mentors/requests/${requestId}/accept`);
  },

  // Reject mentorship request
  rejectMentorshipRequest: async (requestId: string): Promise<MessageResponse> => {
    return apiClient.put<MessageResponse>(`/mentors/requests/${requestId}/reject`);
  },
};

