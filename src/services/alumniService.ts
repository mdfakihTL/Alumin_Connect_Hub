import { apiClient, API_ENDPOINTS, ApiClientError } from '@/lib/api';
import {
  AlumniProfile,
  UpdateAlumniProfileRequest,
  ListAlumniParams,
  FrontendAlumniProfile,
  mapAlumniProfileToFrontend,
  mapFrontendToUpdateRequest,
} from '@/types/alumni';

// Build query string from params
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export const alumniService = {
  /**
   * Get current user's alumni profile
   * @returns The alumni profile for the logged-in user
   */
  async getMyProfile(): Promise<FrontendAlumniProfile> {
    try {
      const profile = await apiClient<AlumniProfile>(
        API_ENDPOINTS.ALUMNI.ME,
        {
          method: 'GET',
          requireAuth: true,
        }
      );
      return mapAlumniProfileToFrontend(profile);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          throw new Error('You must be logged in to view your profile');
        }
        if (error.status === 404) {
          throw new Error('Alumni profile not found. Please complete your profile setup.');
        }
        throw new Error(error.message || 'Failed to load profile');
      }
      throw new Error('An unexpected error occurred while loading your profile');
    }
  },

  /**
   * Update current user's alumni profile
   * @param profileData - The profile data to update
   * @returns The updated alumni profile
   */
  async updateMyProfile(profileData: Partial<FrontendAlumniProfile>): Promise<FrontendAlumniProfile> {
    try {
      const requestData = mapFrontendToUpdateRequest(profileData);
      const profile = await apiClient<AlumniProfile>(
        API_ENDPOINTS.ALUMNI.ME,
        {
          method: 'PUT',
          body: requestData,
          requireAuth: true,
        }
      );
      return mapAlumniProfileToFrontend(profile);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          throw new Error('You must be logged in to update your profile');
        }
        if (error.status === 404) {
          throw new Error('Alumni profile not found');
        }
        if (error.status === 422) {
          throw new Error('Invalid profile data. Please check your inputs.');
        }
        throw new Error(error.message || 'Failed to update profile');
      }
      throw new Error('An unexpected error occurred while updating your profile');
    }
  },

  /**
   * List all alumni profiles (public endpoint)
   * @param params - Pagination parameters (skip, limit)
   * @returns Array of alumni profiles
   */
  async listAlumniProfiles(params: ListAlumniParams = {}): Promise<FrontendAlumniProfile[]> {
    const { skip = 0, limit = 100 } = params;
    const queryString = buildQueryString({ skip, limit });
    
    try {
      const profiles = await apiClient<AlumniProfile[]>(
        `${API_ENDPOINTS.ALUMNI.LIST}${queryString}`,
        {
          method: 'GET',
          requireAuth: false, // Public endpoint
        }
      );
      return profiles.map(mapAlumniProfileToFrontend);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw new Error(error.message || 'Failed to load alumni directory');
      }
      throw new Error('An unexpected error occurred while loading alumni directory');
    }
  },

  /**
   * Get an alumni profile by ID (public endpoint)
   * @param alumniId - The alumni profile ID
   * @returns The alumni profile
   */
  async getAlumniProfileById(alumniId: number): Promise<FrontendAlumniProfile> {
    try {
      const profile = await apiClient<AlumniProfile>(
        API_ENDPOINTS.ALUMNI.GET_BY_ID(alumniId),
        {
          method: 'GET',
          requireAuth: false, // Public endpoint
        }
      );
      return mapAlumniProfileToFrontend(profile);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 404) {
          throw new Error('Alumni profile not found');
        }
        throw new Error(error.message || 'Failed to load alumni profile');
      }
      throw new Error('An unexpected error occurred while loading alumni profile');
    }
  },

  /**
   * List all alumni profiles with pagination support
   * Fetches all pages automatically
   * @param pageSize - Number of profiles per page
   * @returns All alumni profiles
   */
  async listAllAlumniProfiles(pageSize: number = 100): Promise<FrontendAlumniProfile[]> {
    const allProfiles: FrontendAlumniProfile[] = [];
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const profiles = await this.listAlumniProfiles({ skip, limit: pageSize });
      allProfiles.push(...profiles);
      
      // If we got fewer than pageSize profiles, we've reached the end
      if (profiles.length < pageSize) {
        hasMore = false;
      } else {
        skip += pageSize;
      }
    }

    return allProfiles;
  },

  /**
   * Search alumni profiles by various criteria (client-side)
   * @param profiles - Array of profiles to search
   * @param query - Search query
   * @returns Filtered profiles matching the search query
   */
  searchAlumniProfiles(profiles: FrontendAlumniProfile[], query: string): FrontendAlumniProfile[] {
    if (!query.trim()) return profiles;
    
    const lowerQuery = query.toLowerCase();
    return profiles.filter(profile => {
      const searchableFields = [
        profile.major,
        profile.degree,
        profile.company,
        profile.currentPosition,
        profile.location,
        profile.bio,
        profile.graduationYear?.toString(),
      ].filter(Boolean);
      
      return searchableFields.some(field => 
        field?.toLowerCase().includes(lowerQuery)
      );
    });
  },

  /**
   * Filter alumni profiles by graduation year
   * @param profiles - Array of profiles to filter
   * @param year - Graduation year to filter by
   * @returns Filtered profiles
   */
  filterByGraduationYear(profiles: FrontendAlumniProfile[], year: number): FrontendAlumniProfile[] {
    return profiles.filter(profile => profile.graduationYear === year);
  },

  /**
   * Filter alumni profiles by company
   * @param profiles - Array of profiles to filter
   * @param company - Company name to filter by
   * @returns Filtered profiles
   */
  filterByCompany(profiles: FrontendAlumniProfile[], company: string): FrontendAlumniProfile[] {
    const lowerCompany = company.toLowerCase();
    return profiles.filter(profile => 
      profile.company?.toLowerCase().includes(lowerCompany)
    );
  },
};

// Export types for components
export type { FrontendAlumniProfile };
