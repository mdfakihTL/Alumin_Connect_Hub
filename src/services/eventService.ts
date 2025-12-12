import { apiClient, API_ENDPOINTS, ApiClientError } from '@/lib/api';
import {
  ApiEvent,
  ApiEventRegistration,
  CreateEventRequest,
  UpdateEventRequest,
  ListEventsParams,
  EventStatus,
} from '@/types/events';

export const eventService = {
  /**
   * Get paginated list of events
   * This is a public endpoint - auth is optional
   */
  async listEvents(params: ListEventsParams = {}): Promise<ApiEvent[]> {
    const { skip = 0, limit = 100, status, university_id } = params;
    
    let endpoint = `${API_ENDPOINTS.EVENTS.LIST}?skip=${skip}&limit=${limit}`;
    if (status) {
      endpoint += `&status=${status}`;
    }
    if (university_id) {
      endpoint += `&university_id=${university_id}`;
    }
    
    return apiClient<ApiEvent[]>(endpoint, {
      method: 'GET',
      requireAuth: false, // Public endpoint
    });
  },

  /**
   * Get a single event by ID
   * This is a public endpoint - auth is optional
   */
  async getEvent(eventId: number): Promise<ApiEvent> {
    return apiClient<ApiEvent>(API_ENDPOINTS.EVENTS.GET_BY_ID(eventId), {
      method: 'GET',
      requireAuth: false, // Public endpoint
    });
  },

  /**
   * Create a new event
   * Requires authentication
   */
  async createEvent(data: CreateEventRequest): Promise<ApiEvent> {
    return apiClient<ApiEvent>(API_ENDPOINTS.EVENTS.CREATE, {
      method: 'POST',
      body: data,
      requireAuth: true,
    });
  },

  /**
   * Update an existing event
   * Requires authentication - only creator can update
   */
  async updateEvent(eventId: number, data: UpdateEventRequest): Promise<ApiEvent> {
    return apiClient<ApiEvent>(API_ENDPOINTS.EVENTS.UPDATE(eventId), {
      method: 'PUT',
      body: data,
      requireAuth: true,
    });
  },

  /**
   * Delete an event
   * Requires authentication - only creator or admin can delete
   */
  async deleteEvent(eventId: number): Promise<void> {
    return apiClient<void>(API_ENDPOINTS.EVENTS.DELETE(eventId), {
      method: 'DELETE',
      requireAuth: true,
    });
  },

  /**
   * Register for an event
   * Requires authentication
   */
  async registerForEvent(eventId: number): Promise<ApiEventRegistration> {
    return apiClient<ApiEventRegistration>(API_ENDPOINTS.EVENTS.REGISTER(eventId), {
      method: 'POST',
      requireAuth: true,
    });
  },

  /**
   * Unregister from an event
   * Requires authentication
   */
  async unregisterFromEvent(eventId: number): Promise<void> {
    return apiClient<void>(API_ENDPOINTS.EVENTS.UNREGISTER(eventId), {
      method: 'DELETE',
      requireAuth: true,
    });
  },

  /**
   * Get list of attendees for an event
   * Requires authentication
   */
  async getEventAttendees(eventId: number): Promise<ApiEventRegistration[]> {
    return apiClient<ApiEventRegistration[]>(API_ENDPOINTS.EVENTS.ATTENDEES(eventId), {
      method: 'GET',
      requireAuth: true,
    });
  },

  /**
   * Get events the current user has registered for
   * Helper method that filters events by registration status
   */
  async getMyRegisteredEvents(): Promise<ApiEvent[]> {
    const allEvents = await this.listEvents();
    return allEvents.filter(event => event.is_registered);
  },

  /**
   * Get upcoming events only
   */
  async getUpcomingEvents(limit: number = 10): Promise<ApiEvent[]> {
    return this.listEvents({ status: 'upcoming', limit });
  },

  /**
   * Check if registration deadline has passed
   */
  isRegistrationOpen(event: ApiEvent): boolean {
    if (event.status !== 'upcoming') {
      return false;
    }
    
    if (event.registration_deadline) {
      const deadline = new Date(event.registration_deadline);
      if (deadline < new Date()) {
        return false;
      }
    }
    
    if (event.max_attendees && event.attendee_count !== undefined) {
      if (event.attendee_count >= event.max_attendees) {
        return false;
      }
    }
    
    return true;
  },

  /**
   * Get event status display info
   */
  getEventStatusInfo(status: EventStatus): { label: string; color: string; bgColor: string } {
    const statusMap: Record<EventStatus, { label: string; color: string; bgColor: string }> = {
      upcoming: { 
        label: 'Upcoming', 
        color: 'text-blue-700 dark:text-blue-400', 
        bgColor: 'bg-blue-500/10' 
      },
      ongoing: { 
        label: 'Happening Now', 
        color: 'text-green-700 dark:text-green-400', 
        bgColor: 'bg-green-500/10' 
      },
      completed: { 
        label: 'Completed', 
        color: 'text-gray-700 dark:text-gray-400', 
        bgColor: 'bg-gray-500/10' 
      },
      cancelled: { 
        label: 'Cancelled', 
        color: 'text-red-700 dark:text-red-400', 
        bgColor: 'bg-red-500/10' 
      },
    };
    // Return a fallback for unknown status values
    return statusMap[status] || { 
      label: status || 'Unknown', 
      color: 'text-gray-700 dark:text-gray-400', 
      bgColor: 'bg-gray-500/10' 
    };
  },
};

// Re-export ApiClientError for error handling in components
export { ApiClientError };

