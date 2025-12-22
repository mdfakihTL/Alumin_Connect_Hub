from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import json


class UniversityStats(BaseModel):
    id: str
    name: str
    logo: Optional[str] = None
    alumni_count: int
    admin_count: int
    is_enabled: bool


class SuperAdminDashboardStats(BaseModel):
    total_universities: int
    enabled_universities: int
    total_admins: int
    total_alumni: int
    total_posts: int
    total_events: int
    total_groups: int
    active_ads: int
    pending_admin_resets: int
    universities: List[Dict[str, Any]]


class UniversityCreate(BaseModel):
    id: str
    name: str
    logo: Optional[str] = None
    colors: Optional[str] = None  # JSON string
    email: Optional[EmailStr] = None  # University email for sending emails
    smtp_host: Optional[str] = None  # SMTP server (e.g., smtp.gmail.com)
    smtp_port: Optional[int] = 587  # SMTP port
    smtp_user: Optional[str] = None  # SMTP username
    smtp_password: Optional[str] = None  # SMTP password


class UniversityUpdate(BaseModel):
    name: Optional[str] = None
    logo: Optional[str] = None
    colors: Optional[str] = None
    is_enabled: Optional[bool] = None
    email: Optional[EmailStr] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None


class UniversityResponse(BaseModel):
    id: str
    name: str
    logo: Optional[str] = None
    colors: Optional[str] = None
    is_enabled: bool = True
    alumni_count: int = 0
    admin_count: int = 0
    email: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    # Note: smtp_password is not included in response for security
    created_at: datetime

    class Config:
        from_attributes = True


class AdminUserCreate(BaseModel):
    """Create admin - password auto-generated if not provided"""
    email: EmailStr
    password: Optional[str] = None  # Auto-generated if not provided
    name: str
    university_id: str


class AdminUserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = None
    university_id: Optional[str] = None
    university_name: str = "Unassigned"
    is_active: bool = True
    force_password_reset: bool = False
    temp_password_expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AdminUserListResponse(BaseModel):
    admins: List[AdminUserResponse]
    total: int
    page: int
    page_size: int


class PasswordResetRequestStatus(BaseModel):
    """Status enum for password reset requests"""
    pending: str = "pending"
    approved: str = "approved"
    rejected: str = "rejected"


class AdminPasswordResetRequest(BaseModel):
    """Legacy - simple password reset request"""
    id: str
    admin_name: str
    admin_email: str
    university_name: str
    requested_at: Optional[datetime] = None


class AdminPasswordResetRequestFull(BaseModel):
    """Full password reset request with status tracking"""
    id: str
    admin_id: str
    admin_name: str
    admin_email: str
    university_id: Optional[str] = None
    university_name: str
    status: str  # pending, approved, rejected
    requested_at: datetime
    processed_at: Optional[datetime] = None
    processed_by_name: Optional[str] = None
    rejection_reason: Optional[str] = None

    class Config:
        from_attributes = True


class AdminPasswordResetListResponse(BaseModel):
    requests: List[AdminPasswordResetRequest]
    total: int
    page: int
    page_size: int


class AdminPasswordResetListResponseFull(BaseModel):
    """Full response with all statuses"""
    requests: List[AdminPasswordResetRequestFull]
    total: int
    pending_count: int
    approved_count: int
    rejected_count: int
    page: int
    page_size: int


class ApprovePasswordResetRequest(BaseModel):
    """Approve a password reset - generates new temp password"""
    pass  # No body needed, generates password automatically


class RejectPasswordResetRequest(BaseModel):
    """Reject a password reset with reason"""
    reason: Optional[str] = None


class AuditLogResponse(BaseModel):
    """Audit log entry response"""
    id: str
    action: str
    performed_by_name: str
    target_user_name: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    """Paginated audit logs"""
    logs: List[AuditLogResponse]
    total: int
    page: int
    page_size: int


class GlobalAdCreate(BaseModel):
    """Create a new advertisement."""
    title: str
    description: Optional[str] = None
    media_url: str  # URL to image or video
    media_type: str = "image"  # 'image' or 'video'
    link_url: Optional[str] = None  # Target URL when clicking "Learn More"
    placement: str = "feed"  # 'left-sidebar', 'right-sidebar', 'feed'
    target_universities: List[str] = ["all"]  # ['all'] or list of university IDs
    
    # Legacy fields for backward compatibility
    image: Optional[str] = None
    link: Optional[str] = None
    type: Optional[str] = "general"


class GlobalAdUpdate(BaseModel):
    """Update an existing advertisement."""
    title: Optional[str] = None
    description: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    link_url: Optional[str] = None
    placement: Optional[str] = None
    target_universities: Optional[List[str]] = None
    is_active: Optional[bool] = None
    
    # Legacy fields
    image: Optional[str] = None
    link: Optional[str] = None


class GlobalAdResponse(BaseModel):
    """Advertisement response."""
    id: str
    title: str
    description: Optional[str] = None
    media_url: str
    media_type: str = "image"
    link_url: Optional[str] = None
    placement: str = "feed"
    target_universities: List[str] = ["all"]
    is_active: bool = True
    impressions: int = 0
    clicks: int = 0
    created_at: Optional[datetime] = None
    
    # Legacy fields for backward compatibility
    image: Optional[str] = None  # Deprecated
    link: Optional[str] = None  # Deprecated
    type: str = "general"

    class Config:
        from_attributes = True


class AdListResponse(BaseModel):
    """List of advertisements."""
    ads: List[GlobalAdResponse]
    total: int
    active_count: int


# Global User Management (All users across all universities)
class GlobalUserResponse(BaseModel):
    """Global user response for superadmin."""
    id: str
    name: str
    email: str
    avatar: Optional[str] = None
    role: str  # 'SUPERADMIN', 'ADMIN', 'ALUMNI'
    university_id: Optional[str] = None
    university_name: Optional[str] = None
    graduation_year: Optional[int] = None
    major: Optional[str] = None
    is_mentor: bool = False
    is_active: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GlobalUserListResponse(BaseModel):
    """Paginated list of all users."""
    users: List[GlobalUserResponse]
    total: int
    page: int
    page_size: int
    role_counts: Dict[str, int]  # e.g., {'superadmin': 1, 'admin': 5, 'alumni': 100}


class GlobalUserCreate(BaseModel):
    """Create a new user (any role)."""
    email: EmailStr
    password: str
    name: str
    role: str  # 'SUPERADMIN', 'ADMIN', 'ALUMNI'
    university_id: Optional[str] = None  # Required for non-superadmin
    graduation_year: Optional[int] = None
    major: Optional[str] = None
    is_mentor: bool = False

