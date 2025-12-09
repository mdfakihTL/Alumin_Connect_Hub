"""
Event schemas
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.event import EventType, EventStatus


class EventBase(BaseModel):
    """Base event schema"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    event_type: EventType
    start_date: datetime
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    venue: Optional[str] = None
    max_attendees: Optional[int] = Field(None, gt=0)
    registration_deadline: Optional[datetime] = None
    image_url: Optional[str] = None
    registration_url: Optional[str] = None
    is_online: bool = False
    online_link: Optional[str] = None


class EventCreate(EventBase):
    """Schema for creating event"""
    pass


class EventUpdate(BaseModel):
    """Schema for updating event"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    status: Optional[EventStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    venue: Optional[str] = None
    max_attendees: Optional[int] = Field(None, gt=0)
    registration_deadline: Optional[datetime] = None
    image_url: Optional[str] = None
    registration_url: Optional[str] = None
    is_online: Optional[bool] = None
    online_link: Optional[str] = None


class EventResponse(EventBase):
    """Event response schema"""
    id: int
    status: EventStatus
    creator_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EventRegistrationCreate(BaseModel):
    """Schema for event registration"""
    event_id: int
    notes: Optional[str] = None


class EventRegistrationResponse(BaseModel):
    """Event registration response schema"""
    id: int
    event_id: int
    user_id: int
    registration_date: datetime
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


