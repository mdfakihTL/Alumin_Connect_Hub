import { useState } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import EventModal from '@/components/EventModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, Plus, Search, Video, Settings, Edit, Trash2, Check, ExternalLink, Menu } from 'lucide-react';
import { useEvents, Event } from '@/contexts/EventsContext';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Events = () => {
  const { events, registeredEvents, createEvent, updateEvent, deleteEvent, registerForEvent, unregisterFromEvent } = useEvents();
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<'all' | 'registered'>('all');

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || (filter === 'registered' && event.isRegistered);
    
    return matchesSearch && matchesFilter;
  });

  const handleCreateEvent = (eventData: Omit<Event, 'id' | 'attendees' | 'isRegistered' | 'organizer'>) => {
    createEvent(eventData);
    toast({
      title: 'Event created!',
      description: 'Your event has been created successfully',
    });
    setIsModalOpen(false);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleUpdateEvent = (eventData: Omit<Event, 'id' | 'attendees' | 'isRegistered' | 'organizer'>) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, eventData);
      toast({
        title: 'Event updated!',
        description: 'Event details have been updated successfully',
      });
      setEditingEvent(null);
      setIsModalOpen(false);
    }
  };

  const handleDeleteEvent = (eventId: number, eventTitle: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`);
    if (confirmed) {
      deleteEvent(eventId);
      toast({
        title: 'Event deleted',
        description: 'The event has been removed',
      });
    }
  };

  const handleRegister = (eventId: number, eventTitle: string) => {
    registerForEvent(eventId);
    toast({
      title: 'Registered!',
      description: `You're registered for ${eventTitle}`,
    });
  };

  const handleUnregister = (eventId: number, eventTitle: string) => {
    const confirmed = window.confirm(`Are you sure you want to unregister from "${eventTitle}"?`);
    if (confirmed) {
      unregisterFromEvent(eventId);
      toast({
        title: 'Unregistered',
        description: `You've been removed from ${eventTitle}`,
      });
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop';
  };

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
                <p className="text-xs sm:text-sm text-muted-foreground">Discover and join alumni events</p>
              </div>
            </div>
            <Button className="gap-2 h-9 sm:h-10 text-sm w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Create Event</span>
            </Button>
          </div>

          {/* Search & Filter */}
          <div className="space-y-3 sm:space-y-4">
            <Card className="p-3 sm:p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
                <Input 
                  placeholder="Search events..." 
                  className="pl-9 sm:pl-10 h-9 sm:h-11 text-sm sm:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </Card>

            <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'registered')}>
              <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
                <TabsTrigger value="all" className="text-xs sm:text-sm">
                  All Events ({events.length})
                </TabsTrigger>
                <TabsTrigger value="registered" className="text-xs sm:text-sm">
                  My Events ({registeredEvents.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Empty State */}
          {filteredEvents.length === 0 && (
            <Card className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "Try adjusting your search terms" 
                  : filter === 'registered'
                    ? "You haven't registered for any events yet"
                    : "Be the first to create an event!"}
              </p>
              {!searchQuery && filter === 'all' && (
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                  <Plus className="w-5 h-5" />
                  Create Your First Event
                </Button>
              )}
            </Card>
          )}

          {/* Events Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {filteredEvents.map((event) => {
              const isOwner = event.organizer === 'You';
              
              return (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col">
                  {/* Event Image */}
                  <div className="relative bg-muted">
                    <img
                      src={event.image}
                      alt={event.title}
                      onError={handleImageError}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                    {event.isVirtual && (
                      <Badge className="absolute top-3 left-3 gap-1 bg-accent shadow-md">
                        <Video className="w-3 h-3" />
                        Virtual
                      </Badge>
                    )}
                    {isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="absolute top-3 right-3 h-8 w-8 shadow-md"
                          >
                            <Settings className="w-4 h-4" />
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
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {event.category}
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
                        <span>{event.attendees} attending</span>
                      </div>
                    </div>

                    {/* Meeting Link for Virtual Events */}
                    {event.isVirtual && event.meetingLink && event.isRegistered && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => window.open(event.meetingLink, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Join Meeting
                      </Button>
                    )}

                    {/* Register/Unregister Button */}
                    {event.isRegistered ? (
                      <div className="flex gap-2">
                        <Button className="flex-1 gap-2" variant="outline">
                          <Check className="w-4 h-4" />
                          Registered
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnregister(event.id, event.title)}
                          className="text-destructive hover:text-destructive"
                        >
                          Leave
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        className="w-full gap-2"
                        onClick={() => handleRegister(event.id, event.title)}
                      >
                        <Plus className="w-4 h-4" />
                        Register
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
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
      />
    </div>
  );
};

export default Events;
