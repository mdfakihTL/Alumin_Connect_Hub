from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date


class AdminDashboardStats(BaseModel):
    total_alumni: int
    active_mentors: int
    pending_documents: int
    upcoming_events: int
    password_resets: int
    active_groups: int
    active_fundraisers: int
    open_tickets: int


class AlumniUserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    graduation_year: Optional[int] = None
    major: Optional[str] = None


class AlumniUserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = None
    university_id: Optional[str] = None
    graduation_year: Optional[int] = None
    major: Optional[str] = None
    role: str = "alumni"
    is_mentor: bool = False
    is_active: bool = True
    job_title: Optional[str] = None
    company: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AlumniUserListResponse(BaseModel):
    users: List[AlumniUserResponse]
    total: int
    page: int
    page_size: int


class BulkImportResponse(BaseModel):
    success_count: int
    failed_count: int
    errors: List[str]


class PasswordResetRequest(BaseModel):
    id: str
    user_name: str
    user_email: str
    requested_at: Optional[datetime] = None


class PasswordResetListResponse(BaseModel):
    requests: List[PasswordResetRequest]
    total: int
    page: int
    page_size: int


class AdminDocumentRequestResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    document_type: str
    reason: Optional[str] = None
    status: str
    requested_at: datetime
    estimated_completion: Optional[datetime] = None


class AdminDocumentListResponse(BaseModel):
    requests: List[AdminDocumentRequestResponse]
    total: int
    page: int
    page_size: int


class TicketResponseItem(BaseModel):
    id: str
    message: str
    responder_name: str
    is_admin: bool
    created_at: datetime


class AdminTicketResponse(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    subject: str
    category: str
    priority: str
    status: str
    description: str
    response_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None


class AdminTicketDetailResponse(BaseModel):
    """Ticket with full conversation history for admin view"""
    id: str
    user_id: str
    user_name: str
    user_email: str
    subject: str
    category: str
    priority: str
    status: str
    description: str
    responses: List[TicketResponseItem]
    created_at: datetime
    updated_at: Optional[datetime] = None


class AdminTicketListResponse(BaseModel):
    tickets: List[AdminTicketResponse]
    total: int
    page: int
    page_size: int


class FundraiserCreate(BaseModel):
    """Schema for creating a new fundraiser."""
    title: str
    description: str
    image: Optional[str] = None
    donation_link: str  # Required - external URL
    start_date: date
    end_date: date
    status: Optional[str] = "draft"  # draft, active, expired

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Annual Alumni Fund 2025",
                "description": "Help us build a better future for our students",
                "image": "https://example.com/image.jpg",
                "donation_link": "https://donate.university.edu/campaign",
                "start_date": "2025-01-01",
                "end_date": "2025-12-31",
                "status": "active"
            }
        }


class FundraiserUpdate(BaseModel):
    """Schema for updating a fundraiser."""
    title: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    donation_link: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None  # draft, active, expired


class FundraiserResponse(BaseModel):
    """Schema for fundraiser response."""
    id: str
    title: str
    description: Optional[str] = None
    image: Optional[str] = None
    donation_link: str
    start_date: str
    end_date: str
    status: str = "draft"
    effective_status: str = "draft"  # Computed based on dates
    total_clicks: int = 0
    unique_clicks: int = 0
    created_at: Optional[datetime] = None
    
    # Legacy fields for backward compatibility
    goal_amount: int = 0
    current_amount: int = 0
    is_active: bool = True


class FundraiserListResponse(BaseModel):
    """Schema for paginated fundraiser list."""
    fundraisers: List[FundraiserResponse]
    total: int
    page: int
    page_size: int


class FundraiserClickCreate(BaseModel):
    """Schema for recording a click."""
    fundraiser_id: str
    session_id: Optional[str] = None


class FundraiserClickResponse(BaseModel):
    """Schema for click response."""
    id: str
    fundraiser_id: str
    user_id: Optional[str] = None
    clicked_at: datetime
    redirect_url: str


class FundraiserAnalyticsResponse(BaseModel):
    """Schema for fundraiser analytics."""
    fundraiser_id: str
    title: str
    total_clicks: int
    unique_alumni_clicks: int
    clicks_by_date: List[dict]  # [{date: "2025-01-01", clicks: 10}, ...]
    status: str


class FundraiserAnalyticsSummary(BaseModel):
    """Schema for overall analytics summary."""
    total_fundraisers: int
    active_fundraisers: int
    total_clicks: int
    unique_alumni: int
    top_fundraisers: List[FundraiserAnalyticsResponse]


class AdCreate(BaseModel):
    image: str
    title: str
    description: Optional[str] = None
    link: Optional[str] = None
    type: Optional[str] = "general"


class AdUpdate(BaseModel):
    image: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    link: Optional[str] = None
    is_active: Optional[bool] = None


class AdResponse(BaseModel):
    id: str
    image: str
    title: str
    description: Optional[str] = None
    link: Optional[str] = None
    is_active: bool = True
    type: str = "general"


class PasswordResetBody(BaseModel):
    """Request body for password reset."""
    new_password: str

