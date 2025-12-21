/**
 * Course Intelligence API Client
 * For course lead management and predictions
 */
import { apiClient } from './client';

// Types
export interface Course {
  id: string;
  name: string;
  short_name?: string;
  course_type: 'ug' | 'pg' | 'executive' | 'certificate' | 'bootcamp';
  category: string;
  price: number;
  duration_months: number;
  format: string;
  min_experience_years: number;
  max_experience_years: number;
  tags: string[];
}

export interface CourseLead {
  lead_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  education_level?: string;
  years_experience?: number;
  course_id: string;
  course_name: string;
  course_type: string;
  overall_score: number;
  interest_score: number;
  fit_score: number;
  intent_score: number;
  lead_temperature: 'hot' | 'warm' | 'cold';
  purchase_probability: number;
  ad_clicks: number;
  recommendation_reasons: string[];
  last_interaction_at?: string;
}

export interface CourseTypeStats {
  total: number;
  hot: number;
  warm: number;
  cold: number;
}

export interface TopCourse {
  course_id: string;
  course_name: string;
  course_type: string;
  total_leads: number;
  hot_leads: number;
  avg_score: number;
}

export interface CourseAnalytics {
  total_leads: number;
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
  by_course_type: Record<string, CourseTypeStats>;
  top_courses: TopCourse[];
  avg_purchase_probability: number;
}

export interface LeadsListResponse {
  leads: CourseLead[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CourseRecommendation {
  course_id: string;
  course_name: string;
  course_type: string;
  category: string;
  price: number;
  duration_months: number;
  format: string;
  rank: number;
  confidence_score: number;
  reasons: string[];
}

export interface CourseTypeOption {
  value: string;
  label: string;
  description: string;
}

export interface PredictionResult {
  user_id: string;
  course_id: string;
  purchase_probability: number;
  overall_score: number;
  interest_score: number;
  fit_score: number;
  intent_score: number;
  lead_temperature: string;
  recommendation_reasons: string[];
}

// API Functions
export const courseIntelligenceApi = {
  // Get analytics overview
  getAnalytics: async (params?: {
    university_id?: string;
    course_type?: string;
  }): Promise<CourseAnalytics> => {
    return apiClient.get<CourseAnalytics>('/course-intelligence/analytics', params);
  },

  // Get UG course leads
  getUGLeads: async (params?: {
    university_id?: string;
    temperature?: 'hot' | 'warm' | 'cold';
    page?: number;
    page_size?: number;
  }): Promise<LeadsListResponse> => {
    return apiClient.get<LeadsListResponse>('/course-intelligence/leads/ug', params);
  },

  // Get PG course leads
  getPGLeads: async (params?: {
    university_id?: string;
    temperature?: 'hot' | 'warm' | 'cold';
    page?: number;
    page_size?: number;
  }): Promise<LeadsListResponse> => {
    return apiClient.get<LeadsListResponse>('/course-intelligence/leads/pg', params);
  },

  // Get Executive course leads
  getExecutiveLeads: async (params?: {
    university_id?: string;
    temperature?: 'hot' | 'warm' | 'cold';
    page?: number;
    page_size?: number;
  }): Promise<LeadsListResponse> => {
    return apiClient.get<LeadsListResponse>('/course-intelligence/leads/executive', params);
  },

  // Get Certificate course leads
  getCertificateLeads: async (params?: {
    university_id?: string;
    temperature?: 'hot' | 'warm' | 'cold';
    page?: number;
    page_size?: number;
  }): Promise<LeadsListResponse> => {
    return apiClient.get<LeadsListResponse>('/course-intelligence/leads/certificate', params);
  },

  // Get Bootcamp course leads
  getBootcampLeads: async (params?: {
    university_id?: string;
    temperature?: 'hot' | 'warm' | 'cold';
    page?: number;
    page_size?: number;
  }): Promise<LeadsListResponse> => {
    return apiClient.get<LeadsListResponse>('/course-intelligence/leads/bootcamp', params);
  },

  // Get all leads with filtering
  getAllLeads: async (params?: {
    university_id?: string;
    course_type?: string;
    temperature?: 'hot' | 'warm' | 'cold';
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<LeadsListResponse> => {
    return apiClient.get<LeadsListResponse>('/course-intelligence/leads/all', params);
  },

  // Get courses
  getCourses: async (params?: {
    course_type?: string;
    category?: string;
  }): Promise<Course[]> => {
    return apiClient.get<Course[]>('/course-intelligence/courses', params);
  },

  // Get course types
  getCourseTypes: async (): Promise<CourseTypeOption[]> => {
    return apiClient.get<CourseTypeOption[]>('/course-intelligence/courses/types');
  },

  // Get recommendations for a user
  getUserRecommendations: async (userId: string, limit?: number): Promise<CourseRecommendation[]> => {
    return apiClient.get<CourseRecommendation[]>(
      `/course-intelligence/recommendations/${userId}`,
      { limit }
    );
  },

  // Get purchase prediction
  getPrediction: async (userId: string, courseId: string): Promise<PredictionResult> => {
    return apiClient.post<PredictionResult>(
      `/course-intelligence/predict/${userId}/${courseId}`
    );
  },

  // Generate seed data
  generateSeedData: async (): Promise<{ message: string; counts: Record<string, number> }> => {
    return apiClient.post('/course-intelligence/seed-data');
  },

  // Export leads CSV
  exportLeadsCSV: async (params?: {
    course_type?: string;
    temperature?: string;
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.course_type) queryParams.append('course_type', params.course_type);
    if (params?.temperature) queryParams.append('temperature', params.temperature);
    
    const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/course-intelligence/export/leads?${queryParams}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to export leads');
    }
    
    return response.blob();
  },
};

// Helper to format course type labels
export const getCourseTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    ug: 'Undergraduate (UG)',
    pg: 'Postgraduate (PG)',
    executive: 'Executive Education',
    certificate: 'Certificate',
    bootcamp: 'Bootcamp',
  };
  return labels[type] || type;
};

// Helper to get course type color
export const getCourseTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    ug: 'bg-blue-500',
    pg: 'bg-purple-500',
    executive: 'bg-amber-500',
    certificate: 'bg-green-500',
    bootcamp: 'bg-cyan-500',
  };
  return colors[type] || 'bg-gray-500';
};
