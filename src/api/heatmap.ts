/**
 * Heat Map API Client
 * Provides methods for alumni discovery map functionality
 */
import { apiClient } from '@/lib/api';

export interface HeatmapCluster {
  geohash: string;
  count: number;
  latitude: number;
  longitude: number;
  precision: number;
}

export interface HeatmapAggregateResponse {
  clusters: HeatmapCluster[];
  total_clusters: number;
  zoom_level: number;
  timestamp: string;
}

export interface AlumniMarker {
  id: string;
  name: string;
  avatar?: string;
  graduation_year?: number;
  major?: string;
  university_id?: string;
  university_name?: string;
  job_title?: string;
  company?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface DrilldownResponse {
  alumni: AlumniMarker[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface HeatmapStats {
  total_discoverable: number;
  top_countries: Array<{
    country: string;
    code: string;
    count: number;
  }>;
}

export interface HeatmapFilters {
  universities?: Array<{ id: string; name: string }>;
  graduation_years?: number[];
  countries?: Array<{ code: string; name: string }>;
  majors?: string[];
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  country_code?: string;
}

export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export const heatmapApi = {
  /**
   * Get aggregated heatmap data based on zoom level
   * Available to both Alumni and Admin users
   */
  getAggregate: async (params: {
    zoom: number;
    bounds?: ViewportBounds;
    university_id?: string;
    graduation_year?: number;
    country?: string;
    major?: string;
  }): Promise<HeatmapAggregateResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('zoom', params.zoom.toString());
    
    if (params.bounds) {
      queryParams.append('north', params.bounds.north.toString());
      queryParams.append('south', params.bounds.south.toString());
      queryParams.append('east', params.bounds.east.toString());
      queryParams.append('west', params.bounds.west.toString());
    }
    
    if (params.university_id) queryParams.append('university_id', params.university_id);
    if (params.graduation_year) queryParams.append('graduation_year', params.graduation_year.toString());
    if (params.country) queryParams.append('country', params.country);
    if (params.major) queryParams.append('major', params.major);
    
    return apiClient.get(`/heatmap/aggregate?${queryParams.toString()}`);
  },

  /**
   * Get individual alumni data for drill-down view
   * ALUMNI ONLY - Not available to Admin users
   */
  getDrilldown: async (params: {
    geohash?: string;
    bounds?: ViewportBounds;
    university_id?: string;
    graduation_year?: number;
    country?: string;
    major?: string;
    page?: number;
    page_size?: number;
  }): Promise<DrilldownResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.geohash) queryParams.append('geohash', params.geohash);
    
    if (params.bounds) {
      queryParams.append('north', params.bounds.north.toString());
      queryParams.append('south', params.bounds.south.toString());
      queryParams.append('east', params.bounds.east.toString());
      queryParams.append('west', params.bounds.west.toString());
    }
    
    if (params.university_id) queryParams.append('university_id', params.university_id);
    if (params.graduation_year) queryParams.append('graduation_year', params.graduation_year.toString());
    if (params.country) queryParams.append('country', params.country);
    if (params.major) queryParams.append('major', params.major);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.page_size) queryParams.append('page_size', params.page_size.toString());
    
    return apiClient.get(`/heatmap/drilldown?${queryParams.toString()}`);
  },

  /**
   * Get heatmap statistics
   */
  getStats: async (university_id?: string): Promise<HeatmapStats> => {
    const query = university_id ? `?university_id=${university_id}` : '';
    return apiClient.get(`/heatmap/stats${query}`);
  },

  /**
   * Get available filter options
   */
  getFilters: async (): Promise<HeatmapFilters> => {
    return apiClient.get('/heatmap/filters');
  },

  /**
   * Update current user's location
   */
  updateLocation: async (data: UpdateLocationRequest): Promise<{
    success: boolean;
    message: string;
    location?: string;
    geohash?: string;
  }> => {
    return apiClient.post('/heatmap/location', data);
  },

  /**
   * Update privacy settings
   */
  updatePrivacy: async (params: {
    is_discoverable?: boolean;
    show_exact_location?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    is_discoverable: boolean;
    show_exact_location: boolean;
  }> => {
    const queryParams = new URLSearchParams();
    if (params.is_discoverable !== undefined) {
      queryParams.append('is_discoverable', params.is_discoverable.toString());
    }
    if (params.show_exact_location !== undefined) {
      queryParams.append('show_exact_location', params.show_exact_location.toString());
    }
    return apiClient.put(`/heatmap/privacy?${queryParams.toString()}`);
  },
};

// Helper: Calculate intensity color based on count
export function getHeatIntensity(count: number, maxCount: number): string {
  const ratio = Math.min(count / maxCount, 1);
  
  if (ratio < 0.2) return 'rgba(0, 255, 0, 0.6)';      // Green - low
  if (ratio < 0.4) return 'rgba(173, 255, 47, 0.7)';  // Yellow-green
  if (ratio < 0.6) return 'rgba(255, 255, 0, 0.7)';   // Yellow
  if (ratio < 0.8) return 'rgba(255, 165, 0, 0.8)';   // Orange
  return 'rgba(255, 0, 0, 0.9)';                       // Red - high
}

// Helper: Calculate marker size based on count
export function getClusterSize(count: number): number {
  if (count < 10) return 30;
  if (count < 50) return 40;
  if (count < 100) return 50;
  if (count < 500) return 60;
  return 70;
}

