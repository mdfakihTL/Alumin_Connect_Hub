"""
Alumni profile model
"""
from sqlalchemy import Column, String, Date, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.db.base import BaseModel


class AlumniProfile(BaseModel):
    """Alumni profile information"""
    __tablename__ = "alumni_profiles"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    graduation_year = Column(Integer, nullable=True)
    degree = Column(String(255), nullable=True)
    major = Column(String(255), nullable=True)
    current_position = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    linkedin_url = Column(String(512), nullable=True)
    github_url = Column(String(512), nullable=True)
    website_url = Column(String(512), nullable=True)
    profile_picture_url = Column(String(512), nullable=True)
    skills = Column(Text, nullable=True)  # JSON string or comma-separated
    interests = Column(Text, nullable=True)  # JSON string or comma-separated

    # Relationships
    user = relationship("User", back_populates="alumni_profile")


