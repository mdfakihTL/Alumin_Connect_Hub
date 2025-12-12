// Event status as returned by the API
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

// Event type categories
export type EventType = 'networking' | 'social' | 'professional' | 'technology' | 'career' | 'sports' | 'cultural' | 'academic' | 'reunion' | 'workshop' | 'webinar' | 'other';

// API Event model - matches the backend response
export interface ApiEvent {
  id: number;
  title: string;
  description: string;
  event_type: EventType;
  start_date: string; // ISO datetime string
  end_date: string; // ISO datetime string
  location: string;
  venue: string | null;
  max_attendees: number | null;
  registration_deadline: string | null; // ISO datetime string
  status: EventStatus;
  is_public: boolean;
  creator_id: number;
  university_id: number | null; // University this event belongs to
  created_at: string;
  updated_at: string;
  // Extended fields that may be included
  attendee_count?: number;
  is_registered?: boolean;
  image_url?: string;
}

// Event registration model
export interface ApiEventRegistration {
  id: number;
  event_id: number;
  user_id: number;
  status: 'registered' | 'cancelled' | 'attended';
  registered_at: string;
}

// Request to create an event
export interface CreateEventRequest {
  title: string;
  description: string;
  event_type: EventType;
  start_date: string; // ISO datetime string
  end_date: string; // ISO datetime string
  location: string;
  venue?: string;
  max_attendees?: number;
  registration_deadline?: string;
  is_public?: boolean;
}

// Request to update an event
export interface UpdateEventRequest extends Partial<CreateEventRequest> {}

// List events params
export interface ListEventsParams {
  skip?: number;
  limit?: number;
  status?: EventStatus;
  university_id?: number; // Filter by university
}

// UI-friendly Event model (transformed from API model)
export interface Event {
  id: number;
  title: string;
  description: string;
  eventType: EventType;
  startDate: Date;
  endDate: Date;
  date: string; // Formatted date string for display
  time: string; // Formatted time string for display
  location: string;
  venue: string;
  maxAttendees: number | null;
  registrationDeadline: Date | null;
  status: EventStatus;
  isPublic: boolean;
  creatorId: number;
  universityId: number | null; // University this event belongs to
  attendeeCount: number;
  isRegistered: boolean;
  imageUrl: string;
  // Computed fields
  isVirtual: boolean;
  canRegister: boolean;
  isCreator: boolean;
}

// Events context state
export interface EventsState {
  events: Event[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isRegistering: boolean;
  error: string | null;
  currentEventId: number | null; // For tracking which event is being operated on
}

// Utility function to transform API event to UI event
export function transformApiEventToEvent(apiEvent: ApiEvent, currentUserId?: number): Event {
  const startDate = new Date(apiEvent.start_date);
  const endDate = new Date(apiEvent.end_date);
  const registrationDeadline = apiEvent.registration_deadline 
    ? new Date(apiEvent.registration_deadline) 
    : null;

  const now = new Date();
  const isVirtual = apiEvent.location.toLowerCase().includes('virtual') || 
                    apiEvent.location.toLowerCase().includes('online') ||
                    apiEvent.venue?.toLowerCase().includes('zoom') ||
                    apiEvent.venue?.toLowerCase().includes('meet') ||
                    apiEvent.venue?.toLowerCase().includes('teams') ||
                    false;

  // Determine if user can still register
  const canRegister = 
    apiEvent.status === 'upcoming' &&
    (!registrationDeadline || registrationDeadline > now) &&
    (!apiEvent.max_attendees || (apiEvent.attendee_count || 0) < apiEvent.max_attendees) &&
    !apiEvent.is_registered;

  return {
    id: apiEvent.id,
    title: apiEvent.title,
    description: apiEvent.description,
    eventType: apiEvent.event_type,
    startDate,
    endDate,
    date: formatEventDate(startDate),
    time: formatEventTime(startDate),
    location: apiEvent.location,
    venue: apiEvent.venue || apiEvent.location,
    maxAttendees: apiEvent.max_attendees,
    registrationDeadline,
    status: apiEvent.status,
    isPublic: apiEvent.is_public,
    creatorId: apiEvent.creator_id,
    universityId: apiEvent.university_id,
    attendeeCount: apiEvent.attendee_count || 0,
    isRegistered: apiEvent.is_registered || false,
    imageUrl: apiEvent.image_url || getDefaultEventImage(apiEvent.event_type),
    isVirtual,
    canRegister,
    isCreator: currentUserId ? apiEvent.creator_id === currentUserId : false,
  };
}

// Utility to transform UI event data to API create request
export function transformEventFormToApiRequest(formData: EventFormData): CreateEventRequest {
  // Combine date and time into ISO datetime
  const startDateTime = combineDateAndTime(formData.date, formData.startTime);
  const endDateTime = combineDateAndTime(formData.date, formData.endTime);
  const registrationDeadline = formData.registrationDeadline 
    ? new Date(formData.registrationDeadline).toISOString()
    : undefined;

  return {
    title: formData.title,
    description: formData.description,
    event_type: formData.eventType,
    start_date: startDateTime,
    end_date: endDateTime,
    location: formData.isVirtual ? 'Virtual' : formData.location,
    venue: formData.isVirtual ? formData.meetingLink : formData.venue,
    max_attendees: formData.maxAttendees || undefined,
    registration_deadline: registrationDeadline,
    is_public: formData.isPublic ?? true,
  };
}

// Form data interface for creating/editing events
export interface EventFormData {
  title: string;
  description: string;
  eventType: EventType;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
  venue: string;
  isVirtual: boolean;
  meetingLink: string;
  maxAttendees: number | null;
  registrationDeadline: string; // YYYY-MM-DD
  isPublic: boolean;
  imageUrl: string;
}

// Helper functions
function formatEventDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatEventTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function combineDateAndTime(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(year, month - 1, day, hours, minutes);
  return date.toISOString();
}

function getDefaultEventImage(eventType: EventType): string {
  const imageMap: Record<EventType, string> = {
    networking: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop',
    social: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=500&fit=crop',
    professional: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&h=500&fit=crop',
    technology: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=500&fit=crop',
    career: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=500&fit=crop',
    sports: 'https://images.unsplash.com/photo-1461896836934-969541245e63?w=800&h=500&fit=crop',
    cultural: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=500&fit=crop',
    academic: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=500&fit=crop',
    reunion: 'https://images.unsplash.com/photo-1529543544277-750e340e8735?w=800&h=500&fit=crop',
    workshop: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop',
    webinar: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800&h=500&fit=crop',
    other: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop',
  };
  return imageMap[eventType] || imageMap.other;
}

// Extract form data from an existing event for editing
export function extractFormDataFromEvent(event: Event): EventFormData {
  return {
    title: event.title,
    description: event.description,
    eventType: event.eventType,
    date: event.startDate.toISOString().split('T')[0],
    startTime: event.startDate.toTimeString().slice(0, 5),
    endTime: event.endDate.toTimeString().slice(0, 5),
    location: event.isVirtual ? '' : event.location,
    venue: event.isVirtual ? '' : event.venue,
    isVirtual: event.isVirtual,
    meetingLink: event.isVirtual ? event.venue : '',
    maxAttendees: event.maxAttendees,
    registrationDeadline: event.registrationDeadline 
      ? event.registrationDeadline.toISOString().split('T')[0] 
      : '',
    isPublic: event.isPublic,
    imageUrl: event.imageUrl,
  };
}

