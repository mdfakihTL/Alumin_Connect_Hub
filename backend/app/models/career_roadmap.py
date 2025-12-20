"""
Career Roadmap Models
For saving user's AI-generated career roadmaps
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class SavedRoadmap(Base):
    """User's saved career roadmaps"""
    __tablename__ = "saved_roadmaps"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    university_id = Column(String, ForeignKey("universities.id"), nullable=True)
    
    # User's input
    career_goal = Column(String, nullable=False)  # e.g., "Become a Tech Lead"
    current_role = Column(String, default=None)   # e.g., "Software Engineer"
    years_experience = Column(Integer, default=0)
    
    # AI-generated roadmap content
    title = Column(String, nullable=False)        # e.g., "Software Engineer to Tech Lead"
    summary = Column(Text, default=None)          # Brief overview
    estimated_duration = Column(String, default=None)  # e.g., "2-3 years"
    
    # Milestones stored as JSON array
    # Format: [{"id": 1, "title": "...", "description": "...", "duration": "...", "skills": [...], "resources": [...]}]
    milestones = Column(JSON, default=list)
    
    # Skills needed (JSON array)
    skills_required = Column(JSON, default=list)
    
    # Related alumni IDs who work in this field (JSON array of user IDs)
    related_alumni_ids = Column(JSON, default=list)
    
    # Metadata
    is_public = Column(Boolean, default=False)  # Can others see this roadmap?
    views_count = Column(Integer, default=0)
    saves_count = Column(Integer, default=0)    # How many others saved similar roadmaps
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    university = relationship("University")


class RoadmapProgress(Base):
    """Track user's progress on a saved roadmap"""
    __tablename__ = "roadmap_progress"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    roadmap_id = Column(String, ForeignKey("saved_roadmaps.id"), nullable=False)
    
    # Milestone completion status (JSON: {"milestone_id": true/false})
    completed_milestones = Column(JSON, default=dict)
    
    # Notes for each milestone (JSON: {"milestone_id": "user notes"})
    milestone_notes = Column(JSON, default=dict)
    
    # Overall progress percentage
    progress_percentage = Column(Integer, default=0)
    
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    last_updated = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), default=None)
    
    # Relationships
    user = relationship("User")
    roadmap = relationship("SavedRoadmap")

