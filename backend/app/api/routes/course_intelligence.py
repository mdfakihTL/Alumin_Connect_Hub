"""
Course Intelligence API Endpoints
Course recommendations and sales intelligence for super admin
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
import csv
import io

from app.core.database import get_db
from app.api.routes.superadmin import require_superadmin
from app.models.user import User
from app.models.course import Course, CourseLevel, CourseCategory, LeadCourseInterest
from app.services.course_recommendation_service import (
    get_course_recommendations_for_user,
    get_course_analytics,
    get_ad_course_performance,
    get_leads_by_course_interest,
    run_full_seed_data_generation,
    update_lead_course_interests,
)

router = APIRouter()


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class CourseResponse(BaseModel):
    id: str
    name: str
    short_name: Optional[str] = None
    level: str
    category: str
    price: float
    duration_months: int
    format: str
    provider_name: Optional[str] = None
    is_featured: bool = False
    avg_rating: float = 0.0
    conversion_rate: float = 0.0


class CourseRecommendationResponse(BaseModel):
    course_id: str
    course_name: str
    course_level: str
    course_category: str
    provider: Optional[str] = None
    price: float
    duration_months: int
    format: str
    interest_score: float
    purchase_probability: float
    recommendation_reason: str
    ad_clicks: int
    ad_views: int
    is_featured: bool
    rank: int


class LevelMetricsResponse(BaseModel):
    course_count: int
    interested_leads: int
    conversions: int
    revenue: float
    conversion_rate: float


class TopCourseResponse(BaseModel):
    id: str
    name: str
    level: str
    category: str
    interested_leads: int
    price: float
    conversion_rate: float


class CourseAnalyticsResponse(BaseModel):
    by_level: dict
    top_courses: List[TopCourseResponse]
    total_courses: int


class AdCoursePerformanceResponse(BaseModel):
    ad_id: str
    ad_title: str
    course_id: str
    course_name: str
    course_level: str
    impressions: int
    clicks: int
    ctr: float
    conversions: int
    conversion_rate: float


class LeadCourseInterestResponse(BaseModel):
    user_id: str
    user_name: str
    user_email: str
    graduation_year: Optional[int] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    
    course_id: str
    course_name: str
    course_level: str
    
    interest_score: float
    purchase_probability: float
    recommendation_reason: Optional[str] = None
    ad_clicks: int
    ad_views: int
    
    lead_category: str
    overall_lead_score: float
    
    has_contacted: bool
    has_enrolled: bool


# =============================================================================
# COURSE MANAGEMENT ENDPOINTS
# =============================================================================

@router.get("/courses", response_model=List[CourseResponse])
async def get_courses(
    level: Optional[str] = Query(None, description="Filter by level (ug, pg, certificate, executive)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    is_featured: Optional[bool] = Query(None, description="Filter featured courses"),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get all courses with optional filters.
    """
    query = db.query(Course).filter(Course.is_active == True)
    
    if level:
        query = query.filter(Course.level == level)
    if category:
        query = query.filter(Course.category == category)
    if is_featured is not None:
        query = query.filter(Course.is_featured == is_featured)
    
    courses = query.order_by(Course.is_featured.desc(), Course.name).all()
    
    return [CourseResponse(
        id=c.id,
        name=c.name,
        short_name=c.short_name,
        level=c.level,
        category=c.category,
        price=c.price,
        duration_months=c.duration_months,
        format=c.format,
        provider_name=c.provider_name,
        is_featured=c.is_featured,
        avg_rating=c.avg_rating,
        conversion_rate=c.conversion_rate,
    ) for c in courses]


@router.get("/courses/levels")
async def get_course_levels(
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get available course levels with counts.
    """
    levels = db.query(
        Course.level,
        func.count(Course.id).label('count')
    ).filter(Course.is_active == True).group_by(Course.level).all()
    
    return {
        level: {
            'name': level.replace('_', ' ').title(),
            'count': count,
            'description': {
                'ug': 'Undergraduate programs for early career professionals',
                'pg': 'Postgraduate programs for experienced professionals',
                'certificate': 'Short-term certification programs',
                'executive': 'Executive programs for senior leaders',
                'diploma': 'Diploma programs',
            }.get(level, '')
        }
        for level, count in levels
    }


@router.get("/courses/categories")
async def get_course_categories(
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get available course categories with counts.
    """
    from sqlalchemy import func
    
    categories = db.query(
        Course.category,
        func.count(Course.id).label('count')
    ).filter(Course.is_active == True).group_by(Course.category).all()
    
    return {
        cat: {
            'name': cat.replace('_', ' ').title(),
            'count': count,
        }
        for cat, count in categories
    }


# =============================================================================
# COURSE ANALYTICS ENDPOINTS
# =============================================================================

@router.get("/analytics", response_model=CourseAnalyticsResponse)
async def get_analytics(
    level: Optional[str] = Query(None, description="Filter by level"),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive course analytics by level.
    """
    data = get_course_analytics(db, level_filter=level)
    
    return CourseAnalyticsResponse(
        by_level=data['by_level'],
        top_courses=[TopCourseResponse(**c) for c in data['top_courses']],
        total_courses=data['total_courses']
    )


@router.get("/analytics/ad-performance", response_model=List[AdCoursePerformanceResponse])
async def get_ad_performance(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get ad performance metrics linked to courses.
    Shows which ads are driving interest in which courses.
    """
    data = get_ad_course_performance(db)
    return [AdCoursePerformanceResponse(**item) for item in data[:limit]]


@router.get("/analytics/ug-vs-pg")
async def get_ug_vs_pg_comparison(
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get detailed UG vs PG comparison for sales targeting.
    """
    ug_courses = db.query(Course).filter(Course.level == CourseLevel.UG.value, Course.is_active == True).all()
    pg_courses = db.query(Course).filter(Course.level == CourseLevel.PG.value, Course.is_active == True).all()
    exec_courses = db.query(Course).filter(Course.level == CourseLevel.EXECUTIVE.value, Course.is_active == True).all()
    cert_courses = db.query(Course).filter(Course.level == CourseLevel.CERTIFICATE.value, Course.is_active == True).all()
    
    def get_level_stats(courses):
        if not courses:
            return {'count': 0, 'interested_leads': 0, 'avg_price': 0, 'total_revenue_potential': 0}
        
        course_ids = [c.id for c in courses]
        interests = db.query(LeadCourseInterest).filter(
            LeadCourseInterest.course_id.in_(course_ids),
            LeadCourseInterest.interest_score >= 50
        ).all()
        
        high_prob_leads = [i for i in interests if i.purchase_probability >= 0.3]
        
        return {
            'count': len(courses),
            'interested_leads': len(set(i.user_id for i in interests)),
            'high_intent_leads': len(set(i.user_id for i in high_prob_leads)),
            'avg_price': sum(c.price for c in courses) / len(courses),
            'total_revenue_potential': sum(c.price for c in courses) * len(high_prob_leads),
            'top_course': max(courses, key=lambda c: c.conversion_rate).name if courses else None,
        }
    
    return {
        'ug': {
            'label': 'Undergraduate',
            'description': 'For early career (0-3 years experience)',
            **get_level_stats(ug_courses)
        },
        'pg': {
            'label': 'Postgraduate',
            'description': 'For mid-career (3-10 years experience)',
            **get_level_stats(pg_courses)
        },
        'executive': {
            'label': 'Executive',
            'description': 'For senior leaders (10+ years experience)',
            **get_level_stats(exec_courses)
        },
        'certificate': {
            'label': 'Certificate',
            'description': 'Short-term skill programs',
            **get_level_stats(cert_courses)
        },
    }


# =============================================================================
# LEAD RECOMMENDATIONS ENDPOINTS
# =============================================================================

@router.get("/leads", response_model=List[LeadCourseInterestResponse])
async def get_leads_interested_in_courses(
    course_id: Optional[str] = Query(None, description="Filter by specific course"),
    level: Optional[str] = Query(None, description="Filter by course level"),
    min_score: float = Query(40, ge=0, le=100, description="Minimum interest score"),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get leads filtered by course interest.
    Useful for identifying who to target for specific courses.
    """
    data = get_leads_by_course_interest(db, course_id, level, min_score, limit)
    return [LeadCourseInterestResponse(**item) for item in data]


@router.get("/leads/{user_id}/recommendations", response_model=List[CourseRecommendationResponse])
async def get_user_course_recommendations(
    user_id: str,
    level: Optional[str] = Query(None, description="Filter by course level"),
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get personalized course recommendations for a specific lead.
    Based on their ad interactions, career goals, and profile.
    """
    recommendations = get_course_recommendations_for_user(db, user_id, limit, level)
    return [CourseRecommendationResponse(**rec) for rec in recommendations]


@router.post("/leads/{user_id}/refresh-recommendations")
async def refresh_user_recommendations(
    user_id: str,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Refresh course recommendations for a specific user.
    """
    update_lead_course_interests(db, user_id)
    return {"message": f"Recommendations refreshed for user {user_id}"}


@router.post("/leads/{user_id}/mark-contacted")
async def mark_lead_contacted(
    user_id: str,
    course_id: str,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Mark a lead as contacted for a specific course.
    """
    interest = db.query(LeadCourseInterest).filter(
        LeadCourseInterest.user_id == user_id,
        LeadCourseInterest.course_id == course_id
    ).first()
    
    if not interest:
        raise HTTPException(status_code=404, detail="Lead course interest not found")
    
    interest.has_contacted = True
    db.commit()
    
    return {"message": "Lead marked as contacted"}


@router.post("/leads/{user_id}/mark-enrolled")
async def mark_lead_enrolled(
    user_id: str,
    course_id: str,
    revenue: float = Query(0, ge=0),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Mark a lead as enrolled (converted) for a specific course.
    """
    from app.models.course import CourseConversion
    from app.models.lead_intelligence import LeadScore
    
    interest = db.query(LeadCourseInterest).filter(
        LeadCourseInterest.user_id == user_id,
        LeadCourseInterest.course_id == course_id
    ).first()
    
    if not interest:
        raise HTTPException(status_code=404, detail="Lead course interest not found")
    
    interest.has_enrolled = True
    
    # Get lead score for conversion tracking
    lead_score = db.query(LeadScore).filter(LeadScore.user_id == user_id).first()
    
    # Create conversion record
    conversion = CourseConversion(
        user_id=user_id,
        course_id=course_id,
        conversion_type='enrollment',
        revenue=revenue,
        lead_score_at_conversion=lead_score.overall_score if lead_score else 0
    )
    db.add(conversion)
    
    # Update course conversion rate
    course = db.query(Course).filter(Course.id == course_id).first()
    if course:
        course.total_enrollments += 1
    
    db.commit()
    
    return {"message": "Lead marked as enrolled", "conversion_id": conversion.id}


# =============================================================================
# EXPORT ENDPOINTS
# =============================================================================

@router.get("/export/leads")
async def export_course_leads_csv(
    level: Optional[str] = Query(None, description="Filter by course level"),
    min_score: float = Query(40, ge=0, le=100),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Export course-interested leads as CSV for sales outreach.
    """
    leads = get_leads_by_course_interest(db, None, level, min_score, 1000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        'Name', 'Email', 'Graduation Year', 'Job Title', 'Company',
        'Recommended Course', 'Course Level', 'Interest Score', 
        'Purchase Probability', 'Recommendation Reason',
        'Ad Clicks', 'Ad Views', 'Lead Category', 'Overall Score',
        'Contacted', 'Enrolled'
    ])
    
    for lead in leads:
        writer.writerow([
            lead['user_name'],
            lead['user_email'],
            lead['graduation_year'] or '',
            lead['job_title'] or '',
            lead['company'] or '',
            lead['course_name'],
            lead['course_level'].upper(),
            lead['interest_score'],
            f"{lead['purchase_probability'] * 100:.1f}%",
            lead['recommendation_reason'] or '',
            lead['ad_clicks'],
            lead['ad_views'],
            lead['lead_category'].upper(),
            lead['overall_lead_score'],
            'Yes' if lead['has_contacted'] else 'No',
            'Yes' if lead['has_enrolled'] else 'No',
        ])
    
    output.seek(0)
    filename = f"course-leads-{level or 'all'}-{datetime.now().strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# =============================================================================
# SEED DATA ENDPOINT
# =============================================================================

@router.post("/seed-data")
async def generate_seed_data(
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Generate comprehensive seed data for testing.
    Creates courses, ads, and lead interactions.
    """
    result = run_full_seed_data_generation(db)
    return {
        "message": "Seed data generated successfully",
        **result
    }

