from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel

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


@router.get("/suggested-connections")
async def get_suggested_connections(
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get suggested connections for the current user.
    Prioritizes users from same university with:
    1. Same graduation year AND same major (highest priority)
    2. Same graduation year OR same major (medium priority)
    3. Same university (lower priority)
    """
    print(f"[SUGGESTED] Called for user: {current_user.name} ({current_user.id})")
    print(f"[SUGGESTED] User university: {current_user.university_id}, year: {current_user.graduation_year}, major: {current_user.major}")
    
    from app.models.connection import Connection, ConnectionRequest, ConnectionStatus
    from sqlalchemy import func, or_, and_, case
    
    # Get IDs of users already connected (from Connection table)
    connected_ids_1 = db.query(Connection.connected_user_id).filter(
        Connection.user_id == current_user.id
    ).all()
    connected_ids_2 = db.query(Connection.user_id).filter(
        Connection.connected_user_id == current_user.id
    ).all()
    
    # Get IDs of users with pending connection requests (from ConnectionRequest table)
    pending_ids_1 = db.query(ConnectionRequest.to_user_id).filter(
        ConnectionRequest.from_user_id == current_user.id,
        ConnectionRequest.status == ConnectionStatus.PENDING
    ).all()
    pending_ids_2 = db.query(ConnectionRequest.from_user_id).filter(
        ConnectionRequest.to_user_id == current_user.id,
        ConnectionRequest.status == ConnectionStatus.PENDING
    ).all()
    
    # Combine all connected/pending IDs
    connected_ids = set()
    for row in connected_ids_1 + connected_ids_2 + pending_ids_1 + pending_ids_2:
        connected_ids.add(row[0])
    connected_ids.add(current_user.id)  # Exclude self
    
    # Base query - same university, not already connected
    base_query = db.query(User).filter(
        User.is_active == True,
        User.role == UserRole.ALUMNI,
        ~User.id.in_(connected_ids)
    )
    
    suggested = []
    existing_ids = set()
    
    if current_user.university_id:
        # Filter to same university only
        uni_query = base_query.filter(User.university_id == current_user.university_id)
        
        # Priority 1: Same graduation year AND same major
        if current_user.graduation_year and current_user.major:
            same_year_and_major = uni_query.filter(
                User.graduation_year == current_user.graduation_year,
                User.major == current_user.major
            ).limit(limit).all()
            for u in same_year_and_major:
                if u.id not in existing_ids:
                    suggested.append(u)
                    existing_ids.add(u.id)
        
        # Priority 2: Same graduation year (different major)
        if len(suggested) < limit and current_user.graduation_year:
            same_year = uni_query.filter(
                User.graduation_year == current_user.graduation_year
            ).limit(limit * 2).all()  # Get more to filter
            for u in same_year:
                if u.id not in existing_ids and len(suggested) < limit:
                    suggested.append(u)
                    existing_ids.add(u.id)
        
        # Priority 3: Same major (different year)
        if len(suggested) < limit and current_user.major:
            same_major = uni_query.filter(
                User.major == current_user.major
            ).limit(limit * 2).all()
            for u in same_major:
                if u.id not in existing_ids and len(suggested) < limit:
                    suggested.append(u)
                    existing_ids.add(u.id)
        
        # Priority 4: Same university (any year/major)
        if len(suggested) < limit:
            same_uni = uni_query.limit(limit * 2).all()
            for u in same_uni:
                if u.id not in existing_ids and len(suggested) < limit:
                    suggested.append(u)
                    existing_ids.add(u.id)
    else:
        suggested = base_query.limit(limit).all()
    
    # Get profiles for additional info and build response
    result = []
    for user in suggested:
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        
        # Calculate match reason for UI
        match_reasons = []
        if current_user.graduation_year and user.graduation_year == current_user.graduation_year:
            match_reasons.append("Same batch")
        if current_user.major and user.major == current_user.major:
            match_reasons.append("Same course")
        
        # Count mutual connections (simplified)
        mutual = 0  # TODO: Implement proper mutual connections count
        
        result.append({
            "id": user.id,
            "name": user.name,
            "title": profile.job_title if profile else None,
            "company": profile.company if profile else None,
            "avatar": user.avatar,
            "university": user.university_id,
            "graduation_year": user.graduation_year,
            "major": user.major,
            "mutual_connections": mutual,
            "match_reasons": match_reasons
        })
    
    print(f"[SUGGESTED] Returning {len(result)} suggestions")
    return result


@router.get("/mentors")
async def get_mentors(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get list of mentors (users who are available for mentoring).
    """
    query = db.query(User).filter(
        User.is_active == True,
        User.is_mentor == True
    )
    
    # Filter by current user's university if available
    if current_user.university_id:
        query = query.filter(User.university_id == current_user.university_id)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.name.ilike(search_term)) |
            (User.email.ilike(search_term)) |
            (User.major.ilike(search_term))
        )
    
    total = query.count()
    mentors = query.offset((page - 1) * page_size).limit(page_size).all()
    
    result = []
    for user in mentors:
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        
        result.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "avatar": user.avatar,
            "title": profile.job_title if profile else None,
            "company": profile.company if profile else None,
            "major": user.major,
            "graduation_year": user.graduation_year,
            "location": profile.location if profile else None,
            "phone": profile.phone if profile else None,
            "bio": profile.bio if profile else None,
            "expertise": []  # TODO: Add expertise field to profile
        })
    
    return {
        "mentors": result,
        "total": total,
        "page": page,
        "page_size": page_size
    }


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
            is_mentor=user.is_mentor if user.is_mentor is not None else False,
            is_active=user.is_active if user.is_active is not None else True,
            created_at=user.created_at
        )
        for user in users
    ]


class MentorStatusUpdate(BaseModel):
    is_mentor: bool


@router.put("/{user_id}/mentor-status")
async def update_mentor_status(
    user_id: str,
    data: MentorStatusUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update a user's mentor status. Only admins can do this.
    """
    # Check if current user is admin or superadmin
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update mentor status"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Admins can only manage users in their university
    if current_user.role == UserRole.ADMIN and current_user.university_id:
        if user.university_id != current_user.university_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot modify users from other universities"
            )
    
    user.is_mentor = data.is_mentor
    db.commit()
    
    return {
        "message": f"Mentor status {'granted' if data.is_mentor else 'revoked'} for {user.name}",
        "user_id": user_id,
        "is_mentor": data.is_mentor
    }


# NOTE: This route MUST be last because it has a path parameter that would match other routes
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
