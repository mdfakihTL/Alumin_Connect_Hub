"""
Fundraiser Management API Routes

Provides endpoints for:
- Admin: Create, update, delete, list fundraisers with analytics
- Alumni: View active fundraisers, track donation link clicks
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from typing import List, Optional
from datetime import datetime, date, timedelta
import logging
import re
import uuid

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User, UserRole
from app.models.fundraiser import Fundraiser, FundraiserClick
from app.schemas.admin import (
    FundraiserCreate, FundraiserUpdate, FundraiserResponse,
    FundraiserListResponse, FundraiserClickCreate, FundraiserClickResponse,
    FundraiserAnalyticsResponse, FundraiserAnalyticsSummary
)
from app.services.s3_service import s3_service

router = APIRouter()
logger = logging.getLogger(__name__)


def require_admin(current_user: User = Depends(get_current_active_user)):
    """Dependency to require admin role."""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def validate_url(url: str) -> bool:
    """Validate that the URL is properly formatted."""
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain
        r'localhost|'  # localhost
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # IP
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    return url_pattern.match(url) is not None


def get_fundraiser_stats(db: Session, fundraiser_id: str) -> tuple:
    """Get total and unique click counts for a fundraiser."""
    total_clicks = db.query(FundraiserClick).filter(
        FundraiserClick.fundraiser_id == fundraiser_id
    ).count()
    
    unique_clicks = db.query(distinct(FundraiserClick.user_id)).filter(
        FundraiserClick.fundraiser_id == fundraiser_id,
        FundraiserClick.user_id.isnot(None)
    ).count()
    
    return total_clicks, unique_clicks


def fundraiser_to_response(db: Session, fundraiser: Fundraiser) -> FundraiserResponse:
    """Convert a Fundraiser model to FundraiserResponse."""
    total_clicks, unique_clicks = get_fundraiser_stats(db, fundraiser.id)
    
    return FundraiserResponse(
        id=fundraiser.id,
        title=fundraiser.title,
        description=fundraiser.description,
        image=fundraiser.image,
        donation_link=fundraiser.donation_link,
        start_date=fundraiser.start_date.isoformat() if fundraiser.start_date else "",
        end_date=fundraiser.end_date.isoformat() if fundraiser.end_date else "",
        status=fundraiser.status or "draft",
        effective_status=fundraiser.get_effective_status(),
        total_clicks=total_clicks,
        unique_clicks=unique_clicks,
        created_at=fundraiser.created_at,
        # Legacy compatibility
        goal_amount=fundraiser.goal_amount or 0,
        current_amount=fundraiser.current_amount or 0,
        is_active=fundraiser.status == "active"
    )


# ============ ADMIN ENDPOINTS ============

@router.get("/admin", response_model=FundraiserListResponse)
async def list_admin_fundraisers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List all fundraisers for admin with analytics.
    """
    try:
        query = db.query(Fundraiser).filter(
            Fundraiser.university_id == current_user.university_id
        )
        
        if status_filter and status_filter in ["draft", "active", "expired"]:
            query = query.filter(Fundraiser.status == status_filter)
        
        total = query.count()
        fundraisers = query.order_by(Fundraiser.created_at.desc()).offset(
            (page - 1) * page_size
        ).limit(page_size).all()
        
        return FundraiserListResponse(
            fundraisers=[fundraiser_to_response(db, f) for f in fundraisers],
            total=total,
            page=page,
            page_size=page_size
        )
    except Exception as e:
        logger.error(f"Error listing fundraisers: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list fundraisers: {str(e)}"
        )


@router.post("/admin", response_model=FundraiserResponse, status_code=status.HTTP_201_CREATED)
async def create_fundraiser(
    data: FundraiserCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new fundraiser campaign.
    """
    try:
        # Validate donation link
        if not validate_url(data.donation_link):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid donation link URL"
            )
        
        # Validate dates
        if data.end_date <= data.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after start date"
            )
        
        # Determine status
        fundraiser_status = "draft"
        if data.status and data.status in ["draft", "active", "expired"]:
            fundraiser_status = data.status
        
        fundraiser = Fundraiser(
            university_id=current_user.university_id,
            title=data.title,
            description=data.description,
            image=data.image,
            donation_link=data.donation_link,
            start_date=data.start_date,
            end_date=data.end_date,
            status=fundraiser_status,
            is_active=fundraiser_status == "active"
        )
        
        db.add(fundraiser)
        db.commit()
        db.refresh(fundraiser)
        
        logger.info(f"Fundraiser created: {fundraiser.id} by {current_user.email}")
        
        return fundraiser_to_response(db, fundraiser)
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating fundraiser: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create fundraiser: {str(e)}"
        )


@router.put("/admin/{fundraiser_id}", response_model=FundraiserResponse)
async def update_fundraiser(
    fundraiser_id: str,
    data: FundraiserUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update an existing fundraiser.
    """
    try:
        fundraiser = db.query(Fundraiser).filter(
            Fundraiser.id == fundraiser_id,
            Fundraiser.university_id == current_user.university_id
        ).first()
        
        if not fundraiser:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fundraiser not found"
            )
        
        # Validate donation link if provided
        if data.donation_link and not validate_url(data.donation_link):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid donation link URL"
            )
        
        # Validate dates if both are provided
        new_start = data.start_date or fundraiser.start_date
        new_end = data.end_date or fundraiser.end_date
        if new_end <= new_start:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after start date"
            )
        
        # Update fields
        if data.title is not None:
            fundraiser.title = data.title
        if data.description is not None:
            fundraiser.description = data.description
        if data.image is not None:
            fundraiser.image = data.image
        if data.donation_link is not None:
            fundraiser.donation_link = data.donation_link
        if data.start_date is not None:
            fundraiser.start_date = data.start_date
        if data.end_date is not None:
            fundraiser.end_date = data.end_date
        if data.status is not None and data.status in ["draft", "active", "expired"]:
            fundraiser.status = data.status
            fundraiser.is_active = fundraiser.status == "active"
        
        db.commit()
        db.refresh(fundraiser)
        
        logger.info(f"Fundraiser updated: {fundraiser.id} by {current_user.email}")
        
        return fundraiser_to_response(db, fundraiser)
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating fundraiser: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update fundraiser: {str(e)}"
        )


@router.delete("/admin/{fundraiser_id}")
async def delete_fundraiser(
    fundraiser_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a fundraiser.
    """
    try:
        fundraiser = db.query(Fundraiser).filter(
            Fundraiser.id == fundraiser_id,
            Fundraiser.university_id == current_user.university_id
        ).first()
        
        if not fundraiser:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fundraiser not found"
            )
        
        db.delete(fundraiser)
        db.commit()
        
        logger.info(f"Fundraiser deleted: {fundraiser_id} by {current_user.email}")
        
        return {"message": "Fundraiser deleted successfully", "success": True}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting fundraiser: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete fundraiser: {str(e)}"
        )


@router.get("/admin/analytics", response_model=FundraiserAnalyticsSummary)
async def get_fundraiser_analytics(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get overall fundraiser analytics for admin dashboard.
    """
    try:
        # Total fundraisers
        total_fundraisers = db.query(Fundraiser).filter(
            Fundraiser.university_id == current_user.university_id
        ).count()
        
        # Active fundraisers
        today = date.today()
        active_fundraisers = db.query(Fundraiser).filter(
            Fundraiser.university_id == current_user.university_id,
            Fundraiser.status == "active",
            Fundraiser.start_date <= today,
            Fundraiser.end_date >= today
        ).count()
        
        # Get all fundraiser IDs for this university
        fundraiser_ids = [f.id for f in db.query(Fundraiser.id).filter(
            Fundraiser.university_id == current_user.university_id
        ).all()]
        
        # Total clicks across all fundraisers
        total_clicks = db.query(FundraiserClick).filter(
            FundraiserClick.fundraiser_id.in_(fundraiser_ids)
        ).count() if fundraiser_ids else 0
        
        # Unique alumni who clicked
        unique_alumni = db.query(distinct(FundraiserClick.user_id)).filter(
            FundraiserClick.fundraiser_id.in_(fundraiser_ids),
            FundraiserClick.user_id.isnot(None)
        ).count() if fundraiser_ids else 0
        
        # Top fundraisers by clicks
        top_fundraisers = []
        fundraisers = db.query(Fundraiser).filter(
            Fundraiser.university_id == current_user.university_id
        ).order_by(Fundraiser.created_at.desc()).limit(5).all()
        
        for f in fundraisers:
            total, unique = get_fundraiser_stats(db, f.id)
            
            # Get clicks by date for last 30 days
            clicks_by_date = []
            for i in range(30):
                day = date.today() - timedelta(days=i)
                count = db.query(FundraiserClick).filter(
                    FundraiserClick.fundraiser_id == f.id,
                    func.date(FundraiserClick.clicked_at) == day
                ).count()
                if count > 0:
                    clicks_by_date.append({"date": day.isoformat(), "clicks": count})
            
            clicks_by_date.reverse()
            
            top_fundraisers.append(FundraiserAnalyticsResponse(
                fundraiser_id=f.id,
                title=f.title,
                total_clicks=total,
                unique_alumni_clicks=unique,
                clicks_by_date=clicks_by_date,
                status=f.get_effective_status()
            ))
        
        return FundraiserAnalyticsSummary(
            total_fundraisers=total_fundraisers,
            active_fundraisers=active_fundraisers,
            total_clicks=total_clicks,
            unique_alumni=unique_alumni,
            top_fundraisers=top_fundraisers
        )
    
    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analytics: {str(e)}"
        )


@router.get("/admin/{fundraiser_id}/analytics", response_model=FundraiserAnalyticsResponse)
async def get_single_fundraiser_analytics(
    fundraiser_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get detailed analytics for a specific fundraiser.
    """
    try:
        fundraiser = db.query(Fundraiser).filter(
            Fundraiser.id == fundraiser_id,
            Fundraiser.university_id == current_user.university_id
        ).first()
        
        if not fundraiser:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fundraiser not found"
            )
        
        total, unique = get_fundraiser_stats(db, fundraiser_id)
        
        # Get clicks by date for last 30 days
        clicks_by_date = []
        for i in range(30):
            day = date.today() - timedelta(days=i)
            count = db.query(FundraiserClick).filter(
                FundraiserClick.fundraiser_id == fundraiser_id,
                func.date(FundraiserClick.clicked_at) == day
            ).count()
            clicks_by_date.append({"date": day.isoformat(), "clicks": count})
        
        clicks_by_date.reverse()
        
        return FundraiserAnalyticsResponse(
            fundraiser_id=fundraiser_id,
            title=fundraiser.title,
            total_clicks=total,
            unique_alumni_clicks=unique,
            clicks_by_date=clicks_by_date,
            status=fundraiser.get_effective_status()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting fundraiser analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analytics: {str(e)}"
        )


# ============ IMAGE UPLOAD ============

@router.post("/admin/upload-image")
async def upload_fundraiser_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin)
):
    """
    Upload an image for a fundraiser campaign.
    Returns the S3 URL of the uploaded image.
    Accepts: jpg, jpeg, png, gif, webp (max 10MB)
    """
    # Validate file type
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Validate file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10MB limit"
        )
    
    # Reset file position for upload
    await file.seek(0)
    
    # Check if S3 is configured
    if not s3_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="S3 storage is not configured. Please contact administrator."
        )
    
    try:
        # Upload to S3
        url = await s3_service.upload_image(file, folder="fundraisers")
        
        if not url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload image. Please try again."
            )
        
        logger.info(f"Fundraiser image uploaded by {current_user.email}: {url}")
        
        return {
            "url": url,
            "filename": file.filename,
            "content_type": file.content_type,
            "message": "Image uploaded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading fundraiser image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )


# ============ ALUMNI ENDPOINTS ============

@router.get("/active", response_model=List[FundraiserResponse])
async def list_active_fundraisers(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List active fundraisers for alumni to view.
    Only returns fundraisers that are:
    - Status = ACTIVE
    - Within date range (start_date <= today <= end_date)
    """
    try:
        today = date.today()
        
        fundraisers = db.query(Fundraiser).filter(
            Fundraiser.university_id == current_user.university_id,
            Fundraiser.status == "active",
            Fundraiser.start_date <= today,
            Fundraiser.end_date >= today
        ).order_by(Fundraiser.created_at.desc()).all()
        
        return [fundraiser_to_response(db, f) for f in fundraisers]
    
    except Exception as e:
        logger.error(f"Error listing active fundraisers: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list fundraisers: {str(e)}"
        )


@router.post("/click", response_model=FundraiserClickResponse)
async def track_click(
    data: FundraiserClickCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Track a click on a fundraiser donation link.
    Implements debounce: only allows one click per user per fundraiser per 5 minutes.
    """
    try:
        # Verify fundraiser exists and is active
        fundraiser = db.query(Fundraiser).filter(
            Fundraiser.id == data.fundraiser_id
        ).first()
        
        if not fundraiser:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fundraiser not found"
            )
        
        if not fundraiser.is_currently_active():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fundraiser is not currently active"
            )
        
        # Debounce: Check for recent click from same user (within 5 minutes)
        five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
        recent_click = db.query(FundraiserClick).filter(
            FundraiserClick.fundraiser_id == data.fundraiser_id,
            FundraiserClick.user_id == current_user.id,
            FundraiserClick.clicked_at >= five_minutes_ago
        ).first()
        
        if recent_click:
            # Return existing click without creating new one
            return FundraiserClickResponse(
                id=recent_click.id,
                fundraiser_id=recent_click.fundraiser_id,
                user_id=recent_click.user_id,
                clicked_at=recent_click.clicked_at,
                redirect_url=fundraiser.donation_link
            )
        
        # Get client info
        client_ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent", "")[:500]  # Limit length
        
        # Create new click record
        click = FundraiserClick(
            fundraiser_id=data.fundraiser_id,
            user_id=current_user.id,
            ip_address=client_ip,
            user_agent=user_agent,
            session_id=data.session_id
        )
        
        db.add(click)
        db.commit()
        db.refresh(click)
        
        logger.info(f"Fundraiser click tracked: {fundraiser.id} by user {current_user.id}")
        
        return FundraiserClickResponse(
            id=click.id,
            fundraiser_id=click.fundraiser_id,
            user_id=click.user_id,
            clicked_at=click.clicked_at,
            redirect_url=fundraiser.donation_link
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error tracking click: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to track click: {str(e)}"
        )


@router.get("/{fundraiser_id}", response_model=FundraiserResponse)
async def get_fundraiser(
    fundraiser_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a single fundraiser by ID.
    """
    try:
        fundraiser = db.query(Fundraiser).filter(
            Fundraiser.id == fundraiser_id,
            Fundraiser.university_id == current_user.university_id
        ).first()
        
        if not fundraiser:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fundraiser not found"
            )
        
        return fundraiser_to_response(db, fundraiser)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting fundraiser: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get fundraiser: {str(e)}"
        )

