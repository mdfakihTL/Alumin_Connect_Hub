/**
 * Lead Intelligence API Client
 * Connects to the backend lead intelligence endpoints
 */
import { apiClient } from './client';

// Types
export interface FunnelMetrics {
  total_leads: number;
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
  conversion_rate: number;
  avg_lead_score: number;
  hot_percentage: number;
}

export interface EngagementMetrics {
  ad_views: number;
  ad_clicks: number;
  ctr: number;
  roadmap_views: number;
  roadmap_generates: number;
  mentor_connects: number;
  feed_likes: number;
  feed_comments: number;
  feed_shares: number;
  total_feed_engagement: number;
}

export interface ScoreDistribution {
  avg_ad_score: number;
  avg_career_score: number;
  avg_feed_score: number;
  avg_mentor_score: number;
}

export interface AnalyticsOverview {
  funnel: FunnelMetrics;
  engagement: EngagementMetrics;
  score_distribution: ScoreDistribution;
}

export interface UniversityComparison {
  university_id: string;
  university_name: string;
  total_leads: number;
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
  avg_score: number;
  hot_percentage: number;
}

export interface CareerItem {
  career: string;
  count?: number;
  views?: number;
  connects?: number;
}

export interface CareerIntelligence {
  most_requested: CareerItem[];
  most_viewed: CareerItem[];
  highest_conversion: CareerItem[];
}

export interface TrendItem {
  month: string;
  year: number;
  ad_engagement: number;
  career_engagement: number;
  feed_engagement: number;
  mentor_engagement: number;
  total_engagement: number;
  new_leads: number;
}

export interface TopAd {
  ad_id: string;
  ad_title: string;
  clicks: number;
  impressions: number;
  ctr: number;
}

export interface AIInsight {
  type: string;
  category: string;
  title: string;
  description: string;
  impact_score: number;
  confidence_score: number;
  related_data: Record<string, any>;
}

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar?: string;
  university_id?: string;
  university_name: string;
  graduation_year?: number;
  major?: string;
  job_title?: string;
  company?: string;
  location?: string;
  
  overall_score: number;
  lead_category: 'hot' | 'warm' | 'cold';
  ad_engagement_score: number;
  career_engagement_score: number;
  feed_engagement_score: number;
  mentor_engagement_score: number;
  
  total_activities: number;
  activities_last_7_days: number;
  activities_last_30_days: number;
  engagement_multiplier: number;
  
  primary_career_interest?: string;
  career_interests: string[];
  conversion_probability: number;
  
  last_activity_at?: string;
  score_updated_at?: string;
}

export interface LeadsListResponse {
  leads: Lead[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface University {
  id: string;
  name: string;
}

// API Functions
export const leadIntelligenceApi = {
  // Get analytics overview
  getAnalyticsOverview: async (params?: {
    university_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<AnalyticsOverview> => {
    return apiClient.get<AnalyticsOverview>('/lead-intelligence/analytics/overview', params);
  },

  // Get university comparison
  getUniversityComparison: async (): Promise<UniversityComparison[]> => {
    return apiClient.get<UniversityComparison[]>('/lead-intelligence/analytics/university-comparison');
  },

  // Get career intelligence
  getCareerIntelligence: async (params?: {
    university_id?: string;
    limit?: number;
  }): Promise<CareerIntelligence> => {
    return apiClient.get<CareerIntelligence>('/lead-intelligence/analytics/career-intelligence', params);
  },

  // Get monthly trends
  getTrends: async (params?: {
    university_id?: string;
    months?: number;
  }): Promise<TrendItem[]> => {
    return apiClient.get<TrendItem[]>('/lead-intelligence/analytics/trends', params);
  },

  // Get top performing ads
  getTopAds: async (params?: {
    university_id?: string;
    limit?: number;
  }): Promise<TopAd[]> => {
    return apiClient.get<TopAd[]>('/lead-intelligence/analytics/top-ads', params);
  },

  // Get AI insights
  getAIInsights: async (params?: {
    university_id?: string;
  }): Promise<AIInsight[]> => {
    return apiClient.get<AIInsight[]>('/lead-intelligence/ai-insights', params);
  },

  // Get leads list
  getLeads: async (params?: {
    university_id?: string;
    category?: 'hot' | 'warm' | 'cold';
    min_score?: number;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<LeadsListResponse> => {
    return apiClient.get<LeadsListResponse>('/lead-intelligence/leads', params);
  },

  // Refresh lead scores
  refreshScores: async (university_id?: string): Promise<{ message: string; updated_count: number }> => {
    return apiClient.post('/lead-intelligence/leads/refresh-scores', null, { university_id });
  },

  // Get universities for filter
  getUniversities: async (): Promise<University[]> => {
    return apiClient.get<University[]>('/lead-intelligence/universities');
  },

  // Export leads CSV
  exportLeadsCSV: async (params?: {
    university_id?: string;
    category?: string;
    min_score?: number;
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.university_id) queryParams.append('university_id', params.university_id);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.min_score !== undefined) queryParams.append('min_score', String(params.min_score));
    
    const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/lead-intelligence/export/leads?${queryParams}`,
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

  // Export analytics CSV
  exportAnalyticsCSV: async (university_id?: string): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (university_id) queryParams.append('university_id', university_id);
    
    const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/lead-intelligence/export/analytics?${queryParams}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to export analytics');
    }
    
    return response.blob();
  },
};

