"""
Lead Intelligence Models
Comprehensive event tracking for lead scoring and analytics
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, JSON, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class EventType(str, enum.Enum):
    """Types of trackable events"""
    # Ad Events
    AD_VIEW = "ad_view"
    AD_CLICK = "ad_click"
    AD_IGNORE = "ad_ignore"
    
    # Career Roadmap Events
    ROADMAP_VIEW = "roadmap_view"
    ROADMAP_GENERATE = "roadmap_generate"
    ROADMAP_SAVE = "roadmap_save"
    CAREER_PATH_CLICK = "career_path_click"
    
    # Mentor Events
    MENTOR_VIEW = "mentor_view"
    MENTOR_CONNECT = "mentor_connect"
    MENTOR_MESSAGE = "mentor_message"
    
    # Feed Events
    POST_VIEW = "post_view"
    POST_LIKE = "post_like"
    POST_COMMENT = "post_comment"
    POST_SHARE = "post_share"
    POST_SAVE = "post_save"
    
    # Profile Events
    PROFILE_VIEW = "profile_view"
    PROFILE_UPDATE = "profile_update"
    
    # Group Events
    GROUP_JOIN = "group_join"
    GROUP_POST = "group_post"
    
    # Event Events
    EVENT_VIEW = "event_view"
    EVENT_REGISTER = "event_register"
    EVENT_ATTEND = "event_attend"


class LeadCategory(str, enum.Enum):
    """Lead classification categories"""
    HOT = "hot"
    WARM = "warm"
    COLD = "cold"


class LeadActivity(Base):
    """
    Unified event tracking table for all user activities.
    This is the core table for lead intelligence.
    """
    __tablename__ = "lead_activities"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    university_id = Column(String, ForeignKey("universities.id"), nullable=True, index=True)
    
    # Event details
    event_type = Column(String, nullable=False, index=True)
    event_category = Column(String, nullable=False, index=True)  # ad, career, feed, mentor, etc.
    
    # Reference to related entity (ad_id, post_id, career_goal, etc.)
    reference_id = Column(String, nullable=True)
    reference_type = Column(String, nullable=True)  # ad, post, roadmap, mentor, etc.
    
    # Additional metadata
    metadata = Column(JSON, default=dict)
    
    # Scoring
    base_score = Column(Integer, default=0)  # Points for this activity
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    university = relationship("University", foreign_keys=[university_id])


class LeadScore(Base):
    """
    Computed lead scores for each user.
    Updated periodically or on significant activity.
    """
    __tablename__ = "lead_scores"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    university_id = Column(String, ForeignKey("universities.id"), nullable=True, index=True)
    
    # Component scores (0-100 scale)
    ad_engagement_score = Column(Float, default=0.0)
    career_engagement_score = Column(Float, default=0.0)
    feed_engagement_score = Column(Float, default=0.0)
    mentor_engagement_score = Column(Float, default=0.0)
    event_engagement_score = Column(Float, default=0.0)
    
    # Overall score and category
    overall_score = Column(Float, default=0.0, index=True)
    lead_category = Column(String, default=LeadCategory.COLD.value, index=True)
    
    # Activity counts
    total_activities = Column(Integer, default=0)
    activities_last_7_days = Column(Integer, default=0)
    activities_last_30_days = Column(Integer, default=0)
    
    # Engagement multiplier (increases with frequent activity)
    engagement_multiplier = Column(Float, default=1.0)
    
    # Key interests (extracted from activity)
    primary_career_interest = Column(String, nullable=True)
    career_interests = Column(JSON, default=list)
    
    # Conversion signals
    conversion_probability = Column(Float, default=0.0)
    
    # Timestamps
    last_activity_at = Column(DateTime(timezone=True), nullable=True)
    score_updated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    university = relationship("University", foreign_keys=[university_id])


class AdClick(Base):
    """Track when users click on ads"""
    __tablename__ = "ad_clicks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    ad_id = Column(String, ForeignKey("ads.id"), nullable=False, index=True)
    university_id = Column(String, ForeignKey("universities.id"), nullable=True, index=True)
    
    clicked_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User")
    ad = relationship("Ad")
    university = relationship("University")


class AdImpression(Base):
    """Track when ads are shown to users"""
    __tablename__ = "ad_impressions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    ad_id = Column(String, ForeignKey("ads.id"), nullable=False, index=True)
    university_id = Column(String, ForeignKey("universities.id"), nullable=True, index=True)
    
    viewed_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User")
    ad = relationship("Ad")
    university = relationship("University")


class CareerRoadmapRequest(Base):
    """Track career roadmap generation requests"""
    __tablename__ = "career_roadmap_requests"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    university_id = Column(String, ForeignKey("universities.id"), nullable=True, index=True)
    
    career_goal = Column(String, nullable=False, index=True)
    current_position = Column(String, nullable=True)
    target_position = Column(String, nullable=False)
    experience_level = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    
    preferences = Column(JSON, default=dict)
    
    requested_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User")
    university = relationship("University")


class CareerRoadmapView(Base):
    """Track when users view career roadmaps"""
    __tablename__ = "career_roadmap_views"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    roadmap_request_id = Column(String, ForeignKey("career_roadmap_requests.id"), nullable=True)
    career_goal = Column(String, nullable=False, index=True)
    university_id = Column(String, ForeignKey("universities.id"), nullable=True, index=True)
    
    viewed_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User")
    roadmap_request = relationship("CareerRoadmapRequest")
    university = relationship("University")


class MentorConnect(Base):
    """Track mentor connection requests from career roadmap"""
    __tablename__ = "mentor_connects"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    mentor_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    university_id = Column(String, ForeignKey("universities.id"), nullable=True, index=True)
    
    career_context = Column(String, nullable=True)  # What career goal triggered this
    source = Column(String, default="roadmap")  # roadmap, profile, search
    
    connected_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    mentor = relationship("User", foreign_keys=[mentor_id])
    university = relationship("University")


class FeedEngagement(Base):
    """Track feed/post engagement"""
    __tablename__ = "feed_engagements"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    post_id = Column(String, ForeignKey("posts.id"), nullable=False, index=True)
    university_id = Column(String, ForeignKey("universities.id"), nullable=True, index=True)
    
    engagement_type = Column(String, nullable=False)  # view, like, comment, share, save
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User")
    post = relationship("Post")
    university = relationship("University")


class AIInsight(Base):
    """Store AI-generated insights for the dashboard"""
    __tablename__ = "ai_insights"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    insight_type = Column(String, nullable=False, index=True)  # trend, recommendation, alert
    category = Column(String, nullable=False)  # career, ad, engagement, university
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    
    # Related entities
    university_id = Column(String, ForeignKey("universities.id"), nullable=True)
    related_data = Column(JSON, default=dict)
    
    # Metrics
    confidence_score = Column(Float, default=0.0)
    impact_score = Column(Float, default=0.0)  # How significant is this insight
    
    # Status
    is_active = Column(Boolean, default=True)
    is_dismissed = Column(Boolean, default=False)
    
    # Timestamps
    valid_from = Column(DateTime(timezone=True), server_default=func.now())
    valid_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    university = relationship("University")
