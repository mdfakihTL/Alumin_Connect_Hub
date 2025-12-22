"""
Public Ads API routes.
These endpoints allow users to fetch ads targeted to their university.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.ad import Ad
from pydantic import BaseModel

router = APIRouter()


class PublicAdResponse(BaseModel):
    """Ad response for public/alumni users (images only)."""
    id: str
    title: str
    description: Optional[str] = None
    image: Optional[str] = None
    link: Optional[str] = None
    media_url: Optional[str] = None  # For compatibility
    link_url: Optional[str] = None  # For compatibility
    placement: str = "feed"

    class Config:
        from_attributes = True


class AdsForUserResponse(BaseModel):
    """Response containing ads for different placements."""
    feed_ads: List[PublicAdResponse] = []
    left_sidebar_ads: List[PublicAdResponse] = []
    right_sidebar_ads: List[PublicAdResponse] = []


def parse_target_universities(ad) -> List[str]:
    """Parse target_universities from JSON string to list."""
    if not ad.target_universities:
        return ["all"]
    try:
        return json.loads(ad.target_universities)
    except (json.JSONDecodeError, TypeError):
        return ["all"]


def is_ad_targeted_to_user(ad: Ad, user: User) -> bool:
    """Check if an ad is targeted to the user's university."""
    targets = parse_target_universities(ad)
    
    # 'all' means it targets all universities
    if "all" in targets:
        return True
    
    # Check if user's university is in the target list
    if user.university_id and user.university_id in targets:
        return True
    
    return False


def ad_to_public_response(ad: Ad) -> PublicAdResponse:
    """Convert Ad model to public response (images only)."""
    image = ad.image or ad.media_url or ""
    link = ad.link or ad.link_url
    return PublicAdResponse(
        id=ad.id,
        title=ad.title,
        description=ad.description,
        image=image,
        link=link,
        media_url=image,  # For compatibility
        link_url=link,  # For compatibility
        placement=ad.placement or "feed"
    )


@router.get("/for-user", response_model=AdsForUserResponse)
async def get_ads_for_user(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all active ads targeted to the current user's university.
    Returns ads grouped by placement (feed, left-sidebar, right-sidebar).
    """
    # Get all active ads
    ads = db.query(Ad).filter(Ad.is_active == True).all()
    
    # Filter ads targeted to this user
    user_ads = [ad for ad in ads if is_ad_targeted_to_user(ad, current_user)]
    
    # Group by placement
    feed_ads = []
    left_sidebar_ads = []
    right_sidebar_ads = []
    
    for ad in user_ads:
        ad_response = ad_to_public_response(ad)
        placement = ad.placement or "feed"
        
        if placement == "feed":
            feed_ads.append(ad_response)
        elif placement == "left-sidebar":
            left_sidebar_ads.append(ad_response)
        elif placement == "right-sidebar":
            right_sidebar_ads.append(ad_response)
        else:
            # Default to feed
            feed_ads.append(ad_response)
    
    return AdsForUserResponse(
        feed_ads=feed_ads,
        left_sidebar_ads=left_sidebar_ads,
        right_sidebar_ads=right_sidebar_ads
    )


@router.get("/", response_model=List[PublicAdResponse])
async def get_ads(
    placement: Optional[str] = Query(None, description="Filter by placement: feed, left-sidebar, right-sidebar"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get active ads targeted to the current user's university.
    Optionally filter by placement.
    """
    query = db.query(Ad).filter(Ad.is_active == True)
    
    if placement:
        query = query.filter(Ad.placement == placement)
    
    ads = query.all()
    
    # Filter ads targeted to this user
    user_ads = [ad for ad in ads if is_ad_targeted_to_user(ad, current_user)]
    
    return [ad_to_public_response(ad) for ad in user_ads]


@router.post("/{ad_id}/impression")
async def record_impression(
    ad_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Record an ad impression (view).
    Called when an ad is displayed to a user.
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


@router.post("/{ad_id}/click")
async def record_click(
    ad_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Record an ad click.
    Called when a user clicks on an ad.
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

