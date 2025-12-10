"""
User model for authentication and authorization
"""
from sqlalchemy import Column, String, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel


class UserRole(str, enum.Enum):
    """User roles"""
    ADMIN = "admin"
    ALUMNI = "alumni"
    MODERATOR = "moderator"
    GUEST = "guest"


class User(BaseModel):
    """User model"""
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    role = Column(String(50), default=UserRole.GUEST.value, nullable=False)
    last_login = Column(String(255), nullable=True)
    refresh_token = Column(String(512), nullable=True)

    # Relationships
    alumni_profile = relationship("AlumniProfile", back_populates="user", uselist=False)
    events_created = relationship("Event", back_populates="creator", foreign_keys="Event.creator_id")
    job_postings = relationship("JobPosting", back_populates="poster")
    documents = relationship("Document", back_populates="uploader")
    chat_sessions = relationship("ChatSession", back_populates="user")


