"""
Course Intelligence Models
For tracking course-related leads and predictions
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, JSON, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class CourseType(str, enum.Enum):
    """Types of courses offered"""
    UG = "ug"                    # Undergraduate courses
    PG = "pg"                    # Postgraduate (Masters, MBA, etc.)
    EXECUTIVE = "executive"      # Executive education
    CERTIFICATE = "certificate"  # Short certifications
    BOOTCAMP = "bootcamp"        # Intensive bootcamps


class CourseCategory(str, enum.Enum):
    """Course subject categories"""
    TECHNOLOGY = "technology"
    BUSINESS = "business"
    DATA_SCIENCE = "data_science"
    MANAGEMENT = "management"
    FINANCE = "finance"
    MARKETING = "marketing"
    DESIGN = "design"
    HEALTHCARE = "healthcare"
    LAW = "law"
    ENGINEERING = "engineering"


class LeadTemperature(str, enum.Enum):
    """Lead classification"""
    HOT = "hot"
    WARM = "warm"
    COLD = "cold"


class Course(Base):
    """Courses available for sale"""
    __tablename__ = "courses"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    name = Column(String, nullable=False)
    short_name = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    
    course_type = Column(String, nullable=False)  # ug, pg, executive, certificate, bootcamp
    category = Column(String, nullable=False)      # technology, business, etc.
    
    # Pricing
    price = Column(Float, default=0.0)
    currency = Column(String, default="USD")
    
    # Duration
    duration_months = Column(Integer, default=12)
    format = Column(String, default="online")  # online, offline, hybrid
    
    # Target audience
    min_experience_years = Column(Integer, default=0)
    max_experience_years = Column(Integer, default=30)
    target_education_level = Column(String, nullable=True)  # ug_graduate, pg_graduate, any
    
    # University offering
    university_id = Column(String, ForeignKey("universities.id"), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Metadata
    tags = Column(JSON, default=list)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    university = relationship("University")


class CourseAd(Base):
    """Ads for specific courses"""
    __tablename__ = "course_ads"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    course_id = Column(String, ForeignKey("courses.id"), nullable=False, index=True)
    ad_id = Column(String, ForeignKey("ads.id"), nullable=True, index=True)
    
    # Ad content
    headline = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    cta_text = Column(String, default="Learn More")
    landing_url = Column(String, nullable=True)
    
    # Targeting
    target_universities = Column(JSON, default=list)  # List of university IDs
    target_graduation_years = Column(JSON, default=list)  # e.g., [2018, 2019, 2020]
    target_majors = Column(JSON, default=list)
    target_career_interests = Column(JSON, default=list)
    
    # Budget & schedule
    daily_budget = Column(Float, default=100.0)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    course = relationship("Course")
    ad = relationship("Ad")


class CourseAdInteraction(Base):
    """Track user interactions with course ads"""
    __tablename__ = "course_ad_interactions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    course_ad_id = Column(String, ForeignKey("course_ads.id"), nullable=False, index=True)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False, index=True)
    university_id = Column(String, ForeignKey("universities.id"), nullable=True, index=True)
    
    # Interaction type
    interaction_type = Column(String, nullable=False)  # impression, click, hover, dismiss
    
    # Context
    source_page = Column(String, nullable=True)  # feed, roadmap, profile, etc.
    session_id = Column(String, nullable=True)
    
    # Engagement metrics
    time_spent_seconds = Column(Integer, default=0)
    scroll_depth = Column(Float, default=0.0)  # How far they scrolled on landing page
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User")
    course_ad = relationship("CourseAd")
    course = relationship("Course")
    university = relationship("University")


class CourseLead(Base):
    """
    Lead intelligence for course sales.
    Each record represents a potential lead for a specific course.
    """
    __tablename__ = "course_leads"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False, index=True)
    university_id = Column(String, ForeignKey("universities.id"), nullable=True, index=True)
    
    # Scores (0-100)
    interest_score = Column(Float, default=0.0)       # Based on ad interactions
    fit_score = Column(Float, default=0.0)            # Based on profile match
    intent_score = Column(Float, default=0.0)         # Based on recent behavior
    overall_score = Column(Float, default=0.0)        # Combined weighted score
    
    # Classification
    lead_temperature = Column(String, default=LeadTemperature.COLD.value, index=True)
    
    # Prediction
    purchase_probability = Column(Float, default=0.0)  # 0.0 to 1.0
    predicted_conversion_date = Column(DateTime(timezone=True), nullable=True)
    
    # Signals
    ad_impressions = Column(Integer, default=0)
    ad_clicks = Column(Integer, default=0)
    landing_page_visits = Column(Integer, default=0)
    brochure_downloads = Column(Integer, default=0)
    inquiry_submitted = Column(Boolean, default=False)
    
    # Engagement history
    first_interaction_at = Column(DateTime(timezone=True), nullable=True)
    last_interaction_at = Column(DateTime(timezone=True), nullable=True)
    interaction_count = Column(Integer, default=0)
    
    # Recommendation reason
    recommendation_reasons = Column(JSON, default=list)  # Why this course is recommended
    
    # Status
    status = Column(String, default="active")  # active, contacted, converted, lost
    contacted_at = Column(DateTime(timezone=True), nullable=True)
    converted_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    course = relationship("Course")
    university = relationship("University")


class CourseRecommendation(Base):
    """AI-generated course recommendations for users"""
    __tablename__ = "course_recommendations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False, index=True)
    
    # Recommendation details
    rank = Column(Integer, default=1)  # 1 = top recommendation
    confidence_score = Column(Float, default=0.0)  # Model confidence
    
    # Reasons (explainable AI)
    reasons = Column(JSON, default=list)  # List of reason strings
    
    # Feature contributions
    feature_weights = Column(JSON, default=dict)  # Which features contributed most
    
    # Model info
    model_version = Column(String, default="v1.0")
    
    is_active = Column(Boolean, default=True)
    shown_to_user = Column(Boolean, default=False)
    clicked = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    course = relationship("Course")


class UserCourseProfile(Base):
    """
    User profile attributes relevant for course recommendations.
    Aggregated from user activities for faster querying.
    """
    __tablename__ = "user_course_profiles"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    university_id = Column(String, ForeignKey("universities.id"), nullable=True, index=True)
    
    # Education level
    education_level = Column(String, nullable=True)  # ug, pg, phd
    graduation_year = Column(Integer, nullable=True)
    years_since_graduation = Column(Integer, default=0)
    major = Column(String, nullable=True)
    
    # Career info
    current_role = Column(String, nullable=True)
    current_company = Column(String, nullable=True)
    years_of_experience = Column(Integer, default=0)
    industry = Column(String, nullable=True)
    
    # Career aspirations (from roadmap data)
    career_goals = Column(JSON, default=list)
    interested_industries = Column(JSON, default=list)
    skill_gaps = Column(JSON, default=list)
    
    # Course preferences (inferred)
    preferred_course_types = Column(JSON, default=list)  # ug, pg, executive, etc.
    preferred_categories = Column(JSON, default=list)    # technology, business, etc.
    preferred_format = Column(String, default="online")  # online, offline, hybrid
    budget_range = Column(String, nullable=True)         # low, medium, high
    
    # Engagement metrics
    total_ad_impressions = Column(Integer, default=0)
    total_ad_clicks = Column(Integer, default=0)
    total_course_views = Column(Integer, default=0)
    
    # Scores
    engagement_score = Column(Float, default=0.0)
    conversion_readiness = Column(Float, default=0.0)  # How ready they are to buy
    
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    university = relationship("University")

