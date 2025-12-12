import { apiClient } from './client';
import type {
  EventResponse,
  EventCreateRequest,
  EventListResponse,
  MessageResponse,
} from './types';

export const eventsApi = {
  // Get all events
  getEvents: async (params?: {
    page?: number;
    page_size?: number;
    category?: string;
    is_virtual?: boolean;
    registered_only?: boolean;
  }): Promise<EventListResponse> => {
    return apiClient.get<EventListResponse>('/events', params);
  },

  // Get single event
  getEvent: async (eventId: string): Promise<EventResponse> => {
    return apiClient.get<EventResponse>(`/events/${eventId}`);
  },

  // Create event (admin)
  createEvent: async (data: EventCreateRequest): Promise<EventResponse> => {
    return apiClient.post<EventResponse>('/events', data);
  },

  // Update event (admin)
  updateEvent: async (eventId: string, data: Partial<EventCreateRequest>): Promise<EventResponse> => {
    return apiClient.put<EventResponse>(`/events/${eventId}`, data);
  },

  // Delete event (admin)
  deleteEvent: async (eventId: string): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse>(`/events/${eventId}`);
  },

  // Register for event
  registerForEvent: async (eventId: string): Promise<MessageResponse> => {
    return apiClient.post<MessageResponse>(`/events/${eventId}/register`);
  },

  // Unregister from event
  unregisterFromEvent: async (eventId: string): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse>(`/events/${eventId}/register`);
  },

  // Get my registered events
  getMyEvents: async (): Promise<EventListResponse> => {
    return apiClient.get<EventListResponse>('/events/my-events');
  },
};

