import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventsContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Edit, Trash2, CheckCircle, XCircle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EventModal from '@/components/EventModal';

const AdminEvents = () => {
  const { user } = useAuth();
  const { events, createEvent, updateEvent, deleteEvent } = useEvents();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'upcoming'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  // Add status to events if not present
  const eventsWithStatus = events.map(event => ({
    ...event,
    status: (event as any).status || 'approved',
  }));

  const handleApprove = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      try {
        // For now, just update the event - backend doesn't have approval status yet
        await updateEvent(eventId, {});
        toast({
          title: 'Event approved',
          description: 'The event is now visible to all alumni',
        });
      } catch (err) {
        // Error handled in context
      }
    }
  };

  const handleReject = async (eventId: string) => {
    if (window.confirm('Are you sure you want to reject this event?')) {
      try {
        await deleteEvent(eventId);
      } catch (err) {
        // Error handled in context
      }
    }
  };

  const handleDelete = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await deleteEvent(eventId);
      } catch (err) {
        // Error handled in context
      }
    }
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleCreate = async (eventData: any) => {
    try {
      await createEvent(eventData);
      setIsModalOpen(false);
      setEditingEvent(null);
    } catch (err) {
      // Error handled in context
    }
  };

  const handleUpdate = async (eventData: any) => {
    if (editingEvent) {
      try {
        await updateEvent(editingEvent.id, eventData);
        setIsModalOpen(false);
        setEditingEvent(null);
      } catch (err) {
        // Error handled in context
      }
    }
  };

  const filteredEvents = eventsWithStatus.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'pending') return event.status === 'pending';
    if (filter === 'approved') return event.status === 'approved';
    if (filter === 'upcoming') return new Date(event.date) > new Date();
    return true;
  });

  const pendingCount = eventsWithStatus.filter(e => e.status === 'pending').length;
  const approvedCount = eventsWithStatus.filter(e => e.status === 'approved').length;
  const upcomingCount = eventsWithStatus.filter(e => new Date(e.date) > new Date()).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
          <Clock className="w-3 h-3 mr-1" />
          Pending Approval
        </Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Event Management</h2>
            <p className="text-sm text-muted-foreground">
              Create, approve, and manage university events
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`p-4 rounded-lg border transition-all ${
              filter === 'all' 
                ? 'bg-primary/10 border-primary' 
                : 'bg-card border-border hover:border-primary/50'
            }`}
          >
            <p className="text-2xl font-bold">{eventsWithStatus.length}</p>
            <p className="text-sm text-muted-foreground">Total Events</p>
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`p-4 rounded-lg border transition-all ${
              filter === 'pending' 
                ? 'bg-yellow-500/10 border-yellow-500' 
                : 'bg-card border-border hover:border-yellow-500/50'
            }`}
          >
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`p-4 rounded-lg border transition-all ${
              filter === 'approved' 
                ? 'bg-green-500/10 border-green-500' 
                : 'bg-card border-border hover:border-green-500/50'
            }`}
          >
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{approvedCount}</p>
            <p className="text-sm text-muted-foreground">Approved</p>
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`p-4 rounded-lg border transition-all ${
              filter === 'upcoming' 
                ? 'bg-blue-500/10 border-blue-500' 
                : 'bg-card border-border hover:border-blue-500/50'
            }`}
          >
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{upcomingCount}</p>
            <p className="text-sm text-muted-foreground">Upcoming</p>
          </button>
        </div>
      </Card>

      {/* Events List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredEvents.length === 0 ? (
          <Card className="p-8 text-center col-span-full">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No events found</p>
          </Card>
        ) : (
          filteredEvents.map(event => (
            <Card key={event.id} className="p-6 hover:shadow-lg transition-shadow">
              {event.image && (
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
              )}
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-lg flex-1">{event.title}</h3>
                {getStatusBadge(event.status)}
              </div>
              
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
              
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
                <Badge variant="secondary">{event.category}</Badge>
              </div>

              <div className="flex gap-2">
                {event.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => handleApprove(event.id)}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleReject(event.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline" onClick={() => handleEdit(event)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDelete(event.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <EventModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={editingEvent ? handleUpdate : handleCreate}
        editEvent={editingEvent}
      />
    </div>
  );
};

export default AdminEvents;

