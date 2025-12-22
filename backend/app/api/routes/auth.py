from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
import json

from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    get_current_active_user
)
from app.models.user import User, UserRole, UserProfile
from app.models.university import University
from app.schemas.user import (
    UserCreate, UserLogin, UserResponse, UserWithProfileResponse,
    UserProfileResponse, Token, PasswordResetRequest, PasswordResetResponse,
    UniversityBrandingResponse, UniversityBrandingTheme, UniversityBrandingColors
)


class ForcePasswordChangeRequest(BaseModel):
    """Request body for forced password change on first login"""
    new_password: str
    confirm_password: str


class ForcePasswordChangeResponse(BaseModel):
    """Response for forced password change"""
    success: bool
    message: str
    access_token: Optional[str] = None


router = APIRouter()


def get_university_branding(university: University) -> UniversityBrandingResponse:
    """Convert university model to branding response."""
    colors = None
    if university.colors:
        try:
            colors_data = json.loads(university.colors) if isinstance(university.colors, str) else university.colors
            colors = UniversityBrandingTheme(
                light=UniversityBrandingColors(**colors_data.get("light", {})),
                dark=UniversityBrandingColors(**colors_data.get("dark", {}))
            )
        except (json.JSONDecodeError, KeyError, TypeError):
            pass
    
    return UniversityBrandingResponse(
        id=university.id,
        name=university.name,
        logo=university.logo,
        colors=colors,
        is_enabled=university.is_enabled
    )


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user (alumni).
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Verify university exists if provided
    university = None
    if user_data.university_id:
        university = db.query(University).filter(University.id == user_data.university_id).first()
        if not university:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="University not found"
            )
        if not university.is_enabled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This university is currently not accepting registrations"
            )
    
    # Create user
    # Generate username from email for database compatibility
    username = user_data.email.split('@')[0] if user_data.email else None
    
    user = User(
        email=user_data.email,
        username=username,  # Set username for database compatibility
        hashed_password=get_password_hash(user_data.password),
        name=user_data.name,
        university_id=user_data.university_id,
        graduation_year=user_data.graduation_year,
        major=user_data.major,
        role=UserRole.ALUMNI
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create profile
    profile = UserProfile(user_id=user.id)
    db.add(profile)
    db.commit()
    
    # Generate token
    access_token = create_access_token(data={"sub": user.id})
    
    # Build response with university branding
    university_branding = None
    if university:
        university_branding = get_university_branding(university)
    
    return Token(
        access_token=access_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            avatar=user.avatar,
            university_id=user.university_id,
            graduation_year=user.graduation_year,
            major=user.major,
            role=user.role.value,
            is_mentor=user.is_mentor,
            is_active=user.is_active,
            created_at=user.created_at
        ),
        university=university_branding
    )


@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Login and get access token.
    
    Response includes:
    - For Alumni/Admin: their university branding
    - For Super Admin: list of all universities to manage/switch between
    - force_password_reset: true if user must change password on first login
    """
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )
    
    # Check if temporary password has expired
    if user.temp_password_expires_at and datetime.utcnow() > user.temp_password_expires_at:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your temporary password has expired. Please request a new password reset."
        )
    
    # Get university for non-superadmin users
    university = None
    university_branding = None
    universities_list = None
    
    if user.role == UserRole.SUPERADMIN:
        # Super Admin gets list of all universities
        all_universities = db.query(University).all()
        universities_list = [get_university_branding(uni) for uni in all_universities]
    else:
        # Alumni and Admin get their university branding
        if user.university_id:
            university = db.query(University).filter(University.id == user.university_id).first()
            
            if university and not university.is_enabled:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your university is currently disabled"
                )
            
            if university:
                university_branding = get_university_branding(university)
    
    # Generate token
    access_token = create_access_token(data={"sub": user.id})
    
    # Check if force password reset is required
    force_password_reset = user.force_password_reset or False
    
    return Token(
        access_token=access_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            avatar=user.avatar,
            university_id=user.university_id,
            graduation_year=user.graduation_year,
            major=user.major,
            role=user.role.value,
            is_mentor=user.is_mentor,
            is_active=user.is_active,
            created_at=user.created_at
        ),
        university=university_branding,
        universities=universities_list,  # Only populated for superadmin
        force_password_reset=force_password_reset
    )


@router.post("/force-password-change", response_model=ForcePasswordChangeResponse)
async def force_password_change(
    password_data: ForcePasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Change password for users who are required to change password on first login.
    This endpoint is used when force_password_reset is True.
    """
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.force_password_reset = False
    current_user.temp_password_expires_at = None
    current_user.last_password_change = datetime.utcnow()
    
    db.commit()
    
    # Generate new token
    access_token = create_access_token(data={"sub": current_user.id})
    
    return ForcePasswordChangeResponse(
        success=True,
        message="Password changed successfully",
        access_token=access_token
    )


@router.get("/me", response_model=UserWithProfileResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get current user information with profile and university branding.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    university_name = None
    university_branding = None
    
    if current_user.university_id:
        university = db.query(University).filter(University.id == current_user.university_id).first()
        if university:
            university_name = university.name
            university_branding = get_university_branding(university)
    
    profile_response = None
    if profile:
        profile_response = UserProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            bio=profile.bio,
            phone=profile.phone,
            location=profile.location,
            job_title=profile.job_title,
            company=profile.company,
            linkedin=profile.linkedin,
            website=profile.website,
            banner=profile.banner,
            connections_count=profile.connections_count,
            posts_count=profile.posts_count,
            experience=profile.experience,
            education=profile.education
        )
    
    return UserWithProfileResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        avatar=current_user.avatar,
        university_id=current_user.university_id,
        graduation_year=current_user.graduation_year,
        major=current_user.major,
        role=current_user.role.value,
        is_mentor=current_user.is_mentor,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        profile=profile_response,
        university_name=university_name,
        university=university_branding
    )


@router.get("/universities")
async def get_available_universities(
    db: Session = Depends(get_db)
):
    """
    Get list of available universities for registration.
    Only returns enabled universities.
    """
    universities = db.query(University).filter(University.is_enabled == True).all()
    
    return [
        {
            "id": uni.id,
            "name": uni.name,
            "logo": uni.logo
        }
        for uni in universities
    ]


@router.post("/request-password-reset", response_model=PasswordResetResponse)
async def request_password_reset(
    request_data: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Request a password reset.
    - Alumni requests go to their University Admin
    - Admin requests go to Super Admin
    """
    user = db.query(User).filter(User.email == request_data.email).first()
    
    if not user:
        # Don't reveal if email exists
        return PasswordResetResponse(
            message="If your email is registered, a password reset request has been sent.",
            success=True
        )
    
    # Mark password reset as requested
    user.password_reset_requested = True
    user.password_reset_requested_at = datetime.utcnow()
    db.commit()
    
    # Different messages based on role
    if user.role == UserRole.ADMIN:
        message = "Password reset request sent to the Super Administrator."
    elif user.role == UserRole.SUPERADMIN:
        message = "Please contact system support for password reset."
    else:
        university_name = "your university"
        if user.university_id:
            university = db.query(University).filter(University.id == user.university_id).first()
            if university:
                university_name = university.name
        message = f"Password reset request sent to {university_name} administrator."
    
    return PasswordResetResponse(
        message=message,
        success=True
    )


@router.post("/logout")
async def logout():
    """
    Logout (client should discard the token).
    """
    return {"message": "Successfully logged out", "success": True}


@router.post("/refresh-branding")
async def refresh_branding(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Refresh university branding for the current user.
    Useful when admin updates branding and users need to fetch new colors/logo.
    """
    if current_user.role == UserRole.SUPERADMIN:
        # Return all universities for superadmin
        all_universities = db.query(University).all()
        return {
            "universities": [get_university_branding(uni) for uni in all_universities]
        }
    
    if not current_user.university_id:
        return {"university": None}
    
    university = db.query(University).filter(University.id == current_user.university_id).first()
    
    if not university:
        return {"university": None}
    
    return {
        "university": get_university_branding(university)
    }
