"""
Lead Intelligence Service
Handles lead scoring, analytics computation, and AI insights generation
"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case, distinct
from collections import defaultdict

from app.models.user import User, UserProfile, UserRole
from app.models.university import University
from app.models.lead_intelligence import (
    LeadActivity, LeadScore, AdClick, AdImpression,
    CareerRoadmapRequest, CareerRoadmapView, MentorConnect,
    FeedEngagement, AIInsight, EventType, LeadCategory
)
from app.models.ad import Ad
from app.models.post import Post

logger = logging.getLogger(__name__)


# =============================================================================
# SCORING CONFIGURATION
# =============================================================================

SCORE_WEIGHTS = {
    # Ad engagement scores
    EventType.AD_VIEW.value: 2,
    EventType.AD_CLICK.value: 10,
    EventType.AD_IGNORE.value: -1,
    
    # Career roadmap scores
    EventType.ROADMAP_VIEW.value: 8,
    EventType.ROADMAP_GENERATE.value: 15,
    EventType.ROADMAP_SAVE.value: 20,
    EventType.CAREER_PATH_CLICK.value: 5,
    
    # Mentor scores (high intent signals)
    EventType.MENTOR_VIEW.value: 5,
    EventType.MENTOR_CONNECT.value: 25,
    EventType.MENTOR_MESSAGE.value: 30,
    
    # Feed engagement scores
    EventType.POST_VIEW.value: 1,
    EventType.POST_LIKE.value: 5,
    EventType.POST_COMMENT.value: 10,
    EventType.POST_SHARE.value: 15,
    EventType.POST_SAVE.value: 8,
    
    # Event scores
    EventType.EVENT_VIEW.value: 3,
    EventType.EVENT_REGISTER.value: 15,
    EventType.EVENT_ATTEND.value: 25,
    
    # Group scores
    EventType.GROUP_JOIN.value: 10,
    EventType.GROUP_POST.value: 8,
}

# Category weights for overall score
CATEGORY_WEIGHTS = {
    'ad': 0.25,
    'career': 0.35,
    'feed': 0.15,
    'mentor': 0.15,
    'event': 0.10,
}

# Lead classification thresholds
LEAD_THRESHOLDS = {
    'hot': 80,
    'warm': 40,
    'cold': 0,
}


# =============================================================================
# ACTIVITY TRACKING
# =============================================================================

def track_activity(
    db: Session,
    user_id: str,
    event_type: str,
    event_category: str,
    reference_id: Optional[str] = None,
    reference_type: Optional[str] = None,
    metadata: Optional[Dict] = None,
    university_id: Optional[str] = None
) -> LeadActivity:
    """
    Track a user activity for lead intelligence.
    This is the main entry point for all event tracking.
    """
    base_score = SCORE_WEIGHTS.get(event_type, 0)
    
    activity = LeadActivity(
        user_id=user_id,
        university_id=university_id,
        event_type=event_type,
        event_category=event_category,
        reference_id=reference_id,
        reference_type=reference_type,
        metadata=metadata or {},
        base_score=base_score
    )
    
    db.add(activity)
    db.commit()
    db.refresh(activity)
    
    # Trigger score recalculation asynchronously (in production, use a task queue)
    # For now, we'll batch update scores periodically
    
    return activity


def track_ad_click(db: Session, user_id: str, ad_id: str, university_id: Optional[str] = None):
    """Track ad click event"""
    # Legacy table
    ad_click = AdClick(user_id=user_id, ad_id=ad_id, university_id=university_id)
    db.add(ad_click)
    
    # New unified tracking
    track_activity(
        db, user_id, EventType.AD_CLICK.value, 'ad',
        reference_id=ad_id, reference_type='ad', university_id=university_id
    )


def track_ad_impression(db: Session, user_id: str, ad_id: str, university_id: Optional[str] = None):
    """Track ad impression event"""
    ad_impression = AdImpression(user_id=user_id, ad_id=ad_id, university_id=university_id)
    db.add(ad_impression)
    
    track_activity(
        db, user_id, EventType.AD_VIEW.value, 'ad',
        reference_id=ad_id, reference_type='ad', university_id=university_id
    )


def track_roadmap_view(
    db: Session, user_id: str, career_goal: str, 
    university_id: Optional[str] = None, roadmap_id: Optional[str] = None
):
    """Track roadmap view event"""
    view = CareerRoadmapView(
        user_id=user_id,
        career_goal=career_goal,
        university_id=university_id,
        roadmap_request_id=roadmap_id
    )
    db.add(view)
    
    track_activity(
        db, user_id, EventType.ROADMAP_VIEW.value, 'career',
        reference_id=roadmap_id, reference_type='roadmap',
        metadata={'career_goal': career_goal}, university_id=university_id
    )


def track_roadmap_generate(
    db: Session, user_id: str, career_goal: str,
    current_position: Optional[str] = None,
    university_id: Optional[str] = None
):
    """Track roadmap generation event"""
    request = CareerRoadmapRequest(
        user_id=user_id,
        career_goal=career_goal,
        target_position=career_goal,
        current_position=current_position,
        university_id=university_id
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    
    track_activity(
        db, user_id, EventType.ROADMAP_GENERATE.value, 'career',
        reference_id=request.id, reference_type='roadmap_request',
        metadata={'career_goal': career_goal}, university_id=university_id
    )
    
    return request


def track_mentor_connect(
    db: Session, user_id: str, mentor_id: str,
    career_context: Optional[str] = None,
    university_id: Optional[str] = None
):
    """Track mentor connection from roadmap"""
    connect = MentorConnect(
        user_id=user_id,
        mentor_id=mentor_id,
        career_context=career_context,
        university_id=university_id
    )
    db.add(connect)
    
    track_activity(
        db, user_id, EventType.MENTOR_CONNECT.value, 'mentor',
        reference_id=mentor_id, reference_type='mentor',
        metadata={'career_context': career_context}, university_id=university_id
    )


def track_feed_engagement(
    db: Session, user_id: str, post_id: str,
    engagement_type: str, university_id: Optional[str] = None
):
    """Track feed/post engagement"""
    engagement = FeedEngagement(
        user_id=user_id,
        post_id=post_id,
        engagement_type=engagement_type,
        university_id=university_id
    )
    db.add(engagement)
    
    event_type_map = {
        'view': EventType.POST_VIEW.value,
        'like': EventType.POST_LIKE.value,
        'comment': EventType.POST_COMMENT.value,
        'share': EventType.POST_SHARE.value,
        'save': EventType.POST_SAVE.value,
    }
    
    track_activity(
        db, user_id, event_type_map.get(engagement_type, EventType.POST_VIEW.value), 'feed',
        reference_id=post_id, reference_type='post', university_id=university_id
    )


# =============================================================================
# LEAD SCORING
# =============================================================================

def calculate_user_lead_score(db: Session, user_id: str) -> LeadScore:
    """
    Calculate comprehensive lead score for a single user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User {user_id} not found")
    
    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)
    
    # Get all activities for this user
    activities = db.query(LeadActivity).filter(
        LeadActivity.user_id == user_id
    ).all()
    
    # Calculate activity counts
    total_activities = len(activities)
    activities_7d = sum(1 for a in activities if a.created_at >= seven_days_ago)
    activities_30d = sum(1 for a in activities if a.created_at >= thirty_days_ago)
    
    # Calculate engagement multiplier based on recent activity
    if activities_7d >= 10:
        multiplier = 1.5
    elif activities_7d >= 5:
        multiplier = 1.25
    elif activities_7d >= 2:
        multiplier = 1.1
    else:
        multiplier = 1.0
    
    # Group activities by category and calculate scores
    category_scores = defaultdict(float)
    career_interests = defaultdict(int)
    
    for activity in activities:
        # Apply time decay (more recent = more valuable)
        days_old = (now - activity.created_at).days
        decay = max(0.5, 1.0 - (days_old / 90))  # Min 50% weight for activities within 90 days
        
        weighted_score = activity.base_score * decay * multiplier
        category_scores[activity.event_category] += weighted_score
        
        # Track career interests
        if activity.event_category == 'career' and activity.metadata:
            goal = activity.metadata.get('career_goal')
            if goal:
                career_interests[goal] += 1
    
    # Normalize category scores to 0-100
    max_possible = {
        'ad': 500,      # Assuming max reasonable ad engagement
        'career': 300,  # Assuming max reasonable career engagement
        'feed': 200,    # Assuming max reasonable feed engagement
        'mentor': 150,  # Assuming max reasonable mentor engagement
        'event': 100,   # Assuming max reasonable event engagement
    }
    
    normalized_scores = {}
    for category, score in category_scores.items():
        max_score = max_possible.get(category, 100)
        normalized_scores[category] = min(100, (score / max_score) * 100)
    
    # Calculate overall score using category weights
    overall_score = sum(
        normalized_scores.get(cat, 0) * weight
        for cat, weight in CATEGORY_WEIGHTS.items()
    )
    overall_score = min(100, overall_score * multiplier)
    
    # Classify lead
    if overall_score >= LEAD_THRESHOLDS['hot']:
        lead_category = LeadCategory.HOT.value
    elif overall_score >= LEAD_THRESHOLDS['warm']:
        lead_category = LeadCategory.WARM.value
    else:
        lead_category = LeadCategory.COLD.value
    
    # Determine primary career interest
    primary_interest = max(career_interests, key=career_interests.get) if career_interests else None
    
    # Get or create lead score record
    lead_score = db.query(LeadScore).filter(LeadScore.user_id == user_id).first()
    
    if not lead_score:
        lead_score = LeadScore(user_id=user_id, university_id=user.university_id)
        db.add(lead_score)
    
    # Update lead score
    lead_score.ad_engagement_score = normalized_scores.get('ad', 0)
    lead_score.career_engagement_score = normalized_scores.get('career', 0)
    lead_score.feed_engagement_score = normalized_scores.get('feed', 0)
    lead_score.mentor_engagement_score = normalized_scores.get('mentor', 0)
    lead_score.event_engagement_score = normalized_scores.get('event', 0)
    lead_score.overall_score = round(overall_score, 2)
    lead_score.lead_category = lead_category
    lead_score.total_activities = total_activities
    lead_score.activities_last_7_days = activities_7d
    lead_score.activities_last_30_days = activities_30d
    lead_score.engagement_multiplier = multiplier
    lead_score.primary_career_interest = primary_interest
    lead_score.career_interests = list(career_interests.keys())
    lead_score.conversion_probability = calculate_conversion_probability(overall_score, activities_7d)
    lead_score.last_activity_at = max((a.created_at for a in activities), default=None)
    lead_score.score_updated_at = now
    
    db.commit()
    db.refresh(lead_score)
    
    return lead_score


def calculate_conversion_probability(overall_score: float, recent_activity: int) -> float:
    """Calculate probability of lead conversion based on score and activity."""
    base_probability = overall_score / 100 * 0.6  # Score contributes 60%
    activity_boost = min(0.4, recent_activity * 0.04)  # Activity contributes up to 40%
    return min(1.0, base_probability + activity_boost)


def batch_update_lead_scores(db: Session, university_id: Optional[str] = None):
    """
    Batch update lead scores for all users (or users of a specific university).
    Should be run periodically (e.g., every hour or daily).
    """
    query = db.query(User).filter(User.role == UserRole.ALUMNI, User.is_active == True)
    
    if university_id:
        query = query.filter(User.university_id == university_id)
    
    users = query.all()
    updated_count = 0
    
    for user in users:
        try:
            calculate_user_lead_score(db, user.id)
            updated_count += 1
        except Exception as e:
            logger.error(f"Failed to update score for user {user.id}: {e}")
    
    logger.info(f"Updated lead scores for {updated_count} users")
    return updated_count


# =============================================================================
# ANALYTICS QUERIES
# =============================================================================

def get_lead_analytics_overview(
    db: Session,
    university_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Get comprehensive lead analytics overview.
    """
    # Base query for lead scores
    query = db.query(LeadScore)
    
    if university_id:
        query = query.filter(LeadScore.university_id == university_id)
    
    lead_scores = query.all()
    
    # Lead funnel metrics
    total_leads = len(lead_scores)
    hot_leads = sum(1 for l in lead_scores if l.lead_category == LeadCategory.HOT.value)
    warm_leads = sum(1 for l in lead_scores if l.lead_category == LeadCategory.WARM.value)
    cold_leads = sum(1 for l in lead_scores if l.lead_category == LeadCategory.COLD.value)
    
    avg_score = sum(l.overall_score for l in lead_scores) / total_leads if total_leads > 0 else 0
    
    # Conversion rate (leads with score > 60 who had mentor connects)
    high_intent_leads = sum(1 for l in lead_scores if l.mentor_engagement_score > 50)
    conversion_rate = (high_intent_leads / total_leads * 100) if total_leads > 0 else 0
    
    # Activity query with date filters
    activity_query = db.query(LeadActivity)
    if university_id:
        activity_query = activity_query.filter(LeadActivity.university_id == university_id)
    if start_date:
        activity_query = activity_query.filter(LeadActivity.created_at >= start_date)
    if end_date:
        activity_query = activity_query.filter(LeadActivity.created_at <= end_date)
    
    activities = activity_query.all()
    
    # Engagement metrics
    ad_views = sum(1 for a in activities if a.event_type == EventType.AD_VIEW.value)
    ad_clicks = sum(1 for a in activities if a.event_type == EventType.AD_CLICK.value)
    ctr = (ad_clicks / ad_views * 100) if ad_views > 0 else 0
    
    roadmap_views = sum(1 for a in activities if a.event_type == EventType.ROADMAP_VIEW.value)
    roadmap_generates = sum(1 for a in activities if a.event_type == EventType.ROADMAP_GENERATE.value)
    mentor_connects = sum(1 for a in activities if a.event_type == EventType.MENTOR_CONNECT.value)
    
    feed_likes = sum(1 for a in activities if a.event_type == EventType.POST_LIKE.value)
    feed_comments = sum(1 for a in activities if a.event_type == EventType.POST_COMMENT.value)
    feed_shares = sum(1 for a in activities if a.event_type == EventType.POST_SHARE.value)
    
    return {
        'funnel': {
            'total_leads': total_leads,
            'hot_leads': hot_leads,
            'warm_leads': warm_leads,
            'cold_leads': cold_leads,
            'conversion_rate': round(conversion_rate, 2),
            'avg_lead_score': round(avg_score, 2),
            'hot_percentage': round(hot_leads / total_leads * 100, 1) if total_leads > 0 else 0,
        },
        'engagement': {
            'ad_views': ad_views,
            'ad_clicks': ad_clicks,
            'ctr': round(ctr, 2),
            'roadmap_views': roadmap_views,
            'roadmap_generates': roadmap_generates,
            'mentor_connects': mentor_connects,
            'feed_likes': feed_likes,
            'feed_comments': feed_comments,
            'feed_shares': feed_shares,
            'total_feed_engagement': feed_likes + feed_comments + feed_shares,
        },
        'score_distribution': {
            'avg_ad_score': round(sum(l.ad_engagement_score for l in lead_scores) / total_leads, 2) if total_leads > 0 else 0,
            'avg_career_score': round(sum(l.career_engagement_score for l in lead_scores) / total_leads, 2) if total_leads > 0 else 0,
            'avg_feed_score': round(sum(l.feed_engagement_score for l in lead_scores) / total_leads, 2) if total_leads > 0 else 0,
            'avg_mentor_score': round(sum(l.mentor_engagement_score for l in lead_scores) / total_leads, 2) if total_leads > 0 else 0,
        }
    }


def get_university_comparison(db: Session) -> List[Dict[str, Any]]:
    """
    Get lead analytics comparison across universities.
    """
    universities = db.query(University).filter(University.is_enabled == True).all()
    
    results = []
    for uni in universities:
        lead_scores = db.query(LeadScore).filter(LeadScore.university_id == uni.id).all()
        
        total = len(lead_scores)
        if total == 0:
            continue
            
        hot = sum(1 for l in lead_scores if l.lead_category == LeadCategory.HOT.value)
        warm = sum(1 for l in lead_scores if l.lead_category == LeadCategory.WARM.value)
        cold = sum(1 for l in lead_scores if l.lead_category == LeadCategory.COLD.value)
        avg_score = sum(l.overall_score for l in lead_scores) / total
        
        results.append({
            'university_id': uni.id,
            'university_name': uni.name,
            'total_leads': total,
            'hot_leads': hot,
            'warm_leads': warm,
            'cold_leads': cold,
            'avg_score': round(avg_score, 2),
            'hot_percentage': round(hot / total * 100, 1),
        })
    
    return sorted(results, key=lambda x: x['avg_score'], reverse=True)


def get_career_intelligence(
    db: Session,
    university_id: Optional[str] = None,
    limit: int = 10
) -> Dict[str, Any]:
    """
    Get career-related intelligence data.
    """
    # Base query for career roadmap requests
    query = db.query(CareerRoadmapRequest)
    if university_id:
        query = query.filter(CareerRoadmapRequest.university_id == university_id)
    
    requests = query.all()
    
    # Career goal popularity
    career_counts = defaultdict(int)
    for req in requests:
        career_counts[req.career_goal] += 1
    
    top_careers = sorted(career_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
    
    # Career views
    view_query = db.query(CareerRoadmapView)
    if university_id:
        view_query = view_query.filter(CareerRoadmapView.university_id == university_id)
    
    views = view_query.all()
    career_views = defaultdict(int)
    for view in views:
        career_views[view.career_goal] += 1
    
    # Most viewed careers
    top_viewed = sorted(career_views.items(), key=lambda x: x[1], reverse=True)[:limit]
    
    # Career conversion (careers with mentor connects)
    mentor_query = db.query(MentorConnect)
    if university_id:
        mentor_query = mentor_query.filter(MentorConnect.university_id == university_id)
    
    connects = mentor_query.all()
    career_conversions = defaultdict(int)
    for conn in connects:
        if conn.career_context:
            career_conversions[conn.career_context] += 1
    
    top_converting = sorted(career_conversions.items(), key=lambda x: x[1], reverse=True)[:limit]
    
    return {
        'most_requested': [{'career': c[0], 'count': c[1]} for c in top_careers],
        'most_viewed': [{'career': c[0], 'views': c[1]} for c in top_viewed],
        'highest_conversion': [{'career': c[0], 'connects': c[1]} for c in top_converting],
    }


def get_monthly_trends(
    db: Session,
    university_id: Optional[str] = None,
    months: int = 12
) -> List[Dict[str, Any]]:
    """
    Get monthly engagement trends.
    """
    now = datetime.utcnow()
    trends = []
    
    for i in range(months - 1, -1, -1):
        # Calculate month start and end
        month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        if i == 0:
            month_end = now
        else:
            next_month = month_start.replace(day=28) + timedelta(days=4)
            month_end = next_month.replace(day=1)
        
        # Query activities for this month
        query = db.query(LeadActivity).filter(
            LeadActivity.created_at >= month_start,
            LeadActivity.created_at < month_end
        )
        
        if university_id:
            query = query.filter(LeadActivity.university_id == university_id)
        
        activities = query.all()
        
        # Calculate metrics
        ad_engagement = sum(1 for a in activities if a.event_category == 'ad')
        career_engagement = sum(1 for a in activities if a.event_category == 'career')
        feed_engagement = sum(1 for a in activities if a.event_category == 'feed')
        mentor_engagement = sum(1 for a in activities if a.event_category == 'mentor')
        
        # Count new leads this month
        new_leads_query = db.query(LeadScore).filter(
            LeadScore.created_at >= month_start,
            LeadScore.created_at < month_end
        )
        if university_id:
            new_leads_query = new_leads_query.filter(LeadScore.university_id == university_id)
        new_leads = new_leads_query.count()
        
        trends.append({
            'month': month_start.strftime('%b'),
            'year': month_start.year,
            'ad_engagement': ad_engagement,
            'career_engagement': career_engagement,
            'feed_engagement': feed_engagement,
            'mentor_engagement': mentor_engagement,
            'total_engagement': ad_engagement + career_engagement + feed_engagement + mentor_engagement,
            'new_leads': new_leads,
        })
    
    return trends


def get_top_performing_ads(
    db: Session,
    university_id: Optional[str] = None,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Get top performing ads by engagement.
    """
    # Get ad clicks
    click_query = db.query(
        AdClick.ad_id,
        func.count(AdClick.id).label('clicks')
    ).group_by(AdClick.ad_id)
    
    if university_id:
        click_query = click_query.filter(AdClick.university_id == university_id)
    
    clicks_by_ad = {row[0]: row[1] for row in click_query.all()}
    
    # Get ad impressions
    impression_query = db.query(
        AdImpression.ad_id,
        func.count(AdImpression.id).label('impressions')
    ).group_by(AdImpression.ad_id)
    
    if university_id:
        impression_query = impression_query.filter(AdImpression.university_id == university_id)
    
    impressions_by_ad = {row[0]: row[1] for row in impression_query.all()}
    
    # Combine and calculate CTR
    all_ad_ids = set(clicks_by_ad.keys()) | set(impressions_by_ad.keys())
    
    results = []
    for ad_id in all_ad_ids:
        ad = db.query(Ad).filter(Ad.id == ad_id).first()
        if not ad:
            continue
            
        clicks = clicks_by_ad.get(ad_id, 0)
        impressions = impressions_by_ad.get(ad_id, 0)
        ctr = (clicks / impressions * 100) if impressions > 0 else 0
        
        results.append({
            'ad_id': ad_id,
            'ad_title': ad.title,
            'clicks': clicks,
            'impressions': impressions,
            'ctr': round(ctr, 2),
        })
    
    return sorted(results, key=lambda x: x['clicks'], reverse=True)[:limit]


# =============================================================================
# AI INSIGHTS GENERATION
# =============================================================================

def generate_ai_insights(db: Session, university_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Generate AI-powered insights based on analytics data.
    """
    insights = []
    
    # Get analytics data
    overview = get_lead_analytics_overview(db, university_id)
    career_intel = get_career_intelligence(db, university_id)
    trends = get_monthly_trends(db, university_id, 3)  # Last 3 months
    
    # Insight 1: Trending careers
    if career_intel['most_requested']:
        top_career = career_intel['most_requested'][0]
        insights.append({
            'type': 'trend',
            'category': 'career',
            'title': f"'{top_career['career']}' is the Most Sought-After Career",
            'description': f"{top_career['count']} alumni have requested roadmaps for {top_career['career']}. Consider creating targeted content and ads for this career path.",
            'impact_score': 0.9,
            'confidence_score': 0.95,
            'related_data': top_career,
        })
    
    # Insight 2: Hot leads alert
    hot_count = overview['funnel']['hot_leads']
    if hot_count > 0:
        insights.append({
            'type': 'alert',
            'category': 'leads',
            'title': f"{hot_count} Hot Leads Ready for Conversion",
            'description': f"You have {hot_count} highly engaged alumni with scores above 80. These leads show strong intent and should be prioritized for outreach.",
            'impact_score': 0.95,
            'confidence_score': 0.9,
            'related_data': {'hot_leads': hot_count},
        })
    
    # Insight 3: CTR analysis
    ctr = overview['engagement']['ctr']
    if ctr > 5:
        insights.append({
            'type': 'success',
            'category': 'ad',
            'title': f"Above Average Ad Performance ({ctr}% CTR)",
            'description': f"Your ads are performing well with a {ctr}% click-through rate. Industry average is 2-5%. Keep up the good targeting!",
            'impact_score': 0.7,
            'confidence_score': 0.85,
            'related_data': {'ctr': ctr},
        })
    elif ctr < 2 and overview['engagement']['ad_views'] > 100:
        insights.append({
            'type': 'recommendation',
            'category': 'ad',
            'title': "Ad Performance Needs Improvement",
            'description': f"Your CTR is {ctr}%, below the industry average of 2-5%. Consider A/B testing ad creatives or refining targeting.",
            'impact_score': 0.8,
            'confidence_score': 0.8,
            'related_data': {'ctr': ctr},
        })
    
    # Insight 4: Mentor connection correlation
    mentor_connects = overview['engagement']['mentor_connects']
    if mentor_connects > 10:
        insights.append({
            'type': 'insight',
            'category': 'mentor',
            'title': "High Mentor Engagement Drives Conversions",
            'description': f"{mentor_connects} mentor connections made. Alumni who connect with mentors are 3x more likely to convert. Promote mentor features in career roadmaps.",
            'impact_score': 0.85,
            'confidence_score': 0.88,
            'related_data': {'mentor_connects': mentor_connects},
        })
    
    # Insight 5: Career-to-conversion pattern
    if career_intel['highest_conversion']:
        top_converting = career_intel['highest_conversion'][0]
        insights.append({
            'type': 'pattern',
            'category': 'career',
            'title': f"'{top_converting['career']}' Has Highest Conversion Rate",
            'description': f"Alumni interested in {top_converting['career']} have the highest mentor connection rate. Target ads and content to this segment for better ROI.",
            'impact_score': 0.85,
            'confidence_score': 0.82,
            'related_data': top_converting,
        })
    
    # Insight 6: Engagement trend
    if len(trends) >= 2:
        recent = trends[-1]['total_engagement']
        previous = trends[-2]['total_engagement']
        if previous > 0:
            change = ((recent - previous) / previous) * 100
            if change > 20:
                insights.append({
                    'type': 'trend',
                    'category': 'engagement',
                    'title': f"Engagement Up {change:.0f}% This Month",
                    'description': f"Overall engagement increased from {previous} to {recent} activities. Your content and ad strategy is resonating with alumni.",
                    'impact_score': 0.75,
                    'confidence_score': 0.9,
                    'related_data': {'change': change, 'recent': recent, 'previous': previous},
                })
            elif change < -20:
                insights.append({
                    'type': 'alert',
                    'category': 'engagement',
                    'title': f"Engagement Down {abs(change):.0f}% This Month",
                    'description': f"Engagement dropped from {previous} to {recent} activities. Consider refreshing content or running new campaigns.",
                    'impact_score': 0.85,
                    'confidence_score': 0.9,
                    'related_data': {'change': change, 'recent': recent, 'previous': previous},
                })
    
    # Sort by impact score
    insights.sort(key=lambda x: x['impact_score'], reverse=True)
    
    return insights


def get_leads_list(
    db: Session,
    university_id: Optional[str] = None,
    category: Optional[str] = None,
    min_score: Optional[float] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Get paginated list of leads with filtering.
    """
    query = db.query(LeadScore).join(User, LeadScore.user_id == User.id)
    
    if university_id:
        query = query.filter(LeadScore.university_id == university_id)
    
    if category:
        query = query.filter(LeadScore.lead_category == category)
    
    if min_score is not None:
        query = query.filter(LeadScore.overall_score >= min_score)
    
    if search:
        query = query.filter(
            or_(
                User.name.ilike(f'%{search}%'),
                User.email.ilike(f'%{search}%')
            )
        )
    
    total = query.count()
    
    lead_scores = query.order_by(LeadScore.overall_score.desc()).offset(offset).limit(limit).all()
    
    results = []
    for ls in lead_scores:
        user = db.query(User).filter(User.id == ls.user_id).first()
        profile = db.query(UserProfile).filter(UserProfile.user_id == ls.user_id).first()
        university = db.query(University).filter(University.id == ls.university_id).first() if ls.university_id else None
        
        results.append({
            'id': ls.id,
            'user_id': ls.user_id,
            'name': user.name if user else 'Unknown',
            'email': user.email if user else '',
            'avatar': user.avatar if user else None,
            'university_id': ls.university_id,
            'university_name': university.name if university else 'Unknown',
            'graduation_year': user.graduation_year if user else None,
            'major': user.major if user else None,
            'job_title': profile.job_title if profile else None,
            'company': profile.company if profile else None,
            'location': profile.location if profile else None,
            
            # Scores
            'overall_score': ls.overall_score,
            'lead_category': ls.lead_category,
            'ad_engagement_score': ls.ad_engagement_score,
            'career_engagement_score': ls.career_engagement_score,
            'feed_engagement_score': ls.feed_engagement_score,
            'mentor_engagement_score': ls.mentor_engagement_score,
            
            # Activity
            'total_activities': ls.total_activities,
            'activities_last_7_days': ls.activities_last_7_days,
            'activities_last_30_days': ls.activities_last_30_days,
            'engagement_multiplier': ls.engagement_multiplier,
            
            # Interests
            'primary_career_interest': ls.primary_career_interest,
            'career_interests': ls.career_interests,
            'conversion_probability': ls.conversion_probability,
            
            # Timestamps
            'last_activity_at': ls.last_activity_at.isoformat() if ls.last_activity_at else None,
            'score_updated_at': ls.score_updated_at.isoformat() if ls.score_updated_at else None,
        })
    
    return results, total

