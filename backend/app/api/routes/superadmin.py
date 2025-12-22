from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import logging

from app.core.database import get_db
from app.core.security import get_current_active_user, get_password_hash
from app.models.user import User, UserRole, UserProfile
from app.models.university import University
from app.models.ad import Ad
from app.models.notification import Notification, NotificationType
from app.models.post import Post
from app.models.event import Event
from app.models.group import Group
from app.models.admin_management import (
    AdminPasswordResetRequest as AdminPasswordResetRequestModel,
    AdminAuditLog, PasswordResetStatus, AuditAction
)
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)
from app.schemas.superadmin import (
    SuperAdminDashboardStats, UniversityCreate, UniversityUpdate, UniversityResponse,
    AdminUserCreate, AdminUserResponse, AdminUserListResponse,
    GlobalAdCreate, GlobalAdUpdate, GlobalAdResponse, AdListResponse,
    AdminPasswordResetRequest, AdminPasswordResetListResponse,
    AdminPasswordResetRequestFull, AdminPasswordResetListResponseFull,
    RejectPasswordResetRequest, AuditLogResponse, AuditLogListResponse,
    GlobalUserResponse, GlobalUserListResponse, GlobalUserCreate
)
from app.schemas.admin import PasswordResetBody
from app.services.admin_management_service import (
    create_admin_user, request_password_reset, approve_password_reset,
    reject_password_reset, toggle_admin_status, get_password_reset_stats,
    create_audit_log
)
import json
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


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
    
    # Total ads
    total_ads = db.query(Ad).count()
    
    # Active ads
    active_ads = db.query(Ad).filter(
        Ad.is_active == True
    ).count()
    
    # Total posts
    total_posts = db.query(Post).count()
    
    # Total events
    total_events = db.query(Event).count()
    
    # Total groups
    total_groups = db.query(Group).count()
    
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
        
        posts_count = db.query(Post).filter(
            Post.university_id == uni.id
        ).count()
        
        university_stats.append({
            "id": uni.id,
            "name": uni.name,
            "logo": uni.logo,
            "alumni_count": alumni_count,
            "admin_count": admin_count,
            "posts_count": posts_count,
            "is_enabled": uni.is_enabled
        })
    
    return SuperAdminDashboardStats(
        total_universities=total_universities,
        enabled_universities=enabled_universities,
        total_admins=total_admins,
        total_alumni=total_alumni,
        total_posts=total_posts,
        total_events=total_events,
        total_groups=total_groups,
        total_ads=total_ads,
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
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    List all admin users with filtering options.
    """
    query = db.query(User).filter(User.role == UserRole.ADMIN)
    
    if university_id:
        query = query.filter(User.university_id == university_id)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.name.ilike(search_term)) |
            (User.email.ilike(search_term))
        )
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    total = query.count()
    admins = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
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
            force_password_reset=admin.force_password_reset or False,
            temp_password_expires_at=admin.temp_password_expires_at,
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
    request: Request,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Create a new admin user.
    - Auto-generates secure password if not provided
    - Sets force_password_reset=True for first login
    - Sends credentials email to admin
    - Creates audit log
    """
    try:
        # Get client IP
        ip_address = request.client.host if request.client else None
        
        admin, plain_password = create_admin_user(
            db=db,
            email=admin_data.email,
            name=admin_data.name,
            university_id=admin_data.university_id,
            created_by=current_user.id,
            password=admin_data.password,
            send_email=True,
            ip_address=ip_address
        )
        
        university = db.query(University).filter(University.id == admin.university_id).first()
        
        return AdminUserResponse(
            id=admin.id,
            name=admin.name,
            email=admin.email,
            avatar=admin.avatar,
            university_id=admin.university_id,
            university_name=university.name if university else "Unassigned",
            is_active=admin.is_active if admin.is_active is not None else True,
            force_password_reset=admin.force_password_reset or False,
            temp_password_expires_at=admin.temp_password_expires_at,
            created_at=admin.created_at,
            generated_password=plain_password  # Return the generated password
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
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


# Global User Management (All users across all universities)
@router.get("/users", response_model=GlobalUserListResponse)
async def list_all_users(
    search: Optional[str] = None,
    role: Optional[str] = None,  # 'SUPERADMIN', 'ADMIN', 'ALUMNI'
    university_id: Optional[str] = None,
    is_mentor: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    List all users across all universities with filters.
    """
    query = db.query(User)
    
    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.name.ilike(search_term)) |
            (User.email.ilike(search_term))
        )
    
    if role:
        try:
            # UserRole enum values are lowercase (superadmin, admin, alumni)
            role_enum = UserRole(role.lower())
            query = query.filter(User.role == role_enum)
        except ValueError:
            pass
    
    if university_id:
        query = query.filter(User.university_id == university_id)
    
    if is_mentor is not None:
        query = query.filter(User.is_mentor == is_mentor)
    
    # Get total count
    total = query.count()
    
    # Get role counts for stats
    superadmin_count = db.query(User).filter(User.role == UserRole.SUPERADMIN).count()
    admin_count = db.query(User).filter(User.role == UserRole.ADMIN).count()
    alumni_count = db.query(User).filter(User.role == UserRole.ALUMNI).count()
    mentor_count = db.query(User).filter(User.is_mentor == True).count()
    
    # Paginate
    users = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    # Build response
    user_responses = []
    for user in users:
        university = db.query(University).filter(University.id == user.university_id).first() if user.university_id else None
        user_responses.append(GlobalUserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            avatar=user.avatar,
            role=user.role.value,
            university_id=user.university_id,
            university_name=university.name if university else None,
            graduation_year=user.graduation_year,
            major=user.major,
            is_mentor=user.is_mentor or False,
            is_active=user.is_active if user.is_active is not None else True,
            created_at=user.created_at
        ))
    
    return GlobalUserListResponse(
        users=user_responses,
        total=total,
        page=page,
        page_size=page_size,
        role_counts={
            "superadmin": superadmin_count,
            "admin": admin_count,
            "alumni": alumni_count,
            "mentor": mentor_count
        }
    )


@router.post("/users", response_model=GlobalUserResponse, status_code=status.HTTP_201_CREATED)
async def create_global_user(
    user_data: GlobalUserCreate,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Create a new user with any role.
    """
    # Check if email exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate role
    try:
        role_enum = UserRole(user_data.role.upper())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: SUPERADMIN, ADMIN, ALUMNI"
        )
    
    # Verify university for non-superadmin
    university = None
    if role_enum != UserRole.SUPERADMIN:
        if not user_data.university_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="University ID required for non-superadmin users"
            )
        university = db.query(University).filter(University.id == user_data.university_id).first()
        if not university:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="University not found"
            )
    
    user = User(
        email=user_data.email,
        username=user_data.email.split('@')[0],
        hashed_password=get_password_hash(user_data.password),
        name=user_data.name,
        university_id=user_data.university_id,
        graduation_year=user_data.graduation_year,
        major=user_data.major,
        is_mentor=user_data.is_mentor,
        role=role_enum
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create profile
    profile = UserProfile(user_id=user.id)
    db.add(profile)
    db.commit()
    
    return GlobalUserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        avatar=user.avatar,
        role=user.role.value,
        university_id=user.university_id,
        university_name=university.name if university else None,
        graduation_year=user.graduation_year,
        major=user.major,
        is_mentor=user.is_mentor or False,
        is_active=user.is_active if user.is_active is not None else True,
        created_at=user.created_at
    )


@router.put("/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: str,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Toggle a user's active status.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Don't allow deactivating yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    user.is_active = not (user.is_active if user.is_active is not None else True)
    db.commit()
    
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "success": True, "is_active": user.is_active}


@router.delete("/users/{user_id}")
async def delete_global_user(
    user_id: str,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Delete a user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Don't allow deleting yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Delete user profile first
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if profile:
        db.delete(profile)
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted", "success": True}


# Admin Password Resets
@router.get("/password-resets", response_model=AdminPasswordResetListResponseFull)
async def list_admin_password_resets(
    status_filter: Optional[str] = None,  # pending, approved, rejected
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    List admin password reset requests with full status tracking.
    """
    query = db.query(AdminPasswordResetRequestModel)
    
    # Apply status filter
    if status_filter:
        try:
            status_enum = PasswordResetStatus(status_filter.lower())
            query = query.filter(AdminPasswordResetRequestModel.status == status_enum)
        except ValueError:
            pass
    
    total = query.count()
    
    # Get stats
    stats = get_password_reset_stats(db)
    
    # Get requests with pagination
    reset_requests = query.order_by(
        AdminPasswordResetRequestModel.requested_at.desc()
    ).offset((page - 1) * page_size).limit(page_size).all()
    
    requests = []
    for req in reset_requests:
        admin = db.query(User).filter(User.id == req.admin_id).first()
        university = db.query(University).filter(University.id == admin.university_id).first() if admin else None
        processor = db.query(User).filter(User.id == req.processed_by).first() if req.processed_by else None
        
        requests.append(AdminPasswordResetRequestFull(
            id=req.id,
            admin_id=req.admin_id,
            admin_name=admin.name if admin else "Unknown",
            admin_email=admin.email if admin else "Unknown",
            university_id=admin.university_id if admin else None,
            university_name=university.name if university else "Unknown",
            status=req.status.value,
            requested_at=req.requested_at,
            processed_at=req.processed_at,
            processed_by_name=processor.name if processor else None,
            rejection_reason=req.rejection_reason
        ))
    
    return AdminPasswordResetListResponseFull(
        requests=requests,
        total=total,
        pending_count=stats["pending"],
        approved_count=stats["approved"],
        rejected_count=stats["rejected"],
        page=page,
        page_size=page_size
    )


@router.get("/password-resets/legacy", response_model=AdminPasswordResetListResponse)
async def list_admin_password_resets_legacy(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Legacy: List pending admin password reset requests (uses User.password_reset_requested flag).
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


@router.post("/password-resets/{request_id}/approve")
async def approve_admin_password_reset(
    request_id: str,
    request: Request,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Approve a password reset request.
    - Generates new temporary password
    - Sends email to admin with new credentials
    - Creates audit log
    """
    try:
        ip_address = request.client.host if request.client else None
        
        reset_request, new_password = approve_password_reset(
            db=db,
            request_id=request_id,
            approved_by=current_user.id,
            send_email=True,
            ip_address=ip_address
        )
        
        return {
            "message": "Password reset approved. New credentials sent to admin.",
            "success": True,
            "request_id": reset_request.id,
            "new_password": new_password  # Return the generated password
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/password-resets/{request_id}/reject")
async def reject_admin_password_reset(
    request_id: str,
    rejection_data: RejectPasswordResetRequest,
    request: Request,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Reject a password reset request.
    - Sends notification to admin
    - Creates audit log
    """
    try:
        ip_address = request.client.host if request.client else None
        
        reset_request = reject_password_reset(
            db=db,
            request_id=request_id,
            rejected_by=current_user.id,
            reason=rejection_data.reason,
            send_email=True,
            ip_address=ip_address
        )
        
        return {
            "message": "Password reset request rejected.",
            "success": True,
            "request_id": reset_request.id
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/password-resets/{admin_id}/reset")
async def reset_admin_password(
    admin_id: str,
    password_data: PasswordResetBody,
    request: Request,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Legacy: Directly reset an admin's password (manual password set).
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
    
    ip_address = request.client.host if request.client else None
    
    # Get university for email context
    university = db.query(University).filter(University.id == admin.university_id).first()
    
    admin.hashed_password = get_password_hash(password_data.new_password)
    admin.password_reset_requested = False
    admin.password_reset_requested_at = None
    admin.force_password_reset = True  # Force change on next login
    db.commit()
    
    # Create audit log
    create_audit_log(
        db=db,
        action=AuditAction.PASSWORD_RESET_APPROVED,
        performed_by=current_user.id,
        target_user_id=admin_id,
        details={"method": "manual_reset"},
        ip_address=ip_address
    )
    
    # Send password reset email
    try:
        email_service = EmailService()
        if email_service.enabled:
            email_service.send_password_reset_email(
                to_email=admin.email,
                user_name=admin.name,
                new_password=password_data.new_password,
                reset_by="Super Administrator"
            )
            logger.info(f"Password reset email sent to admin {admin.email}")
    except Exception as e:
        logger.error(f"Failed to send password reset email to admin {admin.email}: {e}")
    
    # Create notification
    notification = Notification(
        user_id=admin_id,
        type=NotificationType.ANNOUNCEMENT,
        title="Password Reset",
        message="Your password has been reset by the Super Administrator. Check your email for the new password."
    )
    db.add(notification)
    db.commit()
    
    return {"message": "Admin password reset successfully", "success": True}


# Audit Logs
@router.get("/audit-logs", response_model=AuditLogListResponse)
async def list_audit_logs(
    action_filter: Optional[str] = None,
    target_user_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    List audit logs for admin actions.
    """
    query = db.query(AdminAuditLog)
    
    if action_filter:
        try:
            action_enum = AuditAction(action_filter)
            query = query.filter(AdminAuditLog.action == action_enum)
        except ValueError:
            pass
    
    if target_user_id:
        query = query.filter(AdminAuditLog.target_user_id == target_user_id)
    
    total = query.count()
    
    logs = query.order_by(
        AdminAuditLog.created_at.desc()
    ).offset((page - 1) * page_size).limit(page_size).all()
    
    log_responses = []
    for log in logs:
        performer = db.query(User).filter(User.id == log.performed_by).first()
        target = db.query(User).filter(User.id == log.target_user_id).first() if log.target_user_id else None
        
        log_responses.append(AuditLogResponse(
            id=log.id,
            action=log.action.value,
            performed_by_name=performer.name if performer else "Unknown",
            target_user_name=target.name if target else None,
            details=log.details,
            ip_address=log.ip_address,
            created_at=log.created_at
        ))
    
    return AuditLogListResponse(
        logs=log_responses,
        total=total,
        page=page,
        page_size=page_size
    )


@router.put("/admins/{admin_id}/toggle-status")
async def toggle_admin_status_endpoint(
    admin_id: str,
    request: Request,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Toggle an admin's active status.
    """
    try:
        ip_address = request.client.host if request.client else None
        
        admin = toggle_admin_status(
            db=db,
            admin_id=admin_id,
            toggled_by=current_user.id,
            ip_address=ip_address
        )
        
        return {
            "message": f"Admin {'activated' if admin.is_active else 'deactivated'}",
            "success": True,
            "is_active": admin.is_active
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


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
    image_url = ad.image or ad.media_url or ""
    link_url = ad.link or ad.link_url
    return GlobalAdResponse(
        id=ad.id,
        title=ad.title,
        description=ad.description,
        image=image_url,
        link=link_url,
        placement=ad.placement or "feed",
        target_universities=parse_target_universities(ad),
        is_active=ad.is_active,
        impressions=ad.impressions or 0,
        clicks=ad.clicks or 0,
        created_at=ad.created_at,
        type=ad.type or "general",
        # Legacy fields for compatibility
        media_url=image_url,
        link_url=link_url
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
    Create a new advertisement (image only).
    
    - `image`: URL to the image
    - `link`: Target URL when clicking "Learn More"
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
    
    # Get image from either field
    image_url = ad_data.image or ad_data.media_url
    link_url = ad_data.link or ad_data.link_url
    
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
        image=image_url,
        link=link_url,
        placement=ad_data.placement,
        target_universities=json.dumps(ad_data.target_universities),
        is_active=True,
        type=ad_data.type or "general",
        # Legacy fields for compatibility
        media_url=image_url,
        link_url=link_url,
        media_type="image"
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
    Update an existing advertisement (image only).
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
    
    # Handle image field (primary) or legacy media_url
    if ad_data.image is not None:
        ad.image = ad_data.image
        ad.media_url = ad_data.image  # Keep in sync
    elif ad_data.media_url is not None:
        ad.image = ad_data.media_url
        ad.media_url = ad_data.media_url
    
    # Handle link field (primary) or legacy link_url
    if ad_data.link is not None:
        ad.link = ad_data.link
        ad.link_url = ad_data.link  # Keep in sync
    elif ad_data.link_url is not None:
        ad.link = ad_data.link_url
        ad.link_url = ad_data.link_url
    
    if ad_data.placement is not None:
        ad.placement = ad_data.placement
    if ad_data.target_universities is not None:
        ad.target_universities = json.dumps(ad_data.target_universities)
    if ad_data.is_active is not None:
        ad.is_active = ad_data.is_active
    
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

