import { useState, useEffect } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import EventModal from '@/components/EventModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Plus, 
  Search, 
  Video, 
  Settings, 
  Edit, 
  Trash2, 
  Check, 
  ExternalLink, 
  Menu,
  RefreshCw,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { useEvents, Event, EventFormData } from '@/contexts/EventsContext';
import { useToast } from '@/hooks/use-toast';
import { eventService } from '@/services/eventService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Events = () => {
  const { 
    events, 
    registeredEvents, 
    isLoading, 
    isCreating,
    isRegistering,
    error,
    canManageEvents,
    createEvent, 
    updateEvent, 
    deleteEvent, 
    registerForEvent, 
    unregisterFromEvent,
    refreshEvents,
    clearError,
  } = useEvents();
  const { isAuthenticated, user } = useAuth();
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<'all' | 'registered' | 'upcoming'>('all');
  const [operatingEventId, setOperatingEventId] = useState<number | null>(null);

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
      clearError();
    }
  }, [error, toast, clearError]);

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.eventType.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (filter === 'registered') {
      matchesFilter = event.isRegistered;
    } else if (filter === 'upcoming') {
      matchesFilter = event.status === 'upcoming';
    }
    
    return matchesSearch && matchesFilter;
  });

  const handleCreateEvent = async (formData: EventFormData) => {
    const result = await createEvent(formData);
    if (result) {
      toast({
        title: 'Event created!',
        description: 'Your event has been created successfully',
      });
      setIsModalOpen(false);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleUpdateEvent = async (formData: EventFormData) => {
    if (editingEvent) {
      const result = await updateEvent(editingEvent.id, formData);
      if (result) {
        toast({
          title: 'Event updated!',
          description: 'Event details have been updated successfully',
        });
        setEditingEvent(null);
        setIsModalOpen(false);
      }
    }
  };

  const handleDeleteEvent = async (eventId: number, eventTitle: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`);
    if (confirmed) {
      setOperatingEventId(eventId);
      const success = await deleteEvent(eventId);
      if (success) {
        toast({
          title: 'Event deleted',
          description: 'The event has been removed',
        });
      }
      setOperatingEventId(null);
    }
  };

  const handleRegister = async (eventId: number, eventTitle: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Login required',
        description: 'Please log in to register for events',
        variant: 'destructive',
      });
      return;
    }

    setOperatingEventId(eventId);
    const success = await registerForEvent(eventId);
    if (success) {
      toast({
        title: 'Registered!',
        description: `You're registered for ${eventTitle}`,
      });
    }
    setOperatingEventId(null);
  };

  const handleUnregister = async (eventId: number, eventTitle: string) => {
    const confirmed = window.confirm(`Are you sure you want to unregister from "${eventTitle}"?`);
    if (confirmed) {
      setOperatingEventId(eventId);
      const success = await unregisterFromEvent(eventId);
      if (success) {
        toast({
          title: 'Unregistered',
          description: `You've been removed from ${eventTitle}`,
        });
      }
      setOperatingEventId(null);
    }
  };

  const handleRefresh = async () => {
    await refreshEvents();
    toast({
      title: 'Refreshed',
      description: 'Events list has been updated',
    });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop';
  };

  const getStatusBadge = (event: Event) => {
    const statusInfo = eventService.getEventStatusInfo(event.status);
    return (
      <Badge 
        variant="outline" 
        className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}
      >
        {statusInfo.label}
      </Badge>
    );
  };

  // Loading skeleton component
  const EventSkeleton = () => (
    <Card className="overflow-hidden">
      <Skeleton className="w-full h-48" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      <MobileNav />
      
      <main className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-9 w-9 flex-shrink-0"
                title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1">Events</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {canManageEvents 
                    ? "Manage and create events for your alumni network"
                    : user?.university 
                      ? `Events for ${user.university}`
                      : "Discover and join alumni events"}
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRefresh}
                disabled={isLoading}
                className="h-9 w-9 sm:h-10 sm:w-10"
                title="Refresh events"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              {canManageEvents && (
                <Button 
                  className="gap-2 h-9 sm:h-10 text-sm flex-1 sm:flex-initial" 
                  onClick={() => setIsModalOpen(true)}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  <span>Create Event</span>
                </Button>
              )}
            </div>
          </div>

          {/* Search & Filter */}
          <div className="space-y-3 sm:space-y-4">
            <Card className="p-3 sm:p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
                <Input 
                  placeholder="Search events by title, description, location..." 
                  className="pl-9 sm:pl-10 h-9 sm:h-11 text-sm sm:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </Card>

            <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'registered' | 'upcoming')}>
              <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
                <TabsTrigger value="all" className="text-xs sm:text-sm">
                  All Events ({events.length})
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="text-xs sm:text-sm">
                  Upcoming ({events.filter(e => e.status === 'upcoming').length})
                </TabsTrigger>
                <TabsTrigger value="registered" className="text-xs sm:text-sm">
                  My Events ({registeredEvents.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Error State */}
          {error && !isLoading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error loading events</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Try Again
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <EventSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredEvents.length === 0 && (
            <Card className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "Try adjusting your search terms" 
                  : filter === 'registered'
                    ? "You haven't registered for any events yet"
                    : filter === 'upcoming'
                      ? "No upcoming events at the moment"
                      : canManageEvents
                        ? "Be the first to create an event!"
                        : "No events available for your university yet"}
              </p>
              {!searchQuery && filter === 'all' && canManageEvents && (
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                  <Plus className="w-5 h-5" />
                  Create Your First Event
                </Button>
              )}
            </Card>
          )}

          {/* Events Grid */}
          {!isLoading && filteredEvents.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {filteredEvents.map((event) => {
                const isOperating = operatingEventId === event.id;
                
                return (
                  <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col">
                    {/* Event Image */}
                    <div className="relative bg-muted">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        onError={handleImageError}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        {event.isVirtual && (
                          <Badge className="gap-1 bg-accent shadow-md">
                            <Video className="w-3 h-3" />
                            Virtual
                          </Badge>
                        )}
                        {getStatusBadge(event)}
                      </div>
                      {canManageEvents && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="secondary" 
                              size="icon" 
                              className="absolute top-3 right-3 h-8 w-8 shadow-md"
                              disabled={isOperating}
                            >
                              {isOperating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Settings className="w-4 h-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleEditEvent(event)} className="gap-2">
                              <Edit className="w-4 h-4" />
                              Edit Event
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteEvent(event.id, event.title)}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Event
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-base sm:text-lg line-clamp-2 flex-1">{event.title}</h3>
                        <Badge variant="secondary" className="text-xs flex-shrink-0 capitalize">
                          {event.eventType.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>

                      <div className="space-y-2 text-sm text-muted-foreground flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{event.date} at {event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {event.attendeeCount} attending
                            {event.maxAttendees && ` / ${event.maxAttendees} max`}
                          </span>
                        </div>
                        {event.registrationDeadline && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span className="text-xs">
                              Register by {event.registrationDeadline.toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Meeting Link for Virtual Events */}
                      {event.isVirtual && event.venue && event.isRegistered && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => window.open(event.venue, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                          Join Meeting
                        </Button>
                      )}

                      {/* Register/Unregister Button */}
                      {event.status === 'upcoming' && (
                        <>
                          {event.isRegistered ? (
                            <div className="flex gap-2">
                              <Button className="flex-1 gap-2" variant="outline" disabled>
                                <Check className="w-4 h-4" />
                                Registered
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnregister(event.id, event.title)}
                                className="text-destructive hover:text-destructive"
                                disabled={isOperating || isRegistering}
                              >
                                {isOperating ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  'Leave'
                                )}
                              </Button>
                            </div>
                          ) : event.canRegister ? (
                            <Button 
                              className="w-full gap-2"
                              onClick={() => handleRegister(event.id, event.title)}
                              disabled={isOperating || isRegistering}
                            >
                              {isOperating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="w-4 h-4" />
                                  Register
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button className="w-full gap-2" variant="secondary" disabled>
                              Registration Closed
                            </Button>
                          )}
                        </>
                      )}

                      {event.status === 'ongoing' && (
                        <Badge className="w-full justify-center py-2 bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/10">
                          Happening Now
                        </Badge>
                      )}

                      {event.status === 'completed' && (
                        <Badge className="w-full justify-center py-2" variant="secondary">
                          Event Completed
                        </Badge>
                      )}

                      {event.status === 'cancelled' && (
                        <Badge className="w-full justify-center py-2 bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/10">
                          Event Cancelled
                        </Badge>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Event Modal */}
      <EventModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
        editEvent={editingEvent}
        isSubmitting={isCreating}
      />
    </div>
  );
};

export default Events;
