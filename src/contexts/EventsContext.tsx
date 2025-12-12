import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { eventsApi } from '@/api/events';
import { handleApiError } from '@/api/client';
import { useAuth } from './AuthContext';
import type { EventResponse } from '@/api/types';

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  image: string;
  description: string;
  isVirtual: boolean;
  meetingLink?: string;
  organizer: string;
  category: string;
  isRegistered?: boolean;
}

interface EventsContextType {
  events: Event[];
  registeredEvents: Event[];
  isLoading: boolean;
  error: string | null;
  createEvent: (event: Omit<Event, 'id' | 'attendees' | 'isRegistered' | 'organizer'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  registerForEvent: (id: string) => Promise<void>;
  unregisterFromEvent: (id: string) => Promise<void>;
  refreshEvents: () => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

// Transform API response to frontend format
const transformEvent = (apiEvent: EventResponse): Event => ({
  id: apiEvent.id,
  title: apiEvent.title,
  date: apiEvent.date,
  time: apiEvent.time || '',
  location: apiEvent.location || 'TBD',
  attendees: apiEvent.attendees,
  image: apiEvent.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop',
  description: apiEvent.description || '',
  isVirtual: apiEvent.is_virtual,
  meetingLink: apiEvent.meeting_link,
  organizer: apiEvent.organizer,
  category: apiEvent.category || 'General',
  isRegistered: apiEvent.is_registered,
});

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshEvents = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await eventsApi.getEvents({ page_size: 100 });
      setEvents(response.events.map(transformEvent));
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load events when user is authenticated
  useEffect(() => {
    if (user) {
      refreshEvents();
    } else {
      setEvents([]);
    }
  }, [user, refreshEvents]);

  const registeredEvents = events.filter(e => e.isRegistered);

  const createEvent = async (eventData: Omit<Event, 'id' | 'attendees' | 'isRegistered' | 'organizer'>) => {
    try {
      const response = await eventsApi.createEvent({
        title: eventData.title,
        description: eventData.description,
        image: eventData.image,
        event_date: eventData.date,
        event_time: eventData.time,
        location: eventData.location,
        is_virtual: eventData.isVirtual,
        meeting_link: eventData.meetingLink,
        category: eventData.category,
      });
      
      setEvents(prev => [transformEvent(response), ...prev]);
    } catch (err) {
      handleApiError(err, 'Failed to create event');
      throw err;
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      const response = await eventsApi.updateEvent(id, {
        title: updates.title,
        description: updates.description,
        image: updates.image,
        event_date: updates.date,
        event_time: updates.time,
        location: updates.location,
        is_virtual: updates.isVirtual,
        meeting_link: updates.meetingLink,
        category: updates.category,
      });
      
      setEvents(prev => prev.map(event => 
        event.id === id ? transformEvent(response) : event
      ));
    } catch (err) {
      handleApiError(err, 'Failed to update event');
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await eventsApi.deleteEvent(id);
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      handleApiError(err, 'Failed to delete event');
      throw err;
    }
  };

  const registerForEvent = async (id: string) => {
    try {
      await eventsApi.registerForEvent(id);
      setEvents(prev => prev.map(event => 
        event.id === id 
          ? { ...event, isRegistered: true, attendees: event.attendees + 1 } 
          : event
      ));
    } catch (err) {
      handleApiError(err, 'Failed to register for event');
      throw err;
    }
  };

  const unregisterFromEvent = async (id: string) => {
    try {
      await eventsApi.unregisterFromEvent(id);
      setEvents(prev => prev.map(event => 
        event.id === id 
          ? { ...event, isRegistered: false, attendees: Math.max(0, event.attendees - 1) } 
          : event
      ));
    } catch (err) {
      handleApiError(err, 'Failed to unregister from event');
      throw err;
    }
  };

  return (
    <EventsContext.Provider value={{
      events,
      registeredEvents,
      isLoading,
      error,
      createEvent,
      updateEvent,
      deleteEvent,
      registerForEvent,
      unregisterFromEvent,
      refreshEvents,
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
