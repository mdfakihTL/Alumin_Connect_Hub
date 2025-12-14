"""
Event models for alumni events
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel


class EventType(str, enum.Enum):
    """Event types"""
    NETWORKING = "networking"
    WORKSHOP = "workshop"
    CONFERENCE = "conference"
    SOCIAL = "social"
    WEBINAR = "webinar"
    OTHER = "other"


class EventStatus(str, enum.Enum):
    """Event status"""
    DRAFT = "draft"
    PUBLISHED = "published"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class Event(BaseModel):
    """Event model"""
    __tablename__ = "events"

    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    event_type = Column(SQLEnum(EventType), nullable=False)
    status = Column(SQLEnum(EventStatus), default=EventStatus.DRAFT, nullable=False)
    start_date = Column(DateTime, nullable=False, index=True)
    end_date = Column(DateTime, nullable=True)
    location = Column(String(255), nullable=True)
    venue = Column(String(255), nullable=True)
    max_attendees = Column(Integer, nullable=True)
    registration_deadline = Column(DateTime, nullable=True)
    image_url = Column(String(512), nullable=True)
    registration_url = Column(String(512), nullable=True)
    is_online = Column(Boolean, default=False, nullable=False)
    online_link = Column(String(512), nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=False)

    # Relationships
    creator = relationship("User", back_populates="events_created", foreign_keys=[creator_id])
    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")


class EventRegistration(BaseModel):
    """Event registration model"""
    __tablename__ = "event_registrations"

    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    registration_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="registered", nullable=False)  # registered, cancelled, attended
    notes = Column(Text, nullable=True)

    # Relationships
    event = relationship("Event", back_populates="registrations")
    user = relationship("User")


