from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_active_user, get_password_hash
from app.models.user import User, UserRole, UserProfile
from app.models.university import University
from app.models.ad import Ad
from app.models.notification import Notification, NotificationType
from app.schemas.superadmin import (
    SuperAdminDashboardStats, UniversityCreate, UniversityUpdate, UniversityResponse,
    AdminUserCreate, AdminUserResponse, AdminUserListResponse,
    GlobalAdCreate, GlobalAdUpdate, GlobalAdResponse, AdListResponse,
    AdminPasswordResetRequest, AdminPasswordResetListResponse
)
from app.schemas.admin import PasswordResetBody
import json

router = APIRouter()


def require_superadmin(current_user: User = Depends(get_current_active_user)):
    """Dependency to require superadmin role."""
    if current_user.role != UserRole.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required"
        )
    return current_user


@router.get("/dashboard", response_model=SuperAdminDashboardStats)
async def get_superadmin_dashboard(
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get superadmin dashboard statistics.
    """
    # Total universities
    total_universities = db.query(University).count()
    
    # Enabled universities
    enabled_universities = db.query(University).filter(
        University.is_enabled == True
    ).count()
    
    # Total admins
    total_admins = db.query(User).filter(
        User.role == UserRole.ADMIN
    ).count()
    
    # Total alumni
    total_alumni = db.query(User).filter(
        User.role == UserRole.ALUMNI
    ).count()
    
    # Active ads
    active_ads = db.query(Ad).filter(
        Ad.is_active == True
    ).count()
    
    # Pending admin password resets
    pending_resets = db.query(User).filter(
        User.role == UserRole.ADMIN,
        User.password_reset_requested == True
    ).count()
    
    # Get per-university stats
    university_stats = []
    universities = db.query(University).all()
    for uni in universities:
        alumni_count = db.query(User).filter(
            User.university_id == uni.id,
            User.role == UserRole.ALUMNI
        ).count()
        
        admin_count = db.query(User).filter(
            User.university_id == uni.id,
            User.role == UserRole.ADMIN
        ).count()
        
        university_stats.append({
            "id": uni.id,
            "name": uni.name,
            "logo": uni.logo,
            "alumni_count": alumni_count,
            "admin_count": admin_count,
            "is_enabled": uni.is_enabled
        })
    
    return SuperAdminDashboardStats(
        total_universities=total_universities,
        enabled_universities=enabled_universities,
        total_admins=total_admins,
        total_alumni=total_alumni,
        active_ads=active_ads,
        pending_admin_resets=pending_resets,
        universities=university_stats
    )


# University Management
@router.get("/universities", response_model=List[UniversityResponse])
async def list_universities(
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    List all universities.
    """
    universities = db.query(University).all()
    
    responses = []
    for uni in universities:
        alumni_count = db.query(User).filter(
            User.university_id == uni.id,
            User.role == UserRole.ALUMNI
        ).count()
        
        admin_count = db.query(User).filter(
            User.university_id == uni.id,
            User.role == UserRole.ADMIN
        ).count()
        
        responses.append(UniversityResponse(
            id=uni.id,
            name=uni.name,
            logo=uni.logo,
            colors=uni.colors,
            is_enabled=uni.is_enabled,
            alumni_count=alumni_count,
            admin_count=admin_count,
            email=uni.email,
            smtp_host=uni.smtp_host,
            smtp_port=uni.smtp_port,
            smtp_user=uni.smtp_user,
            created_at=uni.created_at
        ))
    
    return responses


@router.post("/universities", response_model=UniversityResponse, status_code=status.HTTP_201_CREATED)
async def create_university(
    university_data: UniversityCreate,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Create a new university.
    """
    existing = db.query(University).filter(
        (University.id == university_data.id) | (University.name == university_data.name)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University with this ID or name already exists"
        )
    
    university = University(
        id=university_data.id,
        name=university_data.name,
        logo=university_data.logo,
        colors=university_data.colors,
        email=university_data.email,
        smtp_host=university_data.smtp_host,
        smtp_port=university_data.smtp_port or 587,
        smtp_user=university_data.smtp_user,
        smtp_password=university_data.smtp_password
    )
    
    db.add(university)
    db.commit()
    db.refresh(university)
    
    return UniversityResponse(
        id=university.id,
        name=university.name,
        logo=university.logo,
        colors=university.colors,
        is_enabled=university.is_enabled,
        alumni_count=0,
        admin_count=0,
        email=university.email,
        smtp_host=university.smtp_host,
        smtp_port=university.smtp_port,
        smtp_user=university.smtp_user,
        created_at=university.created_at
    )


@router.put("/universities/{university_id}", response_model=UniversityResponse)
async def update_university(
    university_id: str,
    university_data: UniversityUpdate,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Update a university.
    """
    university = db.query(University).filter(University.id == university_id).first()
    
    if not university:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not found"
        )
    
    if university_data.name is not None:
        university.name = university_data.name
    if university_data.logo is not None:
        university.logo = university_data.logo
    if university_data.colors is not None:
        university.colors = university_data.colors
    if university_data.is_enabled is not None:
        university.is_enabled = university_data.is_enabled
    if university_data.email is not None:
        university.email = university_data.email
    if university_data.smtp_host is not None:
        university.smtp_host = university_data.smtp_host
    if university_data.smtp_port is not None:
        university.smtp_port = university_data.smtp_port
    if university_data.smtp_user is not None:
        university.smtp_user = university_data.smtp_user
    if university_data.smtp_password is not None:
        university.smtp_password = university_data.smtp_password
    
    db.commit()
    db.refresh(university)
    
    alumni_count = db.query(User).filter(
        User.university_id == university.id,
        User.role == UserRole.ALUMNI
    ).count()
    
    admin_count = db.query(User).filter(
        User.university_id == university.id,
        User.role == UserRole.ADMIN
    ).count()
    
    return UniversityResponse(
        id=university.id,
        name=university.name,
        logo=university.logo,
        colors=university.colors,
        is_enabled=university.is_enabled,
        alumni_count=alumni_count,
        admin_count=admin_count,
        created_at=university.created_at
    )


@router.delete("/universities/{university_id}")
async def delete_university(
    university_id: str,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Delete a university.
    """
    university = db.query(University).filter(University.id == university_id).first()
    
    if not university:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not found"
        )
    
    # Check if there are users
    user_count = db.query(User).filter(User.university_id == university_id).count()
    if user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete university with {user_count} users. Disable it instead."
        )
    
    db.delete(university)
    db.commit()
    
    return {"message": "University deleted", "success": True}


# Admin User Management
@router.get("/admins", response_model=AdminUserListResponse)
async def list_admins(
    university_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    List all admin users.
    """
    query = db.query(User).filter(User.role == UserRole.ADMIN)
    
    if university_id:
        query = query.filter(User.university_id == university_id)
    
    total = query.count()
    admins = query.offset((page - 1) * page_size).limit(page_size).all()
    
    admin_responses = []
    for admin in admins:
        university = db.query(University).filter(University.id == admin.university_id).first() if admin.university_id else None
        admin_responses.append(AdminUserResponse(
            id=admin.id,
            name=admin.name,
            email=admin.email,
            avatar=admin.avatar,
            university_id=admin.university_id,
            university_name=university.name if university else "Unassigned",
            is_active=admin.is_active if admin.is_active is not None else True,
            created_at=admin.created_at
        ))
    
    return AdminUserListResponse(
        admins=admin_responses,
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("/admins", response_model=AdminUserResponse, status_code=status.HTTP_201_CREATED)
async def create_admin(
    admin_data: AdminUserCreate,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Create a new admin user.
    """
    # Check if email exists
    existing = db.query(User).filter(User.email == admin_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Verify university exists
    university = db.query(University).filter(University.id == admin_data.university_id).first()
    if not university:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not found"
        )
    
    admin = User(
        email=admin_data.email,
        hashed_password=get_password_hash(admin_data.password),
        name=admin_data.name,
        university_id=admin_data.university_id,
        role=UserRole.ADMIN
    )
    
    db.add(admin)
    db.commit()
    db.refresh(admin)
    
    # Create profile
    profile = UserProfile(user_id=admin.id)
    db.add(profile)
    db.commit()
    
    return AdminUserResponse(
        id=admin.id,
        name=admin.name,
        email=admin.email,
        avatar=admin.avatar,
        university_id=admin.university_id,
        university_name=university.name,
        is_active=admin.is_active,
        created_at=admin.created_at
    )


@router.delete("/admins/{admin_id}")
async def deactivate_admin(
    admin_id: str,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Deactivate an admin user.
    """
    admin = db.query(User).filter(
        User.id == admin_id,
        User.role == UserRole.ADMIN
    ).first()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found"
        )
    
    admin.is_active = False
    db.commit()
    
    return {"message": "Admin deactivated", "success": True}


# Admin Password Resets
@router.get("/password-resets", response_model=AdminPasswordResetListResponse)
async def list_admin_password_resets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    List pending admin password reset requests.
    """
    query = db.query(User).filter(
        User.role == UserRole.ADMIN,
        User.password_reset_requested == True
    )
    
    total = query.count()
    admins = query.offset((page - 1) * page_size).limit(page_size).all()
    
    requests = []
    for admin in admins:
        university = db.query(University).filter(University.id == admin.university_id).first()
        requests.append(AdminPasswordResetRequest(
            id=admin.id,
            admin_name=admin.name,
            admin_email=admin.email,
            university_name=university.name if university else "Unknown",
            requested_at=admin.password_reset_requested_at
        ))
    
    return AdminPasswordResetListResponse(
        requests=requests,
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("/password-resets/{admin_id}/reset")
async def reset_admin_password(
    admin_id: str,
    password_data: PasswordResetBody,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Reset an admin's password.
    """
    admin = db.query(User).filter(
        User.id == admin_id,
        User.role == UserRole.ADMIN
    ).first()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin not found"
        )
    
    admin.hashed_password = get_password_hash(password_data.new_password)
    admin.password_reset_requested = False
    admin.password_reset_requested_at = None
    db.commit()
    
    # Create notification
    notification = Notification(
        user_id=admin_id,
        type=NotificationType.ANNOUNCEMENT,
        title="Password Reset",
        message="Your password has been reset by the Super Administrator."
    )
    db.add(notification)
    db.commit()
    
    return {"message": "Admin password reset successfully", "success": True}


# Global Ad Management
def parse_target_universities(ad) -> List[str]:
    """Parse target_universities from JSON string to list."""
    if not ad.target_universities:
        return ["all"]
    try:
        return json.loads(ad.target_universities)
    except (json.JSONDecodeError, TypeError):
        return ["all"]


def ad_to_response(ad: Ad) -> GlobalAdResponse:
    """Convert Ad model to GlobalAdResponse."""
    return GlobalAdResponse(
        id=ad.id,
        title=ad.title,
        description=ad.description,
        media_url=ad.media_url or ad.image or "",
        media_type=ad.media_type or "image",
        link_url=ad.link_url or ad.link,
        placement=ad.placement or "feed",
        target_universities=parse_target_universities(ad),
        is_active=ad.is_active,
        impressions=ad.impressions or 0,
        clicks=ad.clicks or 0,
        created_at=ad.created_at,
        # Legacy fields
        image=ad.image,
        link=ad.link,
        type=ad.type or "general"
    )


@router.get("/ads", response_model=AdListResponse)
async def list_ads(
    include_inactive: bool = False,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    List all advertisements.
    Superadmin can see all ads (both active and inactive).
    """
    query = db.query(Ad)
    
    if not include_inactive:
        query = query.filter(Ad.is_active == True)
    
    ads = query.order_by(Ad.created_at.desc()).all()
    
    active_count = db.query(Ad).filter(Ad.is_active == True).count()
    
    return AdListResponse(
        ads=[ad_to_response(ad) for ad in ads],
        total=len(ads),
        active_count=active_count
    )


@router.get("/ads/{ad_id}", response_model=GlobalAdResponse)
async def get_ad(
    ad_id: str,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get a single advertisement by ID.
    """
    ad = db.query(Ad).filter(Ad.id == ad_id).first()
    
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ad not found"
        )
    
    return ad_to_response(ad)


@router.post("/ads", response_model=GlobalAdResponse, status_code=status.HTTP_201_CREATED)
async def create_ad(
    ad_data: GlobalAdCreate,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Create a new advertisement.
    
    - `media_url`: URL to the image or video
    - `media_type`: 'image' or 'video'
    - `placement`: 'left-sidebar', 'right-sidebar', or 'feed'
    - `target_universities`: List of university IDs or ['all'] for all universities
    """
    # Validate placement
    valid_placements = ["left-sidebar", "right-sidebar", "feed"]
    if ad_data.placement not in valid_placements:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid placement. Must be one of: {', '.join(valid_placements)}"
        )
    
    # Validate media_type
    valid_media_types = ["image", "video"]
    if ad_data.media_type not in valid_media_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid media_type. Must be one of: {', '.join(valid_media_types)}"
        )
    
    # Validate target universities
    if ad_data.target_universities and "all" not in ad_data.target_universities:
        for uni_id in ad_data.target_universities:
            uni = db.query(University).filter(University.id == uni_id).first()
            if not uni:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"University not found: {uni_id}"
                )
    
    ad = Ad(
        title=ad_data.title,
        description=ad_data.description,
        media_url=ad_data.media_url,
        media_type=ad_data.media_type,
        link_url=ad_data.link_url,
        placement=ad_data.placement,
        target_universities=json.dumps(ad_data.target_universities),
        is_active=True,
        # Legacy fields
        image=ad_data.image or ad_data.media_url,
        link=ad_data.link or ad_data.link_url,
        type=ad_data.type or "general"
    )
    
    db.add(ad)
    db.commit()
    db.refresh(ad)
    
    return ad_to_response(ad)


@router.put("/ads/{ad_id}", response_model=GlobalAdResponse)
async def update_ad(
    ad_id: str,
    ad_data: GlobalAdUpdate,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Update an existing advertisement.
    """
    ad = db.query(Ad).filter(Ad.id == ad_id).first()
    
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ad not found"
        )
    
    # Validate placement if provided
    if ad_data.placement is not None:
        valid_placements = ["left-sidebar", "right-sidebar", "feed"]
        if ad_data.placement not in valid_placements:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid placement. Must be one of: {', '.join(valid_placements)}"
            )
    
    # Validate media_type if provided
    if ad_data.media_type is not None:
        valid_media_types = ["image", "video"]
        if ad_data.media_type not in valid_media_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid media_type. Must be one of: {', '.join(valid_media_types)}"
            )
    
    # Validate target universities if provided
    if ad_data.target_universities is not None and "all" not in ad_data.target_universities:
        for uni_id in ad_data.target_universities:
            uni = db.query(University).filter(University.id == uni_id).first()
            if not uni:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"University not found: {uni_id}"
                )
    
    # Update fields
    if ad_data.title is not None:
        ad.title = ad_data.title
    if ad_data.description is not None:
        ad.description = ad_data.description
    if ad_data.media_url is not None:
        ad.media_url = ad_data.media_url
        ad.image = ad_data.media_url  # Keep legacy field in sync
    if ad_data.media_type is not None:
        ad.media_type = ad_data.media_type
    if ad_data.link_url is not None:
        ad.link_url = ad_data.link_url
        ad.link = ad_data.link_url  # Keep legacy field in sync
    if ad_data.placement is not None:
        ad.placement = ad_data.placement
    if ad_data.target_universities is not None:
        ad.target_universities = json.dumps(ad_data.target_universities)
    if ad_data.is_active is not None:
        ad.is_active = ad_data.is_active
    
    # Legacy field updates
    if ad_data.image is not None:
        ad.image = ad_data.image
        if ad.media_url is None:
            ad.media_url = ad_data.image
    if ad_data.link is not None:
        ad.link = ad_data.link
        if ad.link_url is None:
            ad.link_url = ad_data.link
    
    db.commit()
    db.refresh(ad)
    
    return ad_to_response(ad)


@router.patch("/ads/{ad_id}/toggle", response_model=GlobalAdResponse)
async def toggle_ad_status(
    ad_id: str,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Toggle an advertisement's active status.
    """
    ad = db.query(Ad).filter(Ad.id == ad_id).first()
    
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ad not found"
        )
    
    ad.is_active = not ad.is_active
    db.commit()
    db.refresh(ad)
    
    return ad_to_response(ad)


@router.delete("/ads/{ad_id}")
async def delete_ad(
    ad_id: str,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Delete an advertisement permanently.
    """
    ad = db.query(Ad).filter(Ad.id == ad_id).first()
    
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ad not found"
        )
    
    db.delete(ad)
    db.commit()
    
    return {"message": "Ad deleted successfully", "success": True}


@router.post("/ads/{ad_id}/impression")
async def record_ad_impression(
    ad_id: str,
    db: Session = Depends(get_db)
):
    """
    Record an ad impression (view). Called when ad is displayed to user.
    This endpoint doesn't require authentication to allow tracking.
    """
    ad = db.query(Ad).filter(Ad.id == ad_id).first()
    
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ad not found"
        )
    
    ad.impressions = (ad.impressions or 0) + 1
    db.commit()
    
    return {"success": True}


@router.post("/ads/{ad_id}/click")
async def record_ad_click(
    ad_id: str,
    db: Session = Depends(get_db)
):
    """
    Record an ad click. Called when user clicks on ad.
    This endpoint doesn't require authentication to allow tracking.
    """
    ad = db.query(Ad).filter(Ad.id == ad_id).first()
    
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ad not found"
        )
    
    ad.clicks = (ad.clicks or 0) + 1
    db.commit()
    
    return {"success": True}

