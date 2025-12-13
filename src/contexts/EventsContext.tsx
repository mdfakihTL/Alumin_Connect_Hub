import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, EventResponse as BackendEventResponse } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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
  loading: boolean;
  error: string | null;
  createEvent: (event: Omit<Event, 'id' | 'attendees' | 'isRegistered' | 'organizer'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  registerForEvent: (id: string) => Promise<void>;
  unregisterFromEvent: (id: string) => Promise<void>;
  refreshEvents: () => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

// Convert backend EventResponse to frontend Event format
const convertBackendEvent = (backendEvent: BackendEventResponse): Event => {
  return {
    id: backendEvent.id,
    title: backendEvent.title,
    date: backendEvent.date,
    time: backendEvent.time || '',
    location: backendEvent.location || '',
    attendees: backendEvent.attendees,
    image: backendEvent.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop',
    description: backendEvent.description || '',
    isVirtual: backendEvent.is_virtual,
    meetingLink: backendEvent.meeting_link,
    organizer: backendEvent.organizer,
    category: backendEvent.category || '',
    isRegistered: backendEvent.is_registered,
  };
};

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getEvents(1, 100);
      const convertedEvents = response.events.map(convertBackendEvent);
      setEvents(convertedEvents);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const registeredEvents = events.filter(e => e.isRegistered);

  // Convert date from YYYY-MM-DD to "Dec 15, 2024" format
  const formatDateForBackend = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr; // Return as-is if parsing fails
    }
  };

  // Convert time from HH:MM (24-hour) to "6:00 PM" format
  const formatTimeForBackend = (timeStr: string): string => {
    try {
      if (!timeStr) return '';
      const [hours, minutes] = timeStr.split(':');
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const period = hour24 >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes || '00'} ${period}`;
    } catch {
      return timeStr; // Return as-is if parsing fails
    }
  };

  const createEvent = async (eventData: Omit<Event, 'id' | 'attendees' | 'isRegistered' | 'organizer'>) => {
    try {
      const backendEvent = await apiClient.createEvent({
        title: eventData.title,
        description: eventData.description,
        image: eventData.image,
        event_date: formatDateForBackend(eventData.date),
        event_time: formatTimeForBackend(eventData.time),
        location: eventData.location,
        is_virtual: eventData.isVirtual,
        meeting_link: eventData.meetingLink,
        category: eventData.category,
      });
      const newEvent = convertBackendEvent(backendEvent);
      setEvents(prev => [newEvent, ...prev]);
      toast({
        title: 'Event created!',
        description: 'Your event has been created successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create event',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.image !== undefined) updateData.image = updates.image;
      if (updates.date !== undefined) updateData.event_date = formatDateForBackend(updates.date);
      if (updates.time !== undefined) updateData.event_time = formatTimeForBackend(updates.time);
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.isVirtual !== undefined) updateData.is_virtual = updates.isVirtual;
      if (updates.meetingLink !== undefined) updateData.meeting_link = updates.meetingLink;
      if (updates.category !== undefined) updateData.category = updates.category;

      const backendEvent = await apiClient.updateEvent(id, updateData);
      const updatedEvent = convertBackendEvent(backendEvent);
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event));
      toast({
        title: 'Event updated!',
        description: 'Event details have been updated successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update event',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await apiClient.deleteEvent(id);
      setEvents(prev => prev.filter(event => event.id !== id));
      toast({
        title: 'Event deleted!',
        description: 'Event has been deleted successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete event',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const registerForEvent = async (id: string) => {
    try {
      const response = await apiClient.registerForEvent(id);
      setEvents(prev => prev.map(event => 
        event.id === id 
          ? { ...event, isRegistered: true, attendees: response.attendees } 
          : event
      ));
      toast({
        title: 'Registered!',
        description: 'You have successfully registered for this event',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to register for event',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const unregisterFromEvent = async (id: string) => {
    try {
      const response = await apiClient.unregisterFromEvent(id);
      setEvents(prev => prev.map(event => 
        event.id === id 
          ? { ...event, isRegistered: false, attendees: response.attendees } 
          : event
      ));
      toast({
        title: 'Unregistered',
        description: 'You have unregistered from this event',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to unregister from event',
        variant: 'destructive',
      });
      throw err;
    }
  };

  return (
    <EventsContext.Provider value={{
      events,
      registeredEvents,
      loading,
      error,
      createEvent,
      updateEvent,
      deleteEvent,
      registerForEvent,
      unregisterFromEvent,
      refreshEvents: fetchEvents,
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

