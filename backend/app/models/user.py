import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class UserRole(str, Enum):
    ALUMNI = "alumni"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True)  # Optional, generated from email if not provided
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    avatar = Column(String, default=None)
    
    university_id = Column(String, ForeignKey("universities.id"), nullable=True)
    graduation_year = Column(Integer, nullable=True)
    major = Column(String, nullable=True)
    
    role = Column(SQLEnum(UserRole), default=UserRole.ALUMNI)
    is_mentor = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Password reset
    password_reset_requested = Column(Boolean, default=False)
    password_reset_requested_at = Column(DateTime, nullable=True)
    
    # First login / force password reset
    force_password_reset = Column(Boolean, default=False)  # If True, user must change password on login
    temp_password_expires_at = Column(DateTime, nullable=True)  # When temporary password expires
    last_password_change = Column(DateTime, nullable=True)  # Track password changes
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    university = relationship("University", back_populates="users")
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    
    bio = Column(Text, default=None)
    phone = Column(String, default=None)
    location = Column(String, default=None)  # City, Country text
    job_title = Column(String, default=None)
    company = Column(String, default=None)
    linkedin = Column(String, default=None)
    website = Column(String, default=None)
    banner = Column(String, default=None)
    
    # Geolocation for heat map
    latitude = Column(String, default=None)  # Stored as string for precision
    longitude = Column(String, default=None)
    city = Column(String, default=None)
    country = Column(String, default=None)
    country_code = Column(String(3), default=None)  # ISO 3166-1 alpha-2/3
    geohash = Column(String(12), default=None, index=True)  # For efficient geo queries
    
    # Privacy settings
    is_discoverable = Column(Boolean, default=True)  # Show on heat map
    show_exact_location = Column(Boolean, default=False)  # Show exact vs city-level
    
    # Stats
    connections_count = Column(Integer, default=0)
    posts_count = Column(Integer, default=0)
    
    # Experience and Education (stored as JSON)
    experience = Column(Text, default="[]")  # JSON string
    education = Column(Text, default="[]")   # JSON string
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="profile")
