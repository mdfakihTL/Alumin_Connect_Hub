from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


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
    email: EmailStr
    password: str
    name: str
    university_id: str


class AdminUserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = None
    university_id: str
    university_name: str
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class AdminUserListResponse(BaseModel):
    admins: List[AdminUserResponse]
    total: int
    page: int
    page_size: int


class AdminPasswordResetRequest(BaseModel):
    id: str
    admin_name: str
    admin_email: str
    university_name: str
    requested_at: Optional[datetime] = None


class AdminPasswordResetListResponse(BaseModel):
    requests: List[AdminPasswordResetRequest]
    total: int
    page: int
    page_size: int


class GlobalAdCreate(BaseModel):
    image: str
    title: str
    description: Optional[str] = None
    link: Optional[str] = None
    type: Optional[str] = "general"


class GlobalAdUpdate(BaseModel):
    image: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    link: Optional[str] = None
    is_active: Optional[bool] = None


class GlobalAdResponse(BaseModel):
    id: str
    image: str
    title: str
    description: Optional[str] = None
    link: Optional[str] = None
    is_active: bool = True
    type: str = "general"

