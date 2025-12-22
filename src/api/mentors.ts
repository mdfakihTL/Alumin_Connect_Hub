import { apiClient } from './client';

export interface MentorProfile {
  id: string;
  user_id: string;
  name: string;
  avatar?: string;
  title?: string;
  company?: string;
  university?: string;
  graduation_year?: string;
  location?: string;
  expertise: string[];
  bio?: string;
  availability: 'High' | 'Medium' | 'Low';
  match_score: number;
  mentees_count: number;
  years_experience: number;
}

export interface MentorListResponse {
  mentors: MentorProfile[];
  total: number;
}

export interface MentorMatchResponse {
  id: string;
  mentor_id: string;
  mentor_user_id: string;  // User ID for messaging
  mentor_name: string;
  mentor_avatar?: string;
  mentor_title?: string;
  mentor_company?: string;
  status: string;
  matched_at: string;
}

export interface MyMatchesResponse {
  matches: MentorMatchResponse[];
  total: number;
}

export const mentorsApi = {
  /**
   * Get available mentors for the current user
   */
  getAvailableMentors: async (params?: {
    page?: number;
    page_size?: number;
    expertise?: string;
  }): Promise<MentorListResponse> => {
    return apiClient.get<MentorListResponse>('/mentors/available', params);
  },

  /**
   * Create a mentor match (swipe right)
   */
  createMatch: async (mentorId: string): Promise<{ message: string; success: boolean; match_id: string }> => {
    return apiClient.post('/mentors/match', { mentor_id: mentorId });
  },

  /**
   * Get user's matched mentors
   */
  getMyMatches: async (): Promise<MyMatchesResponse> => {
    return apiClient.get<MyMatchesResponse>('/mentors/my-matches');
  },

  /**
   * Remove a mentor match
   */
  removeMatch: async (matchId: string): Promise<{ message: string; success: boolean }> => {
    return apiClient.delete(`/mentors/match/${matchId}`);
  },

  /**
   * Get mentor details
   */
  getMentorDetails: async (mentorId: string): Promise<MentorProfile> => {
    return apiClient.get<MentorProfile>(`/mentors/${mentorId}`);
  },
};
