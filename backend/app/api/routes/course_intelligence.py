"""
Course Intelligence API Endpoints
For super admin to view course leads and predictions
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
from app.models.course_intelligence import (
    Course, CourseAd, CourseLead, CourseRecommendation,
    CourseType, LeadTemperature
)
from app.services.course_intelligence_service import (
    generate_seed_data,
    get_course_leads_analytics,
    get_course_recommendations_for_user,
    get_leads_by_course_type,
    calculate_course_lead_score,
)

router = APIRouter()


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class CourseResponse(BaseModel):
    id: str
    name: str
    short_name: Optional[str] = None
    course_type: str
    category: str
    price: float
    duration_months: int
    format: str
    min_experience_years: int
    max_experience_years: int
    tags: List[str] = []


class CourseLeadResponse(BaseModel):
    lead_id: str
    user_id: str
    user_name: str
    user_email: str
    education_level: Optional[str] = None
    years_experience: Optional[int] = None
    course_id: str
    course_name: str
    course_type: str
    overall_score: float
    interest_score: float
    fit_score: float
    intent_score: float
    lead_temperature: str
    purchase_probability: float
    ad_clicks: int
    recommendation_reasons: List[str] = []
    last_interaction_at: Optional[str] = None


class CourseTypeStats(BaseModel):
    total: int = 0
    hot: int = 0
    warm: int = 0
    cold: int = 0


class TopCourseItem(BaseModel):
    course_id: str
    course_name: str
    course_type: str
    total_leads: int
    hot_leads: int
    avg_score: float


class CourseAnalyticsResponse(BaseModel):
    total_leads: int
    hot_leads: int
    warm_leads: int
    cold_leads: int
    by_course_type: dict
    top_courses: List[TopCourseItem]
    avg_purchase_probability: float


class LeadsListResponse(BaseModel):
    leads: List[CourseLeadResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class CourseRecommendationResponse(BaseModel):
    course_id: str
    course_name: str
    course_type: str
    category: str
    price: float
    duration_months: int
    format: str
    rank: int
    confidence_score: float
    reasons: List[str]


class SeedDataResponse(BaseModel):
    message: str
    counts: dict


# =============================================================================
# ANALYTICS ENDPOINTS
# =============================================================================

@router.get("/analytics", response_model=CourseAnalyticsResponse)
async def get_course_analytics(
    university_id: Optional[str] = Query(None, description="Filter by university"),
    course_type: Optional[str] = Query(None, description="Filter by course type (ug, pg, executive, etc.)"),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get course leads analytics overview.
    Shows lead distribution by course type (UG vs PG) and temperature.
    """
    data = get_course_leads_analytics(db, university_id, course_type)
    
    return CourseAnalyticsResponse(
        total_leads=data["total_leads"],
        hot_leads=data["hot_leads"],
        warm_leads=data["warm_leads"],
        cold_leads=data["cold_leads"],
        by_course_type=data["by_course_type"],
        top_courses=[TopCourseItem(**c) for c in data["top_courses"]],
        avg_purchase_probability=data["avg_purchase_probability"]
    )


@router.get("/leads/ug", response_model=LeadsListResponse)
async def get_ug_course_leads(
    university_id: Optional[str] = Query(None, description="Filter by university"),
    temperature: Optional[str] = Query(None, regex="^(hot|warm|cold)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get leads for Undergraduate (UG) courses.
    These are typically bachelor's degree completions or bridge programs.
    """
    offset = (page - 1) * page_size
    leads, total = get_leads_by_course_type(
        db, CourseType.UG.value, university_id, temperature, page_size, offset
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return LeadsListResponse(
        leads=[CourseLeadResponse(**lead) for lead in leads],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/leads/pg", response_model=LeadsListResponse)
async def get_pg_course_leads(
    university_id: Optional[str] = Query(None, description="Filter by university"),
    temperature: Optional[str] = Query(None, regex="^(hot|warm|cold)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get leads for Postgraduate (PG) courses.
    Includes Masters, MBA, and other graduate programs.
    """
    offset = (page - 1) * page_size
    leads, total = get_leads_by_course_type(
        db, CourseType.PG.value, university_id, temperature, page_size, offset
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return LeadsListResponse(
        leads=[CourseLeadResponse(**lead) for lead in leads],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/leads/executive", response_model=LeadsListResponse)
async def get_executive_course_leads(
    university_id: Optional[str] = Query(None, description="Filter by university"),
    temperature: Optional[str] = Query(None, regex="^(hot|warm|cold)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get leads for Executive Education programs.
    For senior professionals (8+ years experience).
    """
    offset = (page - 1) * page_size
    leads, total = get_leads_by_course_type(
        db, CourseType.EXECUTIVE.value, university_id, temperature, page_size, offset
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return LeadsListResponse(
        leads=[CourseLeadResponse(**lead) for lead in leads],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/leads/certificate", response_model=LeadsListResponse)
async def get_certificate_course_leads(
    university_id: Optional[str] = Query(None, description="Filter by university"),
    temperature: Optional[str] = Query(None, regex="^(hot|warm|cold)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get leads for Certificate programs.
    Short-term professional certifications.
    """
    offset = (page - 1) * page_size
    leads, total = get_leads_by_course_type(
        db, CourseType.CERTIFICATE.value, university_id, temperature, page_size, offset
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return LeadsListResponse(
        leads=[CourseLeadResponse(**lead) for lead in leads],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/leads/bootcamp", response_model=LeadsListResponse)
async def get_bootcamp_course_leads(
    university_id: Optional[str] = Query(None, description="Filter by university"),
    temperature: Optional[str] = Query(None, regex="^(hot|warm|cold)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get leads for Bootcamp programs.
    Intensive short-term skill-building programs.
    """
    offset = (page - 1) * page_size
    leads, total = get_leads_by_course_type(
        db, CourseType.BOOTCAMP.value, university_id, temperature, page_size, offset
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return LeadsListResponse(
        leads=[CourseLeadResponse(**lead) for lead in leads],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/leads/all", response_model=LeadsListResponse)
async def get_all_course_leads(
    university_id: Optional[str] = Query(None, description="Filter by university"),
    course_type: Optional[str] = Query(None, description="Filter by course type"),
    temperature: Optional[str] = Query(None, regex="^(hot|warm|cold)$"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get all course leads with filtering options.
    """
    query = db.query(CourseLead).join(Course)
    
    if university_id:
        query = query.filter(CourseLead.university_id == university_id)
    if course_type:
        query = query.filter(Course.course_type == course_type)
    if temperature:
        query = query.filter(CourseLead.lead_temperature == temperature)
    if search:
        query = query.join(User, CourseLead.user_id == User.id).filter(
            or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
        )
    
    total = query.count()
    offset = (page - 1) * page_size
    leads = query.order_by(CourseLead.overall_score.desc()).offset(offset).limit(page_size).all()
    
    results = []
    for lead in leads:
        user = db.query(User).filter(User.id == lead.user_id).first()
        course = db.query(Course).filter(Course.id == lead.course_id).first()
        
        if not user or not course:
            continue
        
        from app.models.course_intelligence import UserCourseProfile
        profile = db.query(UserCourseProfile).filter(UserCourseProfile.user_id == lead.user_id).first()
        
        results.append(CourseLeadResponse(
            lead_id=lead.id,
            user_id=lead.user_id,
            user_name=user.name,
            user_email=user.email,
            education_level=profile.education_level if profile else None,
            years_experience=profile.years_of_experience if profile else None,
            course_id=course.id,
            course_name=course.name,
            course_type=course.course_type,
            overall_score=lead.overall_score,
            interest_score=lead.interest_score,
            fit_score=lead.fit_score,
            intent_score=lead.intent_score,
            lead_temperature=lead.lead_temperature,
            purchase_probability=lead.purchase_probability,
            ad_clicks=lead.ad_clicks,
            recommendation_reasons=lead.recommendation_reasons or [],
            last_interaction_at=lead.last_interaction_at.isoformat() if lead.last_interaction_at else None,
        ))
    
    total_pages = (total + page_size - 1) // page_size
    
    return LeadsListResponse(
        leads=results,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


# =============================================================================
# COURSES ENDPOINTS
# =============================================================================

@router.get("/courses", response_model=List[CourseResponse])
async def get_courses(
    course_type: Optional[str] = Query(None, description="Filter by course type"),
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get all available courses.
    """
    query = db.query(Course).filter(Course.is_active == True)
    
    if course_type:
        query = query.filter(Course.course_type == course_type)
    if category:
        query = query.filter(Course.category == category)
    
    courses = query.all()
    
    return [
        CourseResponse(
            id=c.id,
            name=c.name,
            short_name=c.short_name,
            course_type=c.course_type,
            category=c.category,
            price=c.price,
            duration_months=c.duration_months,
            format=c.format,
            min_experience_years=c.min_experience_years,
            max_experience_years=c.max_experience_years,
            tags=c.tags or [],
        )
        for c in courses
    ]


@router.get("/courses/types")
async def get_course_types(
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get available course types with descriptions.
    """
    return [
        {"value": "ug", "label": "Undergraduate (UG)", "description": "Bachelor's degree programs"},
        {"value": "pg", "label": "Postgraduate (PG)", "description": "Master's, MBA, and graduate programs"},
        {"value": "executive", "label": "Executive Education", "description": "For senior professionals (8+ years)"},
        {"value": "certificate", "label": "Certificate Programs", "description": "Short-term professional certifications"},
        {"value": "bootcamp", "label": "Bootcamps", "description": "Intensive skill-building programs"},
    ]


# =============================================================================
# RECOMMENDATIONS ENDPOINTS
# =============================================================================

@router.get("/recommendations/{user_id}", response_model=List[CourseRecommendationResponse])
async def get_user_recommendations(
    user_id: str,
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get AI-generated course recommendations for a specific user.
    Shows which courses to pitch based on their profile and behavior.
    """
    recommendations = get_course_recommendations_for_user(db, user_id, limit)
    return [CourseRecommendationResponse(**rec) for rec in recommendations]


# =============================================================================
# PREDICTION ENDPOINTS
# =============================================================================

@router.post("/predict/{user_id}/{course_id}")
async def predict_course_purchase(
    user_id: str,
    course_id: str,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get purchase probability prediction for a user-course pair.
    Recalculates the lead score with latest data.
    """
    try:
        lead = calculate_course_lead_score(db, user_id, course_id)
        
        return {
            "user_id": user_id,
            "course_id": course_id,
            "purchase_probability": lead.purchase_probability,
            "overall_score": lead.overall_score,
            "interest_score": lead.interest_score,
            "fit_score": lead.fit_score,
            "intent_score": lead.intent_score,
            "lead_temperature": lead.lead_temperature,
            "recommendation_reasons": lead.recommendation_reasons,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# =============================================================================
# SEED DATA & EXPORT
# =============================================================================

@router.post("/seed-data", response_model=SeedDataResponse)
async def create_seed_data(
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Generate seed data for course intelligence.
    Creates courses, ads, interactions, leads, and recommendations.
    """
    counts = generate_seed_data(db)
    
    return SeedDataResponse(
        message="Seed data generated successfully",
        counts=counts
    )


@router.get("/export/leads")
async def export_course_leads_csv(
    course_type: Optional[str] = Query(None, description="Filter by course type"),
    temperature: Optional[str] = Query(None, description="Filter by temperature"),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Export course leads as CSV file.
    """
    query = db.query(CourseLead).join(Course)
    
    if course_type:
        query = query.filter(Course.course_type == course_type)
    if temperature:
        query = query.filter(CourseLead.lead_temperature == temperature)
    
    leads = query.order_by(CourseLead.overall_score.desc()).limit(10000).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        'User Name', 'Email', 'Education Level', 'Years Experience',
        'Course Name', 'Course Type', 'Category',
        'Overall Score', 'Interest Score', 'Fit Score', 'Intent Score',
        'Lead Temperature', 'Purchase Probability (%)',
        'Ad Clicks', 'Recommendation Reasons', 'Last Interaction'
    ])
    
    # Data
    for lead in leads:
        user = db.query(User).filter(User.id == lead.user_id).first()
        course = db.query(Course).filter(Course.id == lead.course_id).first()
        
        from app.models.course_intelligence import UserCourseProfile
        profile = db.query(UserCourseProfile).filter(UserCourseProfile.user_id == lead.user_id).first()
        
        if not user or not course:
            continue
        
        writer.writerow([
            user.name,
            user.email,
            profile.education_level if profile else '',
            profile.years_of_experience if profile else '',
            course.name,
            course.course_type.upper(),
            course.category,
            f"{lead.overall_score:.1f}",
            f"{lead.interest_score:.1f}",
            f"{lead.fit_score:.1f}",
            f"{lead.intent_score:.1f}",
            lead.lead_temperature.upper(),
            f"{lead.purchase_probability * 100:.1f}%",
            lead.ad_clicks,
            "; ".join(lead.recommendation_reasons or []),
            lead.last_interaction_at.strftime('%Y-%m-%d') if lead.last_interaction_at else '',
        ])
    
    output.seek(0)
    
    filename = f"course-leads-{course_type or 'all'}-{datetime.now().strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# Need to import or_ for the search filter
from sqlalchemy import or_
