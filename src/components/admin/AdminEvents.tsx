import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents, Event, EventFormData } from '@/contexts/EventsContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Edit, 
  Trash2, 
  Plus,
  Users,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Video,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EventModal from '@/components/EventModal';
import { eventService } from '@/services/eventService';

const AdminEvents = () => {
  const { user } = useAuth();
  const { 
    events, 
    isLoading, 
    isCreating,
    error,
    createEvent, 
    updateEvent, 
    deleteEvent,
    refreshEvents,
    clearError,
  } = useEvents();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
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
    // Filter by status
    if (filter !== 'all' && event.status !== filter) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Count by status
  const statusCounts = {
    all: events.length,
    upcoming: events.filter(e => e.status === 'upcoming').length,
    ongoing: events.filter(e => e.status === 'ongoing').length,
    completed: events.filter(e => e.status === 'completed').length,
    cancelled: events.filter(e => e.status === 'cancelled').length,
  };

  const handleCreateEvent = async (formData: EventFormData) => {
    const result = await createEvent(formData);
    if (result) {
      toast({
        title: 'Event created',
        description: 'The event has been created successfully',
      });
      setIsModalOpen(false);
    }
  };

  const handleUpdateEvent = async (formData: EventFormData) => {
    if (editingEvent) {
      const result = await updateEvent(editingEvent.id, formData);
      if (result) {
        toast({
          title: 'Event updated',
          description: 'The event has been updated successfully',
        });
        setEditingEvent(null);
        setIsModalOpen(false);
      }
    }
  };

  const handleDelete = async (eventId: number, eventTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
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

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleRefresh = async () => {
    await refreshEvents();
    toast({
      title: 'Refreshed',
      description: 'Events list has been updated',
    });
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

  const EventSkeleton = () => (
    <Card className="p-6">
      <Skeleton className="w-full h-32 rounded-lg mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Event Management</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage university events
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => setIsModalOpen(true)} disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Event
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`p-4 rounded-lg border transition-all ${
              filter === 'all' 
                ? 'bg-primary/10 border-primary' 
                : 'bg-card border-border hover:border-primary/50'
            }`}
          >
            <p className="text-2xl font-bold">{statusCounts.all}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`p-4 rounded-lg border transition-all ${
              filter === 'upcoming' 
                ? 'bg-blue-500/10 border-blue-500' 
                : 'bg-card border-border hover:border-blue-500/50'
            }`}
          >
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{statusCounts.upcoming}</p>
            <p className="text-sm text-muted-foreground">Upcoming</p>
          </button>
          <button
            onClick={() => setFilter('ongoing')}
            className={`p-4 rounded-lg border transition-all ${
              filter === 'ongoing' 
                ? 'bg-green-500/10 border-green-500' 
                : 'bg-card border-border hover:border-green-500/50'
            }`}
          >
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{statusCounts.ongoing}</p>
            <p className="text-sm text-muted-foreground">Ongoing</p>
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`p-4 rounded-lg border transition-all ${
              filter === 'completed' 
                ? 'bg-gray-500/10 border-gray-500' 
                : 'bg-card border-border hover:border-gray-500/50'
            }`}
          >
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{statusCounts.completed}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`p-4 rounded-lg border transition-all ${
              filter === 'cancelled' 
                ? 'bg-red-500/10 border-red-500' 
                : 'bg-card border-border hover:border-red-500/50'
            }`}
          >
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{statusCounts.cancelled}</p>
            <p className="text-sm text-muted-foreground">Cancelled</p>
          </button>
        </div>
      </Card>

      {/* Error Alert */}
      {error && !isLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <EventSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Events List */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredEvents.length === 0 ? (
            <Card className="p-8 text-center col-span-full">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : filter !== 'all'
                    ? `No ${filter} events at the moment`
                    : 'Create your first event to get started'}
              </p>
              {!searchQuery && filter === 'all' && (
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              )}
            </Card>
          ) : (
            filteredEvents.map(event => {
              const isOperating = operatingEventId === event.id;

              return (
                <Card key={event.id} className="p-6 hover:shadow-lg transition-shadow">
                  {event.imageUrl && (
                    <div className="relative mb-4">
                      <img 
                        src={event.imageUrl} 
                        alt={event.title}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop';
                        }}
                      />
                      <div className="absolute top-2 left-2 flex gap-2">
                        {event.isVirtual && (
                          <Badge className="gap-1 bg-accent shadow-md">
                            <Video className="w-3 h-3" />
                            Virtual
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-lg flex-1 line-clamp-1">{event.title}</h3>
                    {getStatusBadge(event)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{event.date} at {event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {event.attendeeCount} registered
                        {event.maxAttendees && ` / ${event.maxAttendees} max`}
                      </span>
                    </div>
                    {event.registrationDeadline && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs">
                          Deadline: {event.registrationDeadline.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary" className="capitalize">
                        {event.eventType.replace('_', ' ')}
                      </Badge>
                      {!event.isPublic && (
                        <Badge variant="outline">Private</Badge>
                      )}
                    </div>
                  </div>

                  {/* Virtual Event Meeting Link */}
                  {event.isVirtual && event.venue && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mb-4 gap-2"
                      onClick={() => window.open(event.venue, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Meeting Link
                    </Button>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEdit(event)}
                      disabled={isOperating}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDelete(event.id, event.title)}
                      disabled={isOperating}
                      className="flex-1 text-destructive hover:text-destructive"
                    >
                      {isOperating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Delete
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

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

export default AdminEvents;
