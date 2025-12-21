/**
 * Course Intelligence API Client
 * For selling courses to leads - UG vs PG differentiation
 */
import { apiClient } from './client';

// Types
export interface Course {
  id: string;
  name: string;
  short_name?: string;
  level: 'ug' | 'pg' | 'certificate' | 'executive' | 'diploma';
  category: string;
  price: number;
  duration_months: number;
  format: string;
  provider_name?: string;
  is_featured: boolean;
  avg_rating: number;
  conversion_rate: number;
}

export interface CourseRecommendation {
  course_id: string;
  course_name: string;
  course_level: string;
  course_category: string;
  provider?: string;
  price: number;
  duration_months: number;
  format: string;
  interest_score: number;
  purchase_probability: number;
  recommendation_reason: string;
  ad_clicks: number;
  ad_views: number;
  is_featured: boolean;
  rank: number;
}

export interface LevelMetrics {
  course_count: number;
  interested_leads: number;
  conversions: number;
  revenue: number;
  conversion_rate: number;
}

export interface TopCourse {
  id: string;
  name: string;
  level: string;
  category: string;
  interested_leads: number;
  price: number;
  conversion_rate: number;
}

export interface CourseAnalytics {
  by_level: Record<string, LevelMetrics>;
  top_courses: TopCourse[];
  total_courses: number;
}

export interface AdCoursePerformance {
  ad_id: string;
  ad_title: string;
  course_id: string;
  course_name: string;
  course_level: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversion_rate: number;
}

export interface LeadCourseInterest {
  user_id: string;
  user_name: string;
  user_email: string;
  graduation_year?: number;
  job_title?: string;
  company?: string;
  
  course_id: string;
  course_name: string;
  course_level: string;
  
  interest_score: number;
  purchase_probability: number;
  recommendation_reason?: string;
  ad_clicks: number;
  ad_views: number;
  
  lead_category: 'hot' | 'warm' | 'cold';
  overall_lead_score: number;
  
  has_contacted: boolean;
  has_enrolled: boolean;
}

export interface UgVsPgComparison {
  ug: LevelDetail;
  pg: LevelDetail;
  executive: LevelDetail;
  certificate: LevelDetail;
}

export interface LevelDetail {
  label: string;
  description: string;
  count: number;
  interested_leads: number;
  high_intent_leads: number;
  avg_price: number;
  total_revenue_potential: number;
  top_course?: string;
}

// API Functions
export const courseIntelligenceApi = {
  // Get all courses
  getCourses: async (params?: {
    level?: string;
    category?: string;
    is_featured?: boolean;
  }): Promise<Course[]> => {
    return apiClient.get<Course[]>('/course-intelligence/courses', params);
  },

  // Get course levels with counts
  getCourseLevels: async (): Promise<Record<string, { name: string; count: number; description: string }>> => {
    return apiClient.get('/course-intelligence/courses/levels');
  },

  // Get course categories
  getCourseCategories: async (): Promise<Record<string, { name: string; count: number }>> => {
    return apiClient.get('/course-intelligence/courses/categories');
  },

  // Get course analytics
  getAnalytics: async (level?: string): Promise<CourseAnalytics> => {
    return apiClient.get<CourseAnalytics>('/course-intelligence/analytics', { level });
  },

  // Get UG vs PG comparison
  getUgVsPgComparison: async (): Promise<UgVsPgComparison> => {
    return apiClient.get<UgVsPgComparison>('/course-intelligence/analytics/ug-vs-pg');
  },

  // Get ad-course performance
  getAdCoursePerformance: async (limit?: number): Promise<AdCoursePerformance[]> => {
    return apiClient.get<AdCoursePerformance[]>('/course-intelligence/analytics/ad-performance', { limit });
  },

  // Get leads by course interest
  getLeadsByCourseInterest: async (params?: {
    course_id?: string;
    level?: string;
    min_score?: number;
    limit?: number;
  }): Promise<LeadCourseInterest[]> => {
    return apiClient.get<LeadCourseInterest[]>('/course-intelligence/leads', params);
  },

  // Get course recommendations for a specific user
  getUserRecommendations: async (userId: string, params?: {
    level?: string;
    limit?: number;
  }): Promise<CourseRecommendation[]> => {
    return apiClient.get<CourseRecommendation[]>(`/course-intelligence/leads/${userId}/recommendations`, params);
  },

  // Refresh user recommendations
  refreshUserRecommendations: async (userId: string): Promise<{ message: string }> => {
    return apiClient.post(`/course-intelligence/leads/${userId}/refresh-recommendations`);
  },

  // Mark lead as contacted
  markLeadContacted: async (userId: string, courseId: string): Promise<{ message: string }> => {
    return apiClient.post(`/course-intelligence/leads/${userId}/mark-contacted`, null, { course_id: courseId });
  },

  // Mark lead as enrolled
  markLeadEnrolled: async (userId: string, courseId: string, revenue?: number): Promise<{ message: string }> => {
    return apiClient.post(`/course-intelligence/leads/${userId}/mark-enrolled`, null, { 
      course_id: courseId, 
      revenue: revenue || 0 
    });
  },

  // Generate seed data
  generateSeedData: async (): Promise<{ message: string; courses_created: number; interactions_generated: number }> => {
    return apiClient.post('/course-intelligence/seed-data');
  },

  // Export leads CSV
  exportLeadsCSV: async (params?: {
    level?: string;
    min_score?: number;
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.level) queryParams.append('level', params.level);
    if (params?.min_score !== undefined) queryParams.append('min_score', String(params.min_score));
    
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

// Helper functions
export const getLevelLabel = (level: string): string => {
  const labels: Record<string, string> = {
    'ug': 'Undergraduate',
    'pg': 'Postgraduate',
    'certificate': 'Certificate',
    'executive': 'Executive',
    'diploma': 'Diploma',
  };
  return labels[level] || level;
};

export const getLevelColor = (level: string): string => {
  const colors: Record<string, string> = {
    'ug': 'bg-blue-500',
    'pg': 'bg-purple-500',
    'certificate': 'bg-green-500',
    'executive': 'bg-amber-500',
    'diploma': 'bg-cyan-500',
  };
  return colors[level] || 'bg-gray-500';
};

export const getCategoryLabel = (category: string): string => {
  return category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

