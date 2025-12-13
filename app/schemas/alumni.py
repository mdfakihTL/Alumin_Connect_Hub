"""
Alumni profile schemas
"""
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

if TYPE_CHECKING:
    from app.schemas.user import UserResponse


class AlumniProfileBase(BaseModel):
    """Base alumni profile schema"""
    graduation_year: Optional[int] = None
    degree: Optional[str] = None
    major: Optional[str] = None
    current_position: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    website_url: Optional[str] = None
    profile_picture_url: Optional[str] = None
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None


class AlumniProfileCreate(AlumniProfileBase):
    """Schema for creating alumni profile"""
    user_id: int


class AlumniProfileUpdate(BaseModel):
    """Schema for updating alumni profile"""
    graduation_year: Optional[int] = None
    degree: Optional[str] = None
    major: Optional[str] = None
    current_position: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    website_url: Optional[str] = None
    profile_picture_url: Optional[str] = None
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None


class AlumniProfileResponse(AlumniProfileBase):
    """Alumni profile response schema"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Import at the end to avoid circular imports
from app.schemas.user import UserResponse

class AlumniProfileWithUser(AlumniProfileResponse):
    """Alumni profile with user information"""
    user: "UserResponse"


