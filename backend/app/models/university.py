import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class University(Base):
    __tablename__ = "universities"

    id = Column(String, primary_key=True)  # Short code like 'mit', 'stanford'
    name = Column(String, unique=True, nullable=False)
    logo = Column(String, default=None)
    colors = Column(Text, default=None)  # JSON string for theme colors
    is_enabled = Column(Boolean, default=True)
    
    # Email settings for this university
    email = Column(String, default=None)  # University email address
    smtp_host = Column(String, default=None)  # SMTP server hostname
    smtp_port = Column(Integer, default=587)  # SMTP port
    smtp_user = Column(String, default=None)  # SMTP username
    smtp_password = Column(String, default=None)  # SMTP password (encrypted in production)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    users = relationship("User", back_populates="university")
    events = relationship("Event", back_populates="university")
    groups = relationship("Group", back_populates="university")
    fundraisers = relationship("Fundraiser", back_populates="university")
    ads = relationship("Ad", back_populates="university")
    document_requests = relationship("DocumentRequest", back_populates="university")
    support_tickets = relationship("SupportTicket", back_populates="university")
