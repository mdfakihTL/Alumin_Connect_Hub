from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    password: str
    university_id: Optional[str] = None
    graduation_year: Optional[int] = None
    major: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    graduation_year: Optional[int] = None
    major: Optional[str] = None
    is_mentor: Optional[bool] = None


class UserProfileUpdate(BaseModel):
    bio: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None
    banner: Optional[str] = None
    experience: Optional[str] = None  # JSON string
    education: Optional[str] = None   # JSON string


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    avatar: Optional[str] = None
    university_id: Optional[str] = None
    graduation_year: Optional[int] = None
    major: Optional[str] = None
    role: str
    is_mentor: bool = False
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileResponse(BaseModel):
    id: str
    user_id: str
    bio: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None
    banner: Optional[str] = None
    connections_count: int = 0
    posts_count: int = 0
    experience: Optional[str] = None
    education: Optional[str] = None

    class Config:
        from_attributes = True


# University branding schema for login response
class UniversityBrandingColors(BaseModel):
    primary: str
    secondary: str
    accent: str


class UniversityBrandingTheme(BaseModel):
    light: UniversityBrandingColors
    dark: UniversityBrandingColors


class UniversityBrandingResponse(BaseModel):
    id: str
    name: str
    logo: Optional[str] = None
    colors: Optional[UniversityBrandingTheme] = None
    is_enabled: bool = True

    class Config:
        from_attributes = True


class UserWithProfileResponse(UserResponse):
    profile: Optional[UserProfileResponse] = None
    university_name: Optional[str] = None
    university: Optional[UniversityBrandingResponse] = None


# Enhanced Token response with branding
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    university: Optional[UniversityBrandingResponse] = None
    # For super admin - list of all universities to choose from
    universities: Optional[List[UniversityBrandingResponse]] = None
    # If true, user must change password before accessing the app
    force_password_reset: bool = False


class TokenData(BaseModel):
    user_id: Optional[str] = None


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetResponse(BaseModel):
    message: str
    success: bool
