"""
Course Models
Represents courses that can be sold to alumni leads
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, JSON, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class CourseLevel(str, enum.Enum):
    """Course level classification"""
    UG = "ug"  # Undergraduate
    PG = "pg"  # Postgraduate
    CERTIFICATE = "certificate"
    EXECUTIVE = "executive"
    DIPLOMA = "diploma"


class CourseCategory(str, enum.Enum):
    """Course categories"""
    TECHNOLOGY = "technology"
    BUSINESS = "business"
    DATA_SCIENCE = "data_science"
    MANAGEMENT = "management"
    FINANCE = "finance"
    MARKETING = "marketing"
    HEALTHCARE = "healthcare"
    DESIGN = "design"
    ENGINEERING = "engineering"
    LAW = "law"
    OTHER = "other"


class Course(Base):
    """
    Course model - represents programs that can be sold to leads
    """
    __tablename__ = "courses"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Basic info
    name = Column(String, nullable=False)
    short_name = Column(String, nullable=True)  # e.g., "MBA", "B.Tech"
    description = Column(Text, nullable=True)
    
    # Classification
    level = Column(String, nullable=False, index=True)  # ug, pg, certificate, executive
    category = Column(String, nullable=False, index=True)  # technology, business, etc.
    
    # Targeting
    target_experience_min = Column(Integer, default=0)  # Min years of experience
    target_experience_max = Column(Integer, default=30)  # Max years of experience
    target_career_goals = Column(JSON, default=list)  # List of career goals this course helps with
    target_industries = Column(JSON, default=list)  # Industries this course is good for
    
    # Pricing
    price = Column(Float, default=0.0)
    currency = Column(String, default="USD")
    
    # Duration
    duration_months = Column(Integer, default=12)
    format = Column(String, default="online")  # online, offline, hybrid
    
    # Provider
    provider_name = Column(String, nullable=True)  # University or institution name
    provider_logo = Column(String, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    
    # Metrics
    total_enrollments = Column(Integer, default=0)
    conversion_rate = Column(Float, default=0.0)
    avg_rating = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class AdCourseMapping(Base):
    """
    Maps ads to courses they promote
    """
    __tablename__ = "ad_course_mappings"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ad_id = Column(String, ForeignKey("ads.id"), nullable=False, index=True)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False, index=True)
    
    # Priority for this ad-course combo (higher = more relevant)
    relevance_score = Column(Float, default=1.0)
    is_primary = Column(Boolean, default=False)  # Is this the main course promoted by the ad?
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    ad = relationship("Ad")
    course = relationship("Course")


class LeadCourseInterest(Base):
    """
    Tracks inferred course interest for each lead based on their behavior
    """
    __tablename__ = "lead_course_interests"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False, index=True)
    
    # Interest signals
    ad_views = Column(Integer, default=0)  # How many times they saw ads for this course
    ad_clicks = Column(Integer, default=0)  # How many times they clicked ads for this course
    page_views = Column(Integer, default=0)  # Direct course page views
    time_spent_seconds = Column(Integer, default=0)  # Time spent on course pages
    
    # Calculated scores
    interest_score = Column(Float, default=0.0)  # 0-100 interest level
    purchase_probability = Column(Float, default=0.0)  # 0-1 likelihood to buy
    
    # Recommendation data
    recommendation_rank = Column(Integer, default=0)  # Rank among all courses for this user
    recommendation_reason = Column(String, nullable=True)  # Why we recommend this
    
    # Status
    has_enrolled = Column(Boolean, default=False)
    has_contacted = Column(Boolean, default=False)
    
    # Timestamps
    first_interaction_at = Column(DateTime(timezone=True), nullable=True)
    last_interaction_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    course = relationship("Course")


class CourseConversion(Base):
    """
    Tracks course conversions (when a lead becomes a student)
    """
    __tablename__ = "course_conversions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False, index=True)
    
    # Conversion details
    conversion_type = Column(String, default="enrollment")  # enrollment, inquiry, application
    source = Column(String, nullable=True)  # ad, organic, referral, email
    source_ad_id = Column(String, ForeignKey("ads.id"), nullable=True)
    
    # Value
    revenue = Column(Float, default=0.0)
    
    # Lead score at conversion
    lead_score_at_conversion = Column(Float, default=0.0)
    
    converted_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    course = relationship("Course")
    source_ad = relationship("Ad")

