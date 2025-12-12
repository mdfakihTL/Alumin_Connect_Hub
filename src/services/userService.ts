import { apiClient, API_ENDPOINTS, ApiClientError } from '@/lib/api';
import { ApiUser } from '@/types/auth';

// Pagination parameters for listing users
export interface ListUsersParams {
  skip?: number;
  limit?: number;
}

// User service response wrapper for consistent state handling
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
}

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

export const userService = {
  /**
   * List all users with pagination (Admin only)
   * @param params - Pagination parameters (skip, limit)
   * @returns Array of users
   */
  async listUsers(params: ListUsersParams = {}): Promise<ApiUser[]> {
    const { skip = 0, limit = 100 } = params;
    const queryString = buildQueryString({ skip, limit });
    
    try {
      const users = await apiClient<ApiUser[]>(
        `${API_ENDPOINTS.USERS.LIST}${queryString}`,
        {
          method: 'GET',
          requireAuth: true,
        }
      );
      return users;
    } catch (error) {
      if (error instanceof ApiClientError) {
        // Handle specific error cases
        if (error.status === 401) {
          throw new Error('You must be logged in to view users');
        }
        if (error.status === 403) {
          throw new Error('You do not have permission to view users. Admin access required.');
        }
        throw new Error(error.message || 'Failed to load users');
      }
      throw new Error('An unexpected error occurred while loading users');
    }
  },

  /**
   * Get a specific user by ID (Admin only)
   * @param userId - The user's ID
   * @returns The user details
   */
  async getUserById(userId: number): Promise<ApiUser> {
    try {
      const user = await apiClient<ApiUser>(
        API_ENDPOINTS.USERS.GET_BY_ID(userId),
        {
          method: 'GET',
          requireAuth: true,
        }
      );
      return user;
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          throw new Error('You must be logged in to view user details');
        }
        if (error.status === 403) {
          throw new Error('You do not have permission to view this user. Admin access required.');
        }
        if (error.status === 404) {
          throw new Error('User not found');
        }
        throw new Error(error.message || 'Failed to load user details');
      }
      throw new Error('An unexpected error occurred while loading user details');
    }
  },

  /**
   * List users with pagination - returns all pages
   * Useful when you need to fetch all users across multiple pages
   * @param pageSize - Number of users per page
   * @returns All users
   */
  async listAllUsers(pageSize: number = 100): Promise<ApiUser[]> {
    const allUsers: ApiUser[] = [];
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const users = await this.listUsers({ skip, limit: pageSize });
      allUsers.push(...users);
      
      // If we got fewer than pageSize users, we've reached the end
      if (users.length < pageSize) {
        hasMore = false;
      } else {
        skip += pageSize;
      }
    }

    return allUsers;
  },
};

// Export types for components to use
export type { ApiUser };
