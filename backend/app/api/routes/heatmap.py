"""
Heat Map API Routes
Provides aggregate and drill-down endpoints for alumni discovery map
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User, UserRole
from app.services.heatmap_service import (
    get_aggregate_heatmap_data,
    get_drilldown_alumni_data,
    get_heatmap_stats,
    update_user_location
)

router = APIRouter()


# ============ Pydantic Schemas ============

class HeatmapCluster(BaseModel):
    """Aggregated cluster for heat map"""
    geohash: str
    count: int
    latitude: float
    longitude: float
    precision: int


class HeatmapAggregateResponse(BaseModel):
    """Response for aggregate heatmap data"""
    clusters: List[HeatmapCluster]
    total_clusters: int
    zoom_level: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AlumniMarker(BaseModel):
    """Individual alumni marker for drill-down"""
    id: str
    name: str
    avatar: Optional[str] = None
    graduation_year: Optional[int] = None
    major: Optional[str] = None
    university_id: Optional[str] = None
    university_name: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class DrilldownResponse(BaseModel):
    """Response for drill-down alumni data"""
    alumni: List[AlumniMarker]
    total: int
    page: int
    page_size: int
    has_more: bool


class HeatmapStatsResponse(BaseModel):
    """Statistics for the heatmap"""
    total_discoverable: int
    top_countries: List[dict]


class UpdateLocationRequest(BaseModel):
    """Request to update user location"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    city: Optional[str] = None
    country: Optional[str] = None
    country_code: Optional[str] = Field(None, max_length=3)


class LocationUpdateResponse(BaseModel):
    """Response after updating location"""
    success: bool
    message: str
    location: Optional[str] = None
    geohash: Optional[str] = None


# ============ API Endpoints ============

@router.get("/aggregate", response_model=HeatmapAggregateResponse)
async def get_heatmap_aggregate(
    zoom: int = Query(3, ge=1, le=18, description="Map zoom level"),
    north: Optional[float] = Query(None, ge=-90, le=90),
    south: Optional[float] = Query(None, ge=-90, le=90),
    east: Optional[float] = Query(None, ge=-180, le=180),
    west: Optional[float] = Query(None, ge=-180, le=180),
    university_id: Optional[str] = Query(None, description="Filter by university"),
    graduation_year: Optional[int] = Query(None, ge=1900, le=2100),
    country: Optional[str] = Query(None, max_length=3, description="ISO country code"),
    major: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get aggregated heatmap data based on zoom level.
    
    Available to both Alumni and Admin users.
    Returns clustered data with counts - no individual information.
    
    - **zoom**: Current map zoom level (1-18)
    - **north, south, east, west**: Optional viewport bounds
    - **university_id**: Filter by specific university
    - **graduation_year**: Filter by graduation year
    - **country**: Filter by country code (ISO)
    - **major**: Filter by major/program
    """
    # Build bounds dict if provided
    bounds = None
    if all(v is not None for v in [north, south, east, west]):
        bounds = {
            'north': north,
            'south': south,
            'east': east,
            'west': west
        }
    
    # For admin users, restrict to their university if not superadmin
    effective_university_id = university_id
    if current_user.role == UserRole.ADMIN and not university_id:
        effective_university_id = current_user.university_id
    
    clusters = get_aggregate_heatmap_data(
        db=db,
        zoom_level=zoom,
        bounds=bounds,
        university_id=effective_university_id,
        graduation_year=graduation_year,
        country=country,
        major=major
    )
    
    return HeatmapAggregateResponse(
        clusters=[HeatmapCluster(**c) for c in clusters],
        total_clusters=len(clusters),
        zoom_level=zoom
    )


@router.get("/drilldown", response_model=DrilldownResponse)
async def get_heatmap_drilldown(
    geohash: Optional[str] = Query(None, max_length=12, description="Geohash prefix for cluster"),
    north: Optional[float] = Query(None, ge=-90, le=90),
    south: Optional[float] = Query(None, ge=-90, le=90),
    east: Optional[float] = Query(None, ge=-180, le=180),
    west: Optional[float] = Query(None, ge=-180, le=180),
    university_id: Optional[str] = Query(None),
    graduation_year: Optional[int] = Query(None, ge=1900, le=2100),
    country: Optional[str] = Query(None, max_length=3),
    major: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get individual alumni data for drill-down view.
    
    **ALUMNI ONLY** - This endpoint is NOT available to Admin users.
    
    Admins can only see aggregate data. They cannot:
    - View individual alumni markers
    - See alumni names or profiles
    - Access connect functionality
    
    Returns paginated list of discoverable alumni with:
    - Basic profile info (name, avatar, graduation year)
    - University and program
    - City/country location
    - Coordinates (rounded for privacy unless user allows exact)
    """
    # Strict role check - Admins cannot access drill-down
    if current_user.role in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Drill-down view is only available to alumni users. Admins can only view aggregate data."
        )
    
    # Build bounds dict if provided
    bounds = None
    if all(v is not None for v in [north, south, east, west]):
        bounds = {
            'north': north,
            'south': south,
            'east': east,
            'west': west
        }
    
    try:
        result = get_drilldown_alumni_data(
            db=db,
            user=current_user,
            geohash_prefix=geohash,
            bounds=bounds,
            university_id=university_id,
            graduation_year=graduation_year,
            country=country,
            major=major,
            page=page,
            page_size=page_size
        )
        
        return DrilldownResponse(
            alumni=[AlumniMarker(**a) for a in result['alumni']],
            total=result['total'],
            page=result['page'],
            page_size=result['page_size'],
            has_more=result['has_more']
        )
        
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/stats", response_model=HeatmapStatsResponse)
async def get_heatmap_statistics(
    university_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get overall statistics for the heatmap.
    
    Returns:
    - Total number of discoverable alumni
    - Top countries by alumni count
    """
    # For admin users, restrict to their university
    effective_university_id = university_id
    if current_user.role == UserRole.ADMIN and not university_id:
        effective_university_id = current_user.university_id
    
    stats = get_heatmap_stats(db, university_id=effective_university_id)
    
    return HeatmapStatsResponse(**stats)


@router.post("/location", response_model=LocationUpdateResponse)
async def update_my_location(
    location_data: UpdateLocationRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's location for the heatmap.
    
    This endpoint should be called:
    - On first login with user consent
    - When user manually updates their location
    
    The coordinates are used to:
    - Place user on the alumni heatmap
    - Enable nearby alumni discovery
    - Compute geohash for efficient queries
    """
    try:
        profile = update_user_location(
            db=db,
            user_id=current_user.id,
            latitude=location_data.latitude,
            longitude=location_data.longitude,
            city=location_data.city,
            country=location_data.country,
            country_code=location_data.country_code
        )
        
        return LocationUpdateResponse(
            success=True,
            message="Location updated successfully",
            location=profile.location,
            geohash=profile.geohash
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put("/privacy", response_model=dict)
async def update_privacy_settings(
    is_discoverable: Optional[bool] = None,
    show_exact_location: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update heatmap privacy settings.
    
    - **is_discoverable**: Whether to show on the heatmap at all
    - **show_exact_location**: Whether to show exact coordinates or just city-level
    """
    from app.models.user import UserProfile
    
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    if is_discoverable is not None:
        profile.is_discoverable = is_discoverable
    
    if show_exact_location is not None:
        profile.show_exact_location = show_exact_location
    
    db.commit()
    
    return {
        "success": True,
        "message": "Privacy settings updated",
        "is_discoverable": profile.is_discoverable,
        "show_exact_location": profile.show_exact_location
    }


@router.get("/filters")
async def get_available_filters(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get available filter options for the heatmap.
    
    Returns:
    - Universities (for superadmin)
    - Graduation years
    - Countries
    - Majors
    """
    from app.models.university import University
    from sqlalchemy import distinct
    
    filters = {}
    
    # Universities (only for superadmin, or just current for admin)
    if current_user.role == UserRole.SUPERADMIN:
        universities = db.query(University.id, University.name).filter(
            University.is_enabled == True
        ).all()
        filters['universities'] = [{'id': u.id, 'name': u.name} for u in universities]
    elif current_user.role == UserRole.ADMIN:
        uni = db.query(University).filter(University.id == current_user.university_id).first()
        if uni:
            filters['universities'] = [{'id': uni.id, 'name': uni.name}]
    
    # Graduation years
    years_query = db.query(distinct(User.graduation_year)).filter(
        User.graduation_year.isnot(None),
        User.is_active == True,
        User.role == UserRole.ALUMNI
    )
    
    if current_user.role == UserRole.ADMIN:
        years_query = years_query.filter(User.university_id == current_user.university_id)
    
    years = years_query.order_by(User.graduation_year.desc()).all()
    filters['graduation_years'] = [y[0] for y in years if y[0]]
    
    # Countries
    from app.models.user import UserProfile
    
    countries_query = db.query(
        distinct(UserProfile.country_code),
        UserProfile.country
    ).join(
        User, UserProfile.user_id == User.id
    ).filter(
        UserProfile.country_code.isnot(None),
        UserProfile.is_discoverable == True,
        User.is_active == True
    )
    
    if current_user.role == UserRole.ADMIN:
        countries_query = countries_query.filter(User.university_id == current_user.university_id)
    
    countries = countries_query.all()
    filters['countries'] = [{'code': c[0], 'name': c[1]} for c in countries if c[0]]
    
    # Majors
    majors_query = db.query(distinct(User.major)).filter(
        User.major.isnot(None),
        User.is_active == True,
        User.role == UserRole.ALUMNI
    )
    
    if current_user.role == UserRole.ADMIN:
        majors_query = majors_query.filter(User.university_id == current_user.university_id)
    
    majors = majors_query.all()
    filters['majors'] = [m[0] for m in majors if m[0]]
    
    return filters

