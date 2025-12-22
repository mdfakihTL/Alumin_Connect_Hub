"""
Lead Intelligence API Endpoints
Comprehensive analytics and lead management for super admin
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import csv
import io

from app.core.database import get_db
from app.api.routes.superadmin import require_superadmin
from app.models.user import User
from app.models.university import University
from app.services.lead_intelligence_service import (
    get_lead_analytics_overview,
    get_university_comparison,
    get_career_intelligence,
    get_monthly_trends,
    get_top_performing_ads,
    generate_ai_insights,
    get_leads_list,
    batch_update_lead_scores,
    track_ad_click,
    track_ad_impression,
    track_roadmap_view,
    track_roadmap_generate,
    track_mentor_connect,
    track_feed_engagement,
)

router = APIRouter()


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class FunnelMetrics(BaseModel):
    total_leads: int = 0
    hot_leads: int = 0
    warm_leads: int = 0
    cold_leads: int = 0
    conversion_rate: float = 0.0
    avg_lead_score: float = 0.0
    hot_percentage: float = 0.0


class EngagementMetrics(BaseModel):
    ad_views: int = 0
    ad_clicks: int = 0
    ctr: float = 0.0
    roadmap_views: int = 0
    roadmap_generates: int = 0
    mentor_connects: int = 0
    feed_likes: int = 0
    feed_comments: int = 0
    feed_shares: int = 0
    total_feed_engagement: int = 0


class ScoreDistribution(BaseModel):
    avg_ad_score: float = 0.0
    avg_career_score: float = 0.0
    avg_feed_score: float = 0.0
    avg_mentor_score: float = 0.0


class AnalyticsOverviewResponse(BaseModel):
    funnel: FunnelMetrics
    engagement: EngagementMetrics
    score_distribution: ScoreDistribution


class UniversityComparisonItem(BaseModel):
    university_id: str
    university_name: str
    total_leads: int
    hot_leads: int
    warm_leads: int
    cold_leads: int
    avg_score: float
    hot_percentage: float


class CareerItem(BaseModel):
    career: str
    count: Optional[int] = None
    views: Optional[int] = None
    connects: Optional[int] = None


class CareerIntelligenceResponse(BaseModel):
    most_requested: List[CareerItem]
    most_viewed: List[CareerItem]
    highest_conversion: List[CareerItem]


class TrendItem(BaseModel):
    month: str
    year: int
    ad_engagement: int
    career_engagement: int
    feed_engagement: int
    mentor_engagement: int
    total_engagement: int
    new_leads: int


class TopAdItem(BaseModel):
    ad_id: str
    ad_title: str
    clicks: int
    impressions: int
    ctr: float


class AIInsightItem(BaseModel):
    type: str
    category: str
    title: str
    description: str
    impact_score: float
    confidence_score: float
    related_data: dict = {}


class LeadItem(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    avatar: Optional[str] = None
    university_id: Optional[str] = None
    university_name: str
    graduation_year: Optional[int] = None
    major: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    
    overall_score: float
    lead_category: str
    ad_engagement_score: float
    career_engagement_score: float
    feed_engagement_score: float
    mentor_engagement_score: float
    
    total_activities: int
    activities_last_7_days: int
    activities_last_30_days: int
    engagement_multiplier: float
    
    primary_career_interest: Optional[str] = None
    career_interests: List[str] = []
    conversion_probability: float
    
    last_activity_at: Optional[str] = None
    score_updated_at: Optional[str] = None


class LeadsListResponse(BaseModel):
    leads: List[LeadItem]
    total: int
    page: int
    page_size: int
    total_pages: int


# =============================================================================
# ANALYTICS ENDPOINTS
# =============================================================================

@router.get("/analytics/overview", response_model=AnalyticsOverviewResponse)
async def get_analytics_overview(
    university_id: Optional[str] = Query(None, description="Filter by university"),
    start_date: Optional[datetime] = Query(None, description="Start date for filtering"),
    end_date: Optional[datetime] = Query(None, description="End date for filtering"),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive lead analytics overview.
    Includes funnel metrics, engagement metrics, and score distribution.
    """
    data = get_lead_analytics_overview(db, university_id, start_date, end_date)
    return AnalyticsOverviewResponse(
        funnel=FunnelMetrics(**data['funnel']),
        engagement=EngagementMetrics(**data['engagement']),
        score_distribution=ScoreDistribution(**data['score_distribution'])
    )


@router.get("/analytics/university-comparison", response_model=List[UniversityComparisonItem])
async def get_analytics_university_comparison(
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get lead analytics comparison across all universities.
    """
    data = get_university_comparison(db)
    return [UniversityComparisonItem(**item) for item in data]


@router.get("/analytics/career-intelligence", response_model=CareerIntelligenceResponse)
async def get_analytics_career_intelligence(
    university_id: Optional[str] = Query(None, description="Filter by university"),
    limit: int = Query(10, ge=1, le=50, description="Number of items to return"),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get career-related intelligence data.
    Includes most requested, most viewed, and highest converting careers.
    """
    data = get_career_intelligence(db, university_id, limit)
    return CareerIntelligenceResponse(
        most_requested=[CareerItem(**item) for item in data['most_requested']],
        most_viewed=[CareerItem(**item) for item in data['most_viewed']],
        highest_conversion=[CareerItem(**item) for item in data['highest_conversion']]
    )


@router.get("/analytics/trends", response_model=List[TrendItem])
async def get_analytics_trends(
    university_id: Optional[str] = Query(None, description="Filter by university"),
    months: int = Query(12, ge=1, le=24, description="Number of months to include"),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get monthly engagement trends.
    """
    data = get_monthly_trends(db, university_id, months)
    return [TrendItem(**item) for item in data]


@router.get("/analytics/top-ads", response_model=List[TopAdItem])
async def get_analytics_top_ads(
    university_id: Optional[str] = Query(None, description="Filter by university"),
    limit: int = Query(10, ge=1, le=50, description="Number of ads to return"),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get top performing ads by engagement.
    """
    data = get_top_performing_ads(db, university_id, limit)
    return [TopAdItem(**item) for item in data]


@router.get("/ai-insights", response_model=List[AIInsightItem])
async def get_ai_insights(
    university_id: Optional[str] = Query(None, description="Filter by university"),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get AI-generated insights based on analytics data.
    """
    data = generate_ai_insights(db, university_id)
    return [AIInsightItem(**item) for item in data]


# =============================================================================
# LEADS MANAGEMENT
# =============================================================================

@router.get("/leads", response_model=LeadsListResponse)
async def get_leads(
    university_id: Optional[str] = Query(None, description="Filter by university"),
    category: Optional[str] = Query(None, regex="^(hot|warm|cold)$", description="Filter by lead category"),
    min_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum lead score"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get paginated list of leads with filtering and search.
    """
    offset = (page - 1) * page_size
    leads, total = get_leads_list(
        db, university_id, category, min_score, search, page_size, offset
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return LeadsListResponse(
        leads=[LeadItem(**lead) for lead in leads],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("/leads/refresh-scores")
async def refresh_lead_scores(
    university_id: Optional[str] = Query(None, description="Refresh for specific university"),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Trigger batch update of lead scores.
    """
    updated_count = batch_update_lead_scores(db, university_id)
    return {
        "message": f"Successfully updated {updated_count} lead scores",
        "updated_count": updated_count
    }


# =============================================================================
# EXPORT ENDPOINTS
# =============================================================================

@router.get("/export/leads")
async def export_leads_csv(
    university_id: Optional[str] = Query(None, description="Filter by university"),
    category: Optional[str] = Query(None, regex="^(hot|warm|cold)$", description="Filter by lead category"),
    min_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum lead score"),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Export leads data as CSV file.
    """
    leads, _ = get_leads_list(db, university_id, category, min_score, None, 10000, 0)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        'Name', 'Email', 'University', 'Graduation Year', 'Major',
        'Job Title', 'Company', 'Location',
        'Overall Score', 'Lead Category', 'Ad Score', 'Career Score',
        'Feed Score', 'Mentor Score', 'Total Activities',
        'Activities (7d)', 'Activities (30d)', 'Primary Career Interest',
        'Conversion Probability', 'Last Activity'
    ])
    
    # Data rows
    for lead in leads:
        writer.writerow([
            lead['name'],
            lead['email'],
            lead['university_name'],
            lead['graduation_year'] or '',
            lead['major'] or '',
            lead['job_title'] or '',
            lead['company'] or '',
            lead['location'] or '',
            lead['overall_score'],
            lead['lead_category'].upper(),
            lead['ad_engagement_score'],
            lead['career_engagement_score'],
            lead['feed_engagement_score'],
            lead['mentor_engagement_score'],
            lead['total_activities'],
            lead['activities_last_7_days'],
            lead['activities_last_30_days'],
            lead['primary_career_interest'] or '',
            f"{lead['conversion_probability'] * 100:.1f}%",
            lead['last_activity_at'] or ''
        ])
    
    output.seek(0)
    
    filename = f"lead-intelligence-{datetime.now().strftime('%Y%m%d-%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/analytics")
async def export_analytics_csv(
    university_id: Optional[str] = Query(None, description="Filter by university"),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Export analytics summary as CSV file.
    """
    overview = get_lead_analytics_overview(db, university_id)
    career_intel = get_career_intelligence(db, university_id)
    trends = get_monthly_trends(db, university_id)
    top_ads = get_top_performing_ads(db, university_id)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Funnel Metrics
    writer.writerow(['=== LEAD FUNNEL METRICS ==='])
    writer.writerow(['Metric', 'Value'])
    writer.writerow(['Total Leads', overview['funnel']['total_leads']])
    writer.writerow(['Hot Leads', overview['funnel']['hot_leads']])
    writer.writerow(['Warm Leads', overview['funnel']['warm_leads']])
    writer.writerow(['Cold Leads', overview['funnel']['cold_leads']])
    writer.writerow(['Conversion Rate', f"{overview['funnel']['conversion_rate']}%"])
    writer.writerow(['Avg Lead Score', overview['funnel']['avg_lead_score']])
    writer.writerow([])
    
    # Engagement Metrics
    writer.writerow(['=== ENGAGEMENT METRICS ==='])
    writer.writerow(['Metric', 'Value'])
    writer.writerow(['Ad Views', overview['engagement']['ad_views']])
    writer.writerow(['Ad Clicks', overview['engagement']['ad_clicks']])
    writer.writerow(['CTR', f"{overview['engagement']['ctr']}%"])
    writer.writerow(['Roadmap Views', overview['engagement']['roadmap_views']])
    writer.writerow(['Roadmap Generates', overview['engagement']['roadmap_generates']])
    writer.writerow(['Mentor Connects', overview['engagement']['mentor_connects']])
    writer.writerow(['Feed Engagement', overview['engagement']['total_feed_engagement']])
    writer.writerow([])
    
    # Top Careers
    writer.writerow(['=== TOP CAREER INTERESTS ==='])
    writer.writerow(['Career', 'Requests'])
    for career in career_intel['most_requested'][:10]:
        writer.writerow([career['career'], career['count']])
    writer.writerow([])
    
    # Top Ads
    writer.writerow(['=== TOP PERFORMING ADS ==='])
    writer.writerow(['Ad Title', 'Clicks', 'Impressions', 'CTR'])
    for ad in top_ads[:10]:
        writer.writerow([ad['ad_title'], ad['clicks'], ad['impressions'], f"{ad['ctr']}%"])
    writer.writerow([])
    
    # Monthly Trends
    writer.writerow(['=== MONTHLY TRENDS ==='])
    writer.writerow(['Month', 'Ad Engagement', 'Career Engagement', 'Feed Engagement', 'New Leads'])
    for trend in trends:
        writer.writerow([
            f"{trend['month']} {trend['year']}",
            trend['ad_engagement'],
            trend['career_engagement'],
            trend['feed_engagement'],
            trend['new_leads']
        ])
    
    output.seek(0)
    
    filename = f"analytics-report-{datetime.now().strftime('%Y%m%d-%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# =============================================================================
# EVENT TRACKING ENDPOINTS (for frontend integration)
# =============================================================================

class TrackAdClickRequest(BaseModel):
    ad_id: str


class TrackAdImpressionRequest(BaseModel):
    ad_id: str


class TrackRoadmapViewRequest(BaseModel):
    career_goal: str
    roadmap_id: Optional[str] = None


class TrackRoadmapGenerateRequest(BaseModel):
    career_goal: str
    current_position: Optional[str] = None


class TrackMentorConnectRequest(BaseModel):
    mentor_id: str
    career_context: Optional[str] = None


class TrackFeedEngagementRequest(BaseModel):
    post_id: str
    engagement_type: str  # view, like, comment, share, save


@router.post("/track/ad-click")
async def track_ad_click_event(
    request: TrackAdClickRequest,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """Track ad click event (for testing - normally called by frontend)"""
    track_ad_click(db, current_user.id, request.ad_id, current_user.university_id)
    return {"message": "Ad click tracked"}


@router.post("/track/ad-impression")
async def track_ad_impression_event(
    request: TrackAdImpressionRequest,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """Track ad impression event"""
    track_ad_impression(db, current_user.id, request.ad_id, current_user.university_id)
    return {"message": "Ad impression tracked"}


@router.post("/track/roadmap-view")
async def track_roadmap_view_event(
    request: TrackRoadmapViewRequest,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """Track roadmap view event"""
    track_roadmap_view(
        db, current_user.id, request.career_goal,
        current_user.university_id, request.roadmap_id
    )
    return {"message": "Roadmap view tracked"}


@router.post("/track/roadmap-generate")
async def track_roadmap_generate_event(
    request: TrackRoadmapGenerateRequest,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """Track roadmap generation event"""
    track_roadmap_generate(
        db, current_user.id, request.career_goal,
        request.current_position, current_user.university_id
    )
    return {"message": "Roadmap generation tracked"}


@router.post("/track/mentor-connect")
async def track_mentor_connect_event(
    request: TrackMentorConnectRequest,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """Track mentor connect event"""
    track_mentor_connect(
        db, current_user.id, request.mentor_id,
        request.career_context, current_user.university_id
    )
    return {"message": "Mentor connect tracked"}


@router.post("/track/feed-engagement")
async def track_feed_engagement_event(
    request: TrackFeedEngagementRequest,
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """Track feed engagement event"""
    track_feed_engagement(
        db, current_user.id, request.post_id,
        request.engagement_type, current_user.university_id
    )
    return {"message": "Feed engagement tracked"}


# =============================================================================
# UTILITY ENDPOINTS
# =============================================================================

@router.get("/universities")
async def get_universities_for_filter(
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db)
):
    """
    Get list of universities for filter dropdown.
    """
    universities = db.query(University).filter(University.is_enabled == True).all()
    return [
        {
            "id": uni.id,
            "name": uni.name,
        }
        for uni in universities
    ]
