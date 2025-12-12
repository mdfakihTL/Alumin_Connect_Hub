from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User, UserProfile, UserRole
from app.models.university import University
from app.schemas.user import (
    UserUpdate, UserProfileUpdate, UserResponse,
    UserProfileResponse, UserWithProfileResponse,
    UniversityBrandingResponse, UniversityBrandingColors, UniversityBrandingTheme
)
import json

router = APIRouter()


@router.put("/me", response_model=UserWithProfileResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update current user information.
    """
    if user_data.name is not None:
        current_user.name = user_data.name
    if user_data.avatar is not None:
        current_user.avatar = user_data.avatar
    if user_data.graduation_year is not None:
        current_user.graduation_year = user_data.graduation_year
    if user_data.major is not None:
        current_user.major = user_data.major
    if user_data.is_mentor is not None:
        current_user.is_mentor = user_data.is_mentor
    
    db.commit()
    db.refresh(current_user)
    
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    university_name = None
    university_branding = None
    if current_user.university_id:
        university = db.query(University).filter(University.id == current_user.university_id).first()
        if university:
            university_name = university.name
            # Build university branding
            colors = None
            if university.colors:
                try:
                    colors_data = json.loads(university.colors)
                    colors = UniversityBrandingTheme(
                        light=UniversityBrandingColors(**colors_data.get("light", {"primary": "#000000", "secondary": "#666666", "accent": "#0066cc"})),
                        dark=UniversityBrandingColors(**colors_data.get("dark", {"primary": "#ffffff", "secondary": "#cccccc", "accent": "#66b3ff"}))
                    )
                except (json.JSONDecodeError, KeyError):
                    pass
            university_branding = UniversityBrandingResponse(
                id=university.id,
                name=university.name,
                logo=university.logo,
                colors=colors,
                is_enabled=university.is_enabled
            )
    
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


@router.put("/me/profile", response_model=UserProfileResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
    
    if profile_data.bio is not None:
        profile.bio = profile_data.bio
    if profile_data.phone is not None:
        profile.phone = profile_data.phone
    if profile_data.location is not None:
        profile.location = profile_data.location
    if profile_data.job_title is not None:
        profile.job_title = profile_data.job_title
    if profile_data.company is not None:
        profile.company = profile_data.company
    if profile_data.linkedin is not None:
        profile.linkedin = profile_data.linkedin
    if profile_data.website is not None:
        profile.website = profile_data.website
    if profile_data.banner is not None:
        profile.banner = profile_data.banner
    if profile_data.experience is not None:
        profile.experience = profile_data.experience
    if profile_data.education is not None:
        profile.education = profile_data.education
    
    db.commit()
    db.refresh(profile)
    
    return UserProfileResponse(
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


@router.get("/{user_id}", response_model=UserWithProfileResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get user by ID.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    
    university_name = None
    university_branding = None
    if user.university_id:
        university = db.query(University).filter(University.id == user.university_id).first()
        if university:
            university_name = university.name
            # Build university branding
            colors = None
            if university.colors:
                try:
                    colors_data = json.loads(university.colors)
                    colors = UniversityBrandingTheme(
                        light=UniversityBrandingColors(**colors_data.get("light", {"primary": "#000000", "secondary": "#666666", "accent": "#0066cc"})),
                        dark=UniversityBrandingColors(**colors_data.get("dark", {"primary": "#ffffff", "secondary": "#cccccc", "accent": "#66b3ff"}))
                    )
                except (json.JSONDecodeError, KeyError):
                    pass
            university_branding = UniversityBrandingResponse(
                id=university.id,
                name=university.name,
                logo=university.logo,
                colors=colors,
                is_enabled=university.is_enabled
            )
    
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
        created_at=user.created_at,
        profile=profile_response,
        university_name=university_name,
        university=university_branding
    )


@router.get("/", response_model=List[UserResponse])
async def search_users(
    search: Optional[str] = None,
    university_id: Optional[str] = None,
    is_mentor: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Search users.
    """
    query = db.query(User).filter(
        User.is_active == True,
        User.role == UserRole.ALUMNI
    )
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.name.ilike(search_term)) |
            (User.major.ilike(search_term))
        )
    
    if university_id:
        query = query.filter(User.university_id == university_id)
    
    if is_mentor is not None:
        query = query.filter(User.is_mentor == is_mentor)
    
    users = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return [
        UserResponse(
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
        )
        for user in users
    ]
