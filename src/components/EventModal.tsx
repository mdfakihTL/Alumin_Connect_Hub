import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, MapPin, Link as LinkIcon, Users, Loader2 } from 'lucide-react';
import { Event, EventFormData, EventType, extractFormDataFromEvent } from '@/types/events';

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData) => void | Promise<void>;
  editEvent?: Event | null;
  isSubmitting?: boolean;
}

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'networking', label: 'Networking' },
  { value: 'social', label: 'Social' },
  { value: 'professional', label: 'Professional Development' },
  { value: 'technology', label: 'Technology' },
  { value: 'career', label: 'Career' },
  { value: 'sports', label: 'Sports' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'academic', label: 'Academic' },
  { value: 'reunion', label: 'Reunion' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'other', label: 'Other' },
];

const initialFormData: EventFormData = {
  title: '',
  description: '',
  eventType: 'networking',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  venue: '',
  isVirtual: false,
  meetingLink: '',
  maxAttendees: null,
  registrationDeadline: '',
  isPublic: true,
  imageUrl: '',
};

const EventModal = ({ open, onClose, onSubmit, editEvent, isSubmitting = false }: EventModalProps) => {
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});

  useEffect(() => {
    if (editEvent) {
      setFormData(extractFormDataFromEvent(editEvent));
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [editEvent, open]);

  const updateField = <K extends keyof EventFormData>(field: K, value: EventFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    // Validate end time is after start time
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    if (!formData.eventType) {
      newErrors.eventType = 'Event type is required';
    }

    if (formData.isVirtual) {
      if (!formData.meetingLink.trim()) {
        newErrors.meetingLink = 'Meeting link is required for virtual events';
      } else if (!isValidUrl(formData.meetingLink)) {
        newErrors.meetingLink = 'Please enter a valid URL';
      }
    } else {
      if (!formData.location.trim()) {
        newErrors.location = 'Location is required for in-person events';
      }
    }

    // Validate registration deadline if provided
    if (formData.registrationDeadline && formData.date) {
      if (new Date(formData.registrationDeadline) > new Date(formData.date)) {
        newErrors.registrationDeadline = 'Registration deadline must be before the event date';
      }
    }

    // Validate max attendees
    if (formData.maxAttendees !== null && formData.maxAttendees < 1) {
      newErrors.maxAttendees = 'Max attendees must be at least 1';
    }

    // Validate image URL if provided
    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = 'Please enter a valid image URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    onClose();
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

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
            <Label htmlFor="event-title" className="text-base font-medium">
              Event Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="event-title"
              placeholder="e.g., Tech Networking Mixer"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              className={`h-11 ${errors.title ? 'border-destructive' : ''}`}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="event-description" className="text-base font-medium">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="event-description"
              placeholder="What is this event about?"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
              className={`resize-none ${errors.description ? 'border-destructive' : ''}`}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="event-type" className="text-base font-medium">
              Event Type <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={formData.eventType} 
              onValueChange={(value) => updateField('eventType', value as EventType)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="event-type" className={`h-11 ${errors.eventType ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.eventType && (
              <p className="text-sm text-destructive">{errors.eventType}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-date" className="text-base font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="event-date"
                type="date"
                value={formData.date}
                onChange={(e) => updateField('date', e.target.value)}
                min={today}
                className={`h-11 ${errors.date ? 'border-destructive' : ''}`}
                disabled={isSubmitting}
              />
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-start-time" className="text-base font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Start Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="event-start-time"
                type="time"
                value={formData.startTime}
                onChange={(e) => updateField('startTime', e.target.value)}
                className={`h-11 ${errors.startTime ? 'border-destructive' : ''}`}
                disabled={isSubmitting}
              />
              {errors.startTime && (
                <p className="text-sm text-destructive">{errors.startTime}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-end-time" className="text-base font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                End Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="event-end-time"
                type="time"
                value={formData.endTime}
                onChange={(e) => updateField('endTime', e.target.value)}
                className={`h-11 ${errors.endTime ? 'border-destructive' : ''}`}
                disabled={isSubmitting}
              />
              {errors.endTime && (
                <p className="text-sm text-destructive">{errors.endTime}</p>
              )}
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
              checked={formData.isVirtual}
              onCheckedChange={(checked) => {
                updateField('isVirtual', checked);
                if (checked) {
                  updateField('location', '');
                  updateField('venue', '');
                } else {
                  updateField('meetingLink', '');
                }
              }}
              disabled={isSubmitting}
            />
          </div>

          {/* Location or Meeting Link */}
          {formData.isVirtual ? (
            <div className="space-y-2">
              <Label htmlFor="meeting-link" className="text-base font-medium flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Meeting Link <span className="text-destructive">*</span>
              </Label>
              <Input
                id="meeting-link"
                type="url"
                placeholder="https://zoom.us/j/..."
                value={formData.meetingLink}
                onChange={(e) => updateField('meetingLink', e.target.value)}
                className={`h-11 ${errors.meetingLink ? 'border-destructive' : ''}`}
                disabled={isSubmitting}
              />
              {errors.meetingLink ? (
                <p className="text-sm text-destructive">{errors.meetingLink}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Enter Zoom, Google Meet, or any other meeting platform link
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-location" className="text-base font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="event-location"
                  placeholder="e.g., San Francisco, CA"
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className={`h-11 ${errors.location ? 'border-destructive' : ''}`}
                  disabled={isSubmitting}
                />
                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-venue" className="text-base font-medium">
                  Venue <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="event-venue"
                  placeholder="e.g., Tech Hub Conference Center"
                  value={formData.venue}
                  onChange={(e) => updateField('venue', e.target.value)}
                  className="h-11"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          {/* Max Attendees and Registration Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-attendees" className="text-base font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Max Attendees <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="max-attendees"
                type="number"
                min="1"
                placeholder="Leave empty for unlimited"
                value={formData.maxAttendees || ''}
                onChange={(e) => updateField('maxAttendees', e.target.value ? parseInt(e.target.value) : null)}
                className={`h-11 ${errors.maxAttendees ? 'border-destructive' : ''}`}
                disabled={isSubmitting}
              />
              {errors.maxAttendees && (
                <p className="text-sm text-destructive">{errors.maxAttendees}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration-deadline" className="text-base font-medium">
                Registration Deadline <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="registration-deadline"
                type="date"
                value={formData.registrationDeadline}
                onChange={(e) => updateField('registrationDeadline', e.target.value)}
                min={today}
                max={formData.date || undefined}
                className={`h-11 ${errors.registrationDeadline ? 'border-destructive' : ''}`}
                disabled={isSubmitting}
              />
              {errors.registrationDeadline && (
                <p className="text-sm text-destructive">{errors.registrationDeadline}</p>
              )}
            </div>
          </div>

          {/* Public Event Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="public-event" className="text-base font-medium">Public Event</Label>
              <p className="text-sm text-muted-foreground">
                Event will be visible to all users
              </p>
            </div>
            <Switch
              id="public-event"
              checked={formData.isPublic}
              onCheckedChange={(checked) => updateField('isPublic', checked)}
              disabled={isSubmitting}
            />
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
              value={formData.imageUrl}
              onChange={(e) => updateField('imageUrl', e.target.value)}
              className={`h-11 ${errors.imageUrl ? 'border-destructive' : ''}`}
              disabled={isSubmitting}
            />
            {errors.imageUrl ? (
              <p className="text-sm text-destructive">{errors.imageUrl}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Leave blank for default event image based on event type
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-11"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 h-11"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editEvent ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editEvent ? 'Update Event' : 'Create Event'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;
