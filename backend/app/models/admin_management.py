"""
Admin Management Models
Handles admin users, password reset requests, and audit logging
"""
import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PasswordResetStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class AuditAction(str, Enum):
    ADMIN_CREATED = "admin_created"
    ADMIN_DEACTIVATED = "admin_deactivated"
    ADMIN_ACTIVATED = "admin_activated"
    ADMIN_DELETED = "admin_deleted"
    PASSWORD_RESET_REQUESTED = "password_reset_requested"
    PASSWORD_RESET_APPROVED = "password_reset_approved"
    PASSWORD_RESET_REJECTED = "password_reset_rejected"
    PASSWORD_CHANGED = "password_changed"
    FIRST_LOGIN_PASSWORD_CHANGE = "first_login_password_change"


class AdminPasswordResetRequest(Base):
    """
    Tracks admin password reset requests with proper status management
    """
    __tablename__ = "admin_password_reset_requests"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    status = Column(SQLEnum(PasswordResetStatus), default=PasswordResetStatus.PENDING)
    
    # Request details
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    processed_by = Column(String, ForeignKey("users.id"), nullable=True)  # SuperAdmin who processed
    
    # Notes
    rejection_reason = Column(Text, nullable=True)
    
    # Relationships
    admin = relationship("User", foreign_keys=[admin_id], backref="password_reset_requests")
    processor = relationship("User", foreign_keys=[processed_by])


class AdminAuditLog(Base):
    """
    Audit log for admin-related actions
    """
    __tablename__ = "admin_audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    action = Column(SQLEnum(AuditAction), nullable=False)
    
    # Who performed the action
    performed_by = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Target of the action (if applicable)
    target_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    # Additional details as JSON string
    details = Column(Text, nullable=True)
    
    # IP and user agent for security tracking
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    performer = relationship("User", foreign_keys=[performed_by], backref="audit_logs_performed")
    target = relationship("User", foreign_keys=[target_user_id], backref="audit_logs_target")

