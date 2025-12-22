import uuid
from datetime import datetime, date
from enum import Enum
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date, Text, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class FundraiserStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    EXPIRED = "expired"


class Fundraiser(Base):
    __tablename__ = "fundraisers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    university_id = Column(String, ForeignKey("universities.id"), nullable=False)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    image = Column(String, default=None)
    
    # External donation link - required
    donation_link = Column(String, nullable=False)
    
    # Date range
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # Status: draft, active, expired - using String to avoid enum name/value conflicts
    status = Column(String(20), default="draft")
    
    # Legacy fields (kept for backward compatibility, no longer used)
    goal_amount = Column(Integer, default=0)
    current_amount = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    university = relationship("University", back_populates="fundraisers")
    clicks = relationship("FundraiserClick", back_populates="fundraiser", cascade="all, delete-orphan")

    def get_effective_status(self) -> str:
        """Get the effective status based on dates and manual status."""
        if self.status == "draft":
            return "draft"
        
        today = date.today()
        if self.start_date and today < self.start_date:
            return "scheduled"
        elif self.end_date and today > self.end_date:
            return "expired"
        elif self.status == "active":
            return "active"
        return self.status or "draft"

    def is_currently_active(self) -> bool:
        """Check if fundraiser is currently active and within date range."""
        if self.status != "active":
            return False
        today = date.today()
        if self.start_date and today < self.start_date:
            return False
        if self.end_date and today > self.end_date:
            return False
        return True


class FundraiserClick(Base):
    """Track clicks on fundraiser donation links."""
    __tablename__ = "fundraiser_clicks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    fundraiser_id = Column(String, ForeignKey("fundraisers.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Click metadata
    clicked_at = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    # Session tracking for debounce
    session_id = Column(String, nullable=True, index=True)

    # Relationships
    fundraiser = relationship("Fundraiser", back_populates="clicks")
    user = relationship("User")

    # Indexes for analytics queries
    __table_args__ = (
        Index('ix_fundraiser_clicks_fundraiser_date', 'fundraiser_id', 'clicked_at'),
        Index('ix_fundraiser_clicks_user', 'fundraiser_id', 'user_id'),
    )
