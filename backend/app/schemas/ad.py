from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AdCreate(BaseModel):
    """Create advertisement schema."""
    title: str
    description: Optional[str] = None
    image: Optional[str] = None  # S3 URL for image
    link: Optional[str] = None
    placement: str = "feed"  # feed, left-sidebar, right-sidebar
    target_universities: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class AdUpdate(BaseModel):
    """Update advertisement schema."""
    title: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    link: Optional[str] = None
    placement: Optional[str] = None
    target_universities: Optional[List[str]] = None
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class AdResponse(BaseModel):
    """Advertisement response schema."""
    id: str
    title: str
    description: Optional[str] = None
    image: Optional[str] = None
    link: Optional[str] = None
    placement: str
    target_universities: Optional[List[str]] = None
    impressions: int = 0
    clicks: int = 0
    is_active: bool
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class AdListResponse(BaseModel):
    """List of advertisements response."""
    ads: List[AdResponse]
    total: int
    active_count: int


class AdImageUploadResponse(BaseModel):
    """Response for ad image upload."""
    url: str
    filename: str
