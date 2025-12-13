import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, MapPin, Link as LinkIcon } from 'lucide-react';
import { Event } from '@/contexts/EventsContext';

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (event: Omit<Event, 'id' | 'attendees' | 'isRegistered' | 'organizer'>) => void;
  editEvent?: Event | null;
}

// Helper functions to convert between formats
const parseBackendDate = (dateStr: string): string => {
  try {
    // Backend format: "Dec 15, 2024" -> HTML input format: "2024-12-15"
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return dateStr; // Return as-is if parsing fails
  }
};

const parseBackendTime = (timeStr: string): string => {
  try {
    // Backend format: "6:00 PM" -> HTML input format: "18:00"
    if (!timeStr) return '';
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    return `${hour24.toString().padStart(2, '0')}:${minutes || '00'}`;
  } catch {
    return timeStr; // Return as-is if parsing fails
  }
};

const EventModal = ({ open, onClose, onSubmit, editEvent }: EventModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title);
      setDescription(editEvent.description);
      setDate(parseBackendDate(editEvent.date));
      setTime(parseBackendTime(editEvent.time));
      setLocation(editEvent.location === 'Virtual' ? '' : editEvent.location);
      setCategory(editEvent.category);
      setIsVirtual(editEvent.isVirtual);
      setMeetingLink(editEvent.meetingLink || '');
      setImage(editEvent.image);
    } else {
      resetForm();
    }
  }, [editEvent, open]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setLocation('');
    setCategory('');
    setIsVirtual(false);
    setMeetingLink('');
    setImage('');
  };

  const handleSubmit = () => {
    if (!title.trim() || !description.trim() || !date || !time || !category) {
      return;
    }

    if (isVirtual && !meetingLink.trim()) {
      return;
    }

    if (!isVirtual && !location.trim()) {
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      location: isVirtual ? 'Virtual' : location.trim(),
      category,
      isVirtual,
      meetingLink: isVirtual ? meetingLink.trim() : undefined,
      image: image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop',
    });
    
    handleClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {editEvent ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* Event Title */}
          <div className="space-y-2">
            <Label htmlFor="event-title" className="text-base font-medium">Event Title</Label>
            <Input
              id="event-title"
              placeholder="e.g., Tech Networking Mixer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="event-description" className="text-base font-medium">Description</Label>
            <Textarea
              id="event-description"
              placeholder="What is this event about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-date" className="text-base font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date
              </Label>
              <Input
                id="event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-time" className="text-base font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time
              </Label>
              <Input
                id="event-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          {/* Virtual Event Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="virtual-event" className="text-base font-medium">Virtual Event</Label>
              <p className="text-sm text-muted-foreground">
                Event will be held online
              </p>
            </div>
            <Switch
              id="virtual-event"
              checked={isVirtual}
              onCheckedChange={(checked) => {
                setIsVirtual(checked);
                if (checked) {
                  setLocation('Virtual');
                } else {
                  setLocation('');
                  setMeetingLink('');
                }
              }}
            />
          </div>

          {/* Location or Meeting Link */}
          {isVirtual ? (
            <div className="space-y-2">
              <Label htmlFor="meeting-link" className="text-base font-medium flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Meeting Link
              </Label>
              <Input
                id="meeting-link"
                type="url"
                placeholder="https://zoom.us/j/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Enter Zoom, Google Meet, or any other meeting platform link
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="event-location" className="text-base font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </Label>
              <Input
                id="event-location"
                placeholder="e.g., Campus Main Hall, San Francisco"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-11"
              />
            </div>
          )}

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="event-category" className="text-base font-medium">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="event-category" className="h-11">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Networking">Networking</SelectItem>
                <SelectItem value="Social">Social</SelectItem>
                <SelectItem value="Professional">Professional Development</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Career">Career</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
                <SelectItem value="Cultural">Cultural</SelectItem>
                <SelectItem value="Academic">Academic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image URL (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="event-image" className="text-base font-medium">
              Event Image URL <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="event-image"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank for default event image
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !title.trim() || 
                !description.trim() || 
                !date || 
                !time || 
                !category ||
                (isVirtual && !meetingLink.trim()) ||
                (!isVirtual && !location.trim())
              }
              className="flex-1 h-11"
            >
              {editEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;

