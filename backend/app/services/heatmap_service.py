"""
Heat Map Service
Provides geospatial aggregation and drill-down for alumni discovery
"""
import math
from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
import logging

from app.models.user import User, UserProfile, UserRole
from app.models.university import University

logger = logging.getLogger(__name__)

# Geohash precision levels
GEOHASH_PRECISION = {
    'world': 1,      # ~5000km
    'continent': 2,   # ~1250km
    'country': 3,     # ~156km
    'region': 4,      # ~39km
    'city': 5,        # ~4.9km
    'district': 6,    # ~1.2km
    'neighborhood': 7, # ~153m
    'street': 8,      # ~38m
}

# Base32 encoding for geohash
BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'


def encode_geohash(latitude: float, longitude: float, precision: int = 6) -> str:
    """
    Encode latitude/longitude to geohash string.
    """
    lat_range = (-90.0, 90.0)
    lon_range = (-180.0, 180.0)
    
    geohash = []
    bits = [16, 8, 4, 2, 1]
    bit = 0
    ch = 0
    is_lon = True
    
    while len(geohash) < precision:
        if is_lon:
            mid = (lon_range[0] + lon_range[1]) / 2
            if longitude >= mid:
                ch |= bits[bit]
                lon_range = (mid, lon_range[1])
            else:
                lon_range = (lon_range[0], mid)
        else:
            mid = (lat_range[0] + lat_range[1]) / 2
            if latitude >= mid:
                ch |= bits[bit]
                lat_range = (mid, lat_range[1])
            else:
                lat_range = (lat_range[0], mid)
        
        is_lon = not is_lon
        
        if bit < 4:
            bit += 1
        else:
            geohash.append(BASE32[ch])
            bit = 0
            ch = 0
    
    return ''.join(geohash)


def decode_geohash(geohash: str) -> Tuple[float, float, float, float]:
    """
    Decode geohash to bounding box (lat_min, lat_max, lon_min, lon_max).
    """
    lat_range = [-90.0, 90.0]
    lon_range = [-180.0, 180.0]
    is_lon = True
    
    for char in geohash:
        idx = BASE32.index(char)
        for bit in [16, 8, 4, 2, 1]:
            if is_lon:
                mid = (lon_range[0] + lon_range[1]) / 2
                if idx & bit:
                    lon_range[0] = mid
                else:
                    lon_range[1] = mid
            else:
                mid = (lat_range[0] + lat_range[1]) / 2
                if idx & bit:
                    lat_range[0] = mid
                else:
                    lat_range[1] = mid
            is_lon = not is_lon
    
    return (lat_range[0], lat_range[1], lon_range[0], lon_range[1])


def geohash_to_center(geohash: str) -> Tuple[float, float]:
    """
    Get center coordinates from geohash.
    """
    lat_min, lat_max, lon_min, lon_max = decode_geohash(geohash)
    return ((lat_min + lat_max) / 2, (lon_min + lon_max) / 2)


def get_geohash_precision_for_zoom(zoom_level: int) -> int:
    """
    Map zoom level to appropriate geohash precision.
    """
    if zoom_level <= 2:
        return 1
    elif zoom_level <= 4:
        return 2
    elif zoom_level <= 6:
        return 3
    elif zoom_level <= 8:
        return 4
    elif zoom_level <= 10:
        return 5
    elif zoom_level <= 12:
        return 6
    elif zoom_level <= 14:
        return 7
    else:
        return 8


def get_aggregate_heatmap_data(
    db: Session,
    zoom_level: int = 3,
    bounds: Optional[Dict] = None,
    university_id: Optional[str] = None,
    graduation_year: Optional[int] = None,
    country: Optional[str] = None,
    major: Optional[str] = None
) -> List[Dict]:
    """
    Get aggregated heatmap data based on zoom level.
    Returns clusters with count, center coordinates, and geohash.
    Used by both Admin and Alumni at default zoom levels.
    """
    precision = get_geohash_precision_for_zoom(zoom_level)
    
    # Build base query
    query = db.query(
        func.substr(UserProfile.geohash, 1, precision).label('geohash_prefix'),
        func.count(UserProfile.id).label('count'),
        func.avg(func.cast(UserProfile.latitude, db.bind.dialect.name == 'postgresql' and 'FLOAT' or 'REAL')).label('avg_lat'),
        func.avg(func.cast(UserProfile.longitude, db.bind.dialect.name == 'postgresql' and 'FLOAT' or 'REAL')).label('avg_lon'),
    ).join(
        User, UserProfile.user_id == User.id
    ).filter(
        UserProfile.geohash.isnot(None),
        UserProfile.is_discoverable == True,
        User.is_active == True,
        User.role == UserRole.ALUMNI
    )
    
    # Apply filters
    if university_id:
        query = query.filter(User.university_id == university_id)
    
    if graduation_year:
        query = query.filter(User.graduation_year == graduation_year)
    
    if country:
        query = query.filter(UserProfile.country_code == country)
    
    if major:
        query = query.filter(User.major.ilike(f'%{major}%'))
    
    # Apply bounds filter if provided
    if bounds:
        query = query.filter(
            and_(
                func.cast(UserProfile.latitude, db.bind.dialect.name == 'postgresql' and 'FLOAT' or 'REAL') >= bounds.get('south', -90),
                func.cast(UserProfile.latitude, db.bind.dialect.name == 'postgresql' and 'FLOAT' or 'REAL') <= bounds.get('north', 90),
                func.cast(UserProfile.longitude, db.bind.dialect.name == 'postgresql' and 'FLOAT' or 'REAL') >= bounds.get('west', -180),
                func.cast(UserProfile.longitude, db.bind.dialect.name == 'postgresql' and 'FLOAT' or 'REAL') <= bounds.get('east', 180),
            )
        )
    
    # Group by geohash prefix
    query = query.group_by(func.substr(UserProfile.geohash, 1, precision))
    
    results = query.all()
    
    clusters = []
    for row in results:
        if row.geohash_prefix and row.count > 0:
            # Use average coordinates if available, otherwise decode from geohash
            if row.avg_lat and row.avg_lon:
                lat, lon = float(row.avg_lat), float(row.avg_lon)
            else:
                lat, lon = geohash_to_center(row.geohash_prefix)
            
            clusters.append({
                'geohash': row.geohash_prefix,
                'count': row.count,
                'latitude': round(lat, 6),
                'longitude': round(lon, 6),
                'precision': precision,
            })
    
    return clusters


def get_drilldown_alumni_data(
    db: Session,
    user: User,
    geohash_prefix: Optional[str] = None,
    bounds: Optional[Dict] = None,
    university_id: Optional[str] = None,
    graduation_year: Optional[int] = None,
    country: Optional[str] = None,
    major: Optional[str] = None,
    page: int = 1,
    page_size: int = 50
) -> Dict:
    """
    Get individual alumni data for drill-down view.
    ONLY available to Alumni role (not Admins).
    Returns paginated list of discoverable alumni with public profile info.
    """
    # Ensure user is Alumni (not Admin)
    if user.role != UserRole.ALUMNI:
        raise PermissionError("Drill-down view is only available to alumni users")
    
    query = db.query(
        User.id,
        User.name,
        User.avatar,
        User.graduation_year,
        User.major,
        User.university_id,
        University.name.label('university_name'),
        UserProfile.job_title,
        UserProfile.company,
        UserProfile.city,
        UserProfile.country,
        UserProfile.latitude,
        UserProfile.longitude,
        UserProfile.show_exact_location,
    ).join(
        UserProfile, User.id == UserProfile.user_id
    ).outerjoin(
        University, User.university_id == University.id
    ).filter(
        UserProfile.geohash.isnot(None),
        UserProfile.is_discoverable == True,
        User.is_active == True,
        User.role == UserRole.ALUMNI,
        User.id != user.id  # Exclude current user
    )
    
    # Apply geohash filter (for cluster drill-down)
    if geohash_prefix:
        query = query.filter(UserProfile.geohash.like(f'{geohash_prefix}%'))
    
    # Apply bounds filter
    if bounds:
        query = query.filter(
            and_(
                func.cast(UserProfile.latitude, db.bind.dialect.name == 'postgresql' and 'FLOAT' or 'REAL') >= bounds.get('south', -90),
                func.cast(UserProfile.latitude, db.bind.dialect.name == 'postgresql' and 'FLOAT' or 'REAL') <= bounds.get('north', 90),
                func.cast(UserProfile.longitude, db.bind.dialect.name == 'postgresql' and 'FLOAT' or 'REAL') >= bounds.get('west', -180),
                func.cast(UserProfile.longitude, db.bind.dialect.name == 'postgresql' and 'FLOAT' or 'REAL') <= bounds.get('east', 180),
            )
        )
    
    # Apply filters
    if university_id:
        query = query.filter(User.university_id == university_id)
    
    if graduation_year:
        query = query.filter(User.graduation_year == graduation_year)
    
    if country:
        query = query.filter(UserProfile.country_code == country)
    
    if major:
        query = query.filter(User.major.ilike(f'%{major}%'))
    
    # Get total count
    total = query.count()
    
    # Paginate
    alumni_list = query.order_by(User.name).offset((page - 1) * page_size).limit(page_size).all()
    
    # Transform results
    alumni = []
    for row in alumni_list:
        # For privacy: only show exact location if user allows it
        lat = float(row.latitude) if row.latitude else None
        lon = float(row.longitude) if row.longitude else None
        
        # If user doesn't allow exact location, round to city level (~0.01 degree)
        if not row.show_exact_location and lat and lon:
            lat = round(lat, 2)
            lon = round(lon, 2)
        
        alumni.append({
            'id': row.id,
            'name': row.name,
            'avatar': row.avatar,
            'graduation_year': row.graduation_year,
            'major': row.major,
            'university_id': row.university_id,
            'university_name': row.university_name,
            'job_title': row.job_title,
            'company': row.company,
            'city': row.city,
            'country': row.country,
            'latitude': lat,
            'longitude': lon,
        })
    
    return {
        'alumni': alumni,
        'total': total,
        'page': page,
        'page_size': page_size,
        'has_more': total > page * page_size
    }


def get_heatmap_stats(
    db: Session,
    university_id: Optional[str] = None
) -> Dict:
    """
    Get overall statistics for the heatmap.
    """
    query = db.query(func.count(UserProfile.id)).join(
        User, UserProfile.user_id == User.id
    ).filter(
        UserProfile.geohash.isnot(None),
        UserProfile.is_discoverable == True,
        User.is_active == True,
        User.role == UserRole.ALUMNI
    )
    
    if university_id:
        query = query.filter(User.university_id == university_id)
    
    total_discoverable = query.scalar() or 0
    
    # Get country distribution
    country_query = db.query(
        UserProfile.country,
        UserProfile.country_code,
        func.count(UserProfile.id).label('count')
    ).join(
        User, UserProfile.user_id == User.id
    ).filter(
        UserProfile.geohash.isnot(None),
        UserProfile.is_discoverable == True,
        UserProfile.country.isnot(None),
        User.is_active == True,
        User.role == UserRole.ALUMNI
    )
    
    if university_id:
        country_query = country_query.filter(User.university_id == university_id)
    
    countries = country_query.group_by(
        UserProfile.country, UserProfile.country_code
    ).order_by(func.count(UserProfile.id).desc()).limit(20).all()
    
    return {
        'total_discoverable': total_discoverable,
        'top_countries': [
            {'country': c.country, 'code': c.country_code, 'count': c.count}
            for c in countries
        ]
    }


def update_user_location(
    db: Session,
    user_id: str,
    latitude: float,
    longitude: float,
    city: Optional[str] = None,
    country: Optional[str] = None,
    country_code: Optional[str] = None
) -> UserProfile:
    """
    Update user's location and compute geohash.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    
    if not profile:
        raise ValueError("User profile not found")
    
    # Compute geohash
    geohash = encode_geohash(latitude, longitude, precision=8)
    
    profile.latitude = str(latitude)
    profile.longitude = str(longitude)
    profile.geohash = geohash
    
    if city:
        profile.city = city
    if country:
        profile.country = country
    if country_code:
        profile.country_code = country_code
    
    # Update location text
    if city and country:
        profile.location = f"{city}, {country}"
    elif country:
        profile.location = country
    
    db.commit()
    db.refresh(profile)
    
    return profile

