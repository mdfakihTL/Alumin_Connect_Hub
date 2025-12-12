import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { eventService, ApiClientError } from '@/services/eventService';
import {
  ApiEvent,
  Event,
  EventFormData,
  EventStatus,
  transformApiEventToEvent,
  transformEventFormToApiRequest,
} from '@/types/events';

interface EventsContextType {
  // State
  events: Event[];
  registeredEvents: Event[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isRegistering: boolean;
  error: string | null;
  
  // Permissions
  canManageEvents: boolean; // Admin/SuperAdmin can create/edit/delete events
  
  // Actions
  fetchEvents: (status?: EventStatus) => Promise<void>;
  createEvent: (data: EventFormData) => Promise<Event | null>;
  updateEvent: (id: number, data: EventFormData) => Promise<Event | null>;
  deleteEvent: (id: number) => Promise<boolean>;
  registerForEvent: (id: number) => Promise<boolean>;
  unregisterFromEvent: (id: number) => Promise<boolean>;
  getEventById: (id: number) => Event | undefined;
  refreshEvents: () => Promise<void>;
  clearError: () => void;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, isAdmin, isSuperAdmin } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Permission: Admin and SuperAdmin can manage (create/edit/delete) events
  const canManageEvents = isAdmin || isSuperAdmin;

  // Transform API events to UI events
  const transformEvents = useCallback((apiEvents: ApiEvent[]): Event[] => {
    const userId = user?.id ? parseInt(user.id, 10) : undefined;
    return apiEvents.map(apiEvent => 
      transformApiEventToEvent(apiEvent, userId)
    );
  }, [user?.id]);

  // Fetch all events from API
  // Alumni can only see events for their university
  const fetchEvents = useCallback(async (status?: EventStatus) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Alumni users can only see events for their university
      const universityId = (!isAdmin && !isSuperAdmin && user?.universityId) 
        ? parseInt(user.universityId, 10) 
        : undefined;
      
      const apiEvents = await eventService.listEvents({ 
        status, 
        university_id: universityId 
      });
      const transformedEvents = transformEvents(apiEvents);
      setEvents(transformedEvents);
    } catch (err) {
      const message = err instanceof ApiClientError 
        ? err.message 
        : 'Failed to load events. Please try again.';
      setError(message);
      console.error('Error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [transformEvents, isAdmin, isSuperAdmin, user?.universityId]);

  // Refresh events (alias for fetchEvents)
  const refreshEvents = useCallback(async () => {
    await fetchEvents();
  }, [fetchEvents]);

  // Get registered events (computed)
  const registeredEvents = events.filter(event => event.isRegistered);

  // Create a new event (Admin/SuperAdmin only)
  const createEvent = useCallback(async (data: EventFormData): Promise<Event | null> => {
    if (!isAuthenticated) {
      setError('You must be logged in to create an event');
      return null;
    }

    if (!canManageEvents) {
      setError('Only administrators can create events');
      return null;
    }

    setIsCreating(true);
    setError(null);

    try {
      const apiRequest = transformEventFormToApiRequest(data);
      const apiEvent = await eventService.createEvent(apiRequest);
      const userId = user?.id ? parseInt(user.id, 10) : undefined;
      const newEvent = transformApiEventToEvent(apiEvent, userId);
      
      // Add to local state
      setEvents(prev => [newEvent, ...prev]);
      
      return newEvent;
    } catch (err) {
      const message = err instanceof ApiClientError 
        ? err.message 
        : 'Failed to create event. Please try again.';
      setError(message);
      console.error('Error creating event:', err);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [isAuthenticated, canManageEvents, user?.id]);

  // Update an existing event (Admin/SuperAdmin only)
  const updateEvent = useCallback(async (id: number, data: EventFormData): Promise<Event | null> => {
    if (!isAuthenticated) {
      setError('You must be logged in to update an event');
      return null;
    }

    if (!canManageEvents) {
      setError('Only administrators can edit events');
      return null;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const apiRequest = transformEventFormToApiRequest(data);
      const apiEvent = await eventService.updateEvent(id, apiRequest);
      const userId = user?.id ? parseInt(user.id, 10) : undefined;
      const updatedEvent = transformApiEventToEvent(apiEvent, userId);
      
      // Update local state
      setEvents(prev => prev.map(event => 
        event.id === id ? updatedEvent : event
      ));
      
      return updatedEvent;
    } catch (err) {
      const message = err instanceof ApiClientError 
        ? err.message 
        : 'Failed to update event. Please try again.';
      setError(message);
      console.error('Error updating event:', err);
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [isAuthenticated, canManageEvents, user?.id]);

  // Delete an event (Admin/SuperAdmin only)
  const deleteEvent = useCallback(async (id: number): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('You must be logged in to delete an event');
      return false;
    }

    if (!canManageEvents) {
      setError('Only administrators can delete events');
      return false;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await eventService.deleteEvent(id);
      
      // Remove from local state
      setEvents(prev => prev.filter(event => event.id !== id));
      
      return true;
    } catch (err) {
      const message = err instanceof ApiClientError 
        ? err.message 
        : 'Failed to delete event. Please try again.';
      setError(message);
      console.error('Error deleting event:', err);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [isAuthenticated, canManageEvents]);

  // Register for an event
  const registerForEvent = useCallback(async (id: number): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('You must be logged in to register for an event');
      return false;
    }

    setIsRegistering(true);
    setError(null);

    try {
      await eventService.registerForEvent(id);
      
      // Update local state
      setEvents(prev => prev.map(event => 
        event.id === id 
          ? { 
              ...event, 
              isRegistered: true, 
              attendeeCount: event.attendeeCount + 1,
              canRegister: false,
            } 
          : event
      ));
      
      return true;
    } catch (err) {
      const message = err instanceof ApiClientError 
        ? err.message 
        : 'Failed to register for event. Please try again.';
      setError(message);
      console.error('Error registering for event:', err);
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [isAuthenticated]);

  // Unregister from an event
  const unregisterFromEvent = useCallback(async (id: number): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('You must be logged in to unregister from an event');
      return false;
    }

    setIsRegistering(true);
    setError(null);

    try {
      await eventService.unregisterFromEvent(id);
      
      // Update local state
      setEvents(prev => prev.map(event => 
        event.id === id 
          ? { 
              ...event, 
              isRegistered: false, 
              attendeeCount: Math.max(0, event.attendeeCount - 1),
              canRegister: event.status === 'upcoming',
            } 
          : event
      ));
      
      return true;
    } catch (err) {
      const message = err instanceof ApiClientError 
        ? err.message 
        : 'Failed to unregister from event. Please try again.';
      setError(message);
      console.error('Error unregistering from event:', err);
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [isAuthenticated]);

  // Get event by ID from local state
  const getEventById = useCallback((id: number): Event | undefined => {
    return events.find(event => event.id === id);
  }, [events]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch events on mount and when auth state changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <EventsContext.Provider value={{
      events,
      registeredEvents,
      isLoading,
      isCreating,
      isUpdating,
      isDeleting,
      isRegistering,
      error,
      canManageEvents,
      fetchEvents,
      createEvent,
      updateEvent,
      deleteEvent,
      registerForEvent,
      unregisterFromEvent,
      getEventById,
      refreshEvents,
      clearError,
    }}>
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within EventsProvider');
  }
  return context;
};

// Re-export Event type for convenience
export type { Event, EventFormData } from '@/types/events';
