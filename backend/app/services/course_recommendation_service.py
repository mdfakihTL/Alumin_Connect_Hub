"""
Course Recommendation Service
AI-powered course recommendations based on lead behavior and profile
"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from collections import defaultdict
import random
import math

from app.models.user import User, UserProfile, UserRole
from app.models.university import University
from app.models.course import (
    Course, CourseLevel, CourseCategory, 
    AdCourseMapping, LeadCourseInterest, CourseConversion
)
from app.models.lead_intelligence import (
    LeadActivity, LeadScore, AdClick, AdImpression,
    CareerRoadmapRequest, CareerRoadmapView, MentorConnect,
    EventType, LeadCategory
)
from app.models.ad import Ad

logger = logging.getLogger(__name__)


# =============================================================================
# COURSE RECOMMENDATION MODEL
# =============================================================================

# Feature weights for course recommendation
RECOMMENDATION_WEIGHTS = {
    # Ad interaction signals (strong purchase intent)
    'ad_click': 15,
    'ad_view': 3,
    'repeated_ad_view': 8,  # Seeing same ad multiple times
    
    # Career alignment signals
    'career_goal_match': 25,
    'industry_match': 15,
    'experience_match': 20,
    
    # Level appropriateness
    'level_match': 20,  # UG for early career, PG for experienced
    
    # Engagement recency
    'recency_boost': 10,  # Recent interactions weighted more
}

# Career goal to course category mapping
CAREER_COURSE_MAPPING = {
    # Tech careers
    'tech lead': [CourseCategory.TECHNOLOGY.value, CourseCategory.MANAGEMENT.value],
    'software engineer': [CourseCategory.TECHNOLOGY.value, CourseCategory.ENGINEERING.value],
    'data scientist': [CourseCategory.DATA_SCIENCE.value, CourseCategory.TECHNOLOGY.value],
    'machine learning': [CourseCategory.DATA_SCIENCE.value, CourseCategory.TECHNOLOGY.value],
    'ai engineer': [CourseCategory.DATA_SCIENCE.value, CourseCategory.TECHNOLOGY.value],
    'devops': [CourseCategory.TECHNOLOGY.value, CourseCategory.ENGINEERING.value],
    'cloud architect': [CourseCategory.TECHNOLOGY.value, CourseCategory.ENGINEERING.value],
    
    # Business/Management careers
    'product manager': [CourseCategory.BUSINESS.value, CourseCategory.MANAGEMENT.value],
    'project manager': [CourseCategory.MANAGEMENT.value, CourseCategory.BUSINESS.value],
    'business analyst': [CourseCategory.BUSINESS.value, CourseCategory.DATA_SCIENCE.value],
    'consultant': [CourseCategory.BUSINESS.value, CourseCategory.MANAGEMENT.value],
    'mba': [CourseCategory.BUSINESS.value, CourseCategory.MANAGEMENT.value],
    'startup founder': [CourseCategory.BUSINESS.value, CourseCategory.MANAGEMENT.value],
    'entrepreneur': [CourseCategory.BUSINESS.value, CourseCategory.MANAGEMENT.value],
    
    # Leadership careers
    'vp engineering': [CourseCategory.MANAGEMENT.value, CourseCategory.TECHNOLOGY.value],
    'cto': [CourseCategory.TECHNOLOGY.value, CourseCategory.MANAGEMENT.value],
    'ceo': [CourseCategory.MANAGEMENT.value, CourseCategory.BUSINESS.value],
    'director': [CourseCategory.MANAGEMENT.value, CourseCategory.BUSINESS.value],
    
    # Finance careers
    'finance': [CourseCategory.FINANCE.value, CourseCategory.BUSINESS.value],
    'investment banker': [CourseCategory.FINANCE.value, CourseCategory.BUSINESS.value],
    'financial analyst': [CourseCategory.FINANCE.value, CourseCategory.DATA_SCIENCE.value],
    
    # Marketing careers
    'marketing manager': [CourseCategory.MARKETING.value, CourseCategory.BUSINESS.value],
    'digital marketing': [CourseCategory.MARKETING.value, CourseCategory.TECHNOLOGY.value],
    'brand manager': [CourseCategory.MARKETING.value, CourseCategory.BUSINESS.value],
    
    # Design careers
    'ux designer': [CourseCategory.DESIGN.value, CourseCategory.TECHNOLOGY.value],
    'product designer': [CourseCategory.DESIGN.value, CourseCategory.TECHNOLOGY.value],
    
    # Healthcare
    'healthcare': [CourseCategory.HEALTHCARE.value, CourseCategory.MANAGEMENT.value],
}


def get_course_level_for_user(years_experience: int, graduation_year: Optional[int] = None) -> str:
    """
    Determine appropriate course level based on user profile.
    """
    current_year = datetime.now().year
    years_since_grad = current_year - graduation_year if graduation_year else years_experience
    
    if years_experience <= 2 or years_since_grad <= 2:
        return CourseLevel.UG.value  # Early career - UG courses
    elif years_experience <= 5:
        return CourseLevel.PG.value  # Mid-career - PG courses
    elif years_experience <= 10:
        return CourseLevel.EXECUTIVE.value  # Senior - Executive programs
    else:
        return CourseLevel.EXECUTIVE.value  # Very senior - Executive programs


def calculate_course_match_score(
    user: User,
    profile: Optional[UserProfile],
    lead_score: Optional[LeadScore],
    course: Course,
    ad_interactions: Dict[str, int]
) -> Tuple[float, str]:
    """
    Calculate how well a course matches a user's profile and behavior.
    Returns (score, reason).
    """
    score = 0.0
    reasons = []
    
    # 1. Ad interaction score
    course_ad_clicks = ad_interactions.get(f'clicks_{course.id}', 0)
    course_ad_views = ad_interactions.get(f'views_{course.id}', 0)
    
    if course_ad_clicks > 0:
        score += RECOMMENDATION_WEIGHTS['ad_click'] * min(course_ad_clicks, 5)
        reasons.append(f"Clicked ads {course_ad_clicks}x")
    
    if course_ad_views > 3:
        score += RECOMMENDATION_WEIGHTS['repeated_ad_view']
        reasons.append("Showed repeated interest")
    elif course_ad_views > 0:
        score += RECOMMENDATION_WEIGHTS['ad_view'] * min(course_ad_views, 5)
    
    # 2. Career goal alignment
    if lead_score and lead_score.career_interests:
        for career in lead_score.career_interests:
            career_lower = career.lower()
            target_categories = []
            
            for goal_key, categories in CAREER_COURSE_MAPPING.items():
                if goal_key in career_lower:
                    target_categories.extend(categories)
            
            if course.category in target_categories:
                score += RECOMMENDATION_WEIGHTS['career_goal_match']
                reasons.append(f"Aligns with '{career}' goal")
                break
    
    # 3. Experience level match
    years_exp = 0
    if profile and profile.experience:
        try:
            # Extract years from experience string
            years_exp = int(''.join(filter(str.isdigit, str(profile.experience)[:2])) or 0)
        except:
            years_exp = 5  # Default assumption
    
    recommended_level = get_course_level_for_user(years_exp, user.graduation_year)
    
    if course.level == recommended_level:
        score += RECOMMENDATION_WEIGHTS['level_match']
        reasons.append(f"Perfect for {years_exp}+ years experience")
    elif (course.level == CourseLevel.PG.value and recommended_level == CourseLevel.EXECUTIVE.value) or \
         (course.level == CourseLevel.EXECUTIVE.value and recommended_level == CourseLevel.PG.value):
        score += RECOMMENDATION_WEIGHTS['level_match'] * 0.7  # Partial match
    
    # 4. Experience range match
    if course.target_experience_min <= years_exp <= course.target_experience_max:
        score += RECOMMENDATION_WEIGHTS['experience_match']
        reasons.append("Experience level matches")
    
    # 5. Recency boost (if recent ad interactions)
    if course_ad_clicks > 0 or course_ad_views > 0:
        score += RECOMMENDATION_WEIGHTS['recency_boost']
    
    # 6. Course quality boost
    if course.avg_rating >= 4.5:
        score += 5
    if course.conversion_rate > 0.1:
        score += 5
    
    # Normalize to 0-100
    max_possible = sum(RECOMMENDATION_WEIGHTS.values()) + 10
    normalized_score = min(100, (score / max_possible) * 100)
    
    # Generate reason string
    reason = ", ".join(reasons[:2]) if reasons else "Based on your profile"
    
    return normalized_score, reason


def predict_purchase_probability(
    interest_score: float,
    ad_clicks: int,
    lead_category: str,
    days_since_last_interaction: int
) -> float:
    """
    Predict probability of course purchase using a simple model.
    """
    # Base probability from interest score
    base_prob = interest_score / 100 * 0.4
    
    # Ad click boost (strong signal)
    click_boost = min(0.3, ad_clicks * 0.06)
    
    # Lead category modifier
    category_modifier = {
        LeadCategory.HOT.value: 1.5,
        LeadCategory.WARM.value: 1.0,
        LeadCategory.COLD.value: 0.5,
    }.get(lead_category, 1.0)
    
    # Recency decay (probability decreases with time)
    recency_factor = max(0.5, 1.0 - (days_since_last_interaction / 60))
    
    probability = (base_prob + click_boost) * category_modifier * recency_factor
    
    return min(0.95, max(0.01, probability))


def get_course_recommendations_for_user(
    db: Session,
    user_id: str,
    limit: int = 5,
    level_filter: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get personalized course recommendations for a user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []
    
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    lead_score = db.query(LeadScore).filter(LeadScore.user_id == user_id).first()
    
    # Get all active courses
    course_query = db.query(Course).filter(Course.is_active == True)
    if level_filter:
        course_query = course_query.filter(Course.level == level_filter)
    courses = course_query.all()
    
    # Get user's ad interactions mapped to courses
    ad_interactions = get_user_ad_course_interactions(db, user_id)
    
    # Calculate scores for each course
    recommendations = []
    for course in courses:
        match_score, reason = calculate_course_match_score(
            user, profile, lead_score, course, ad_interactions
        )
        
        # Get specific ad interactions for this course
        course_clicks = ad_interactions.get(f'clicks_{course.id}', 0)
        course_views = ad_interactions.get(f'views_{course.id}', 0)
        
        # Calculate purchase probability
        days_since_interaction = 7  # Default
        if lead_score and lead_score.last_activity_at:
            days_since_interaction = (datetime.utcnow() - lead_score.last_activity_at).days
        
        purchase_prob = predict_purchase_probability(
            match_score,
            course_clicks,
            lead_score.lead_category if lead_score else LeadCategory.COLD.value,
            days_since_interaction
        )
        
        recommendations.append({
            'course_id': course.id,
            'course_name': course.name,
            'course_level': course.level,
            'course_category': course.category,
            'provider': course.provider_name,
            'price': course.price,
            'duration_months': course.duration_months,
            'format': course.format,
            'interest_score': round(match_score, 2),
            'purchase_probability': round(purchase_prob, 3),
            'recommendation_reason': reason,
            'ad_clicks': course_clicks,
            'ad_views': course_views,
            'is_featured': course.is_featured,
        })
    
    # Sort by interest score and return top N
    recommendations.sort(key=lambda x: (x['purchase_probability'], x['interest_score']), reverse=True)
    
    # Add rank
    for i, rec in enumerate(recommendations[:limit]):
        rec['rank'] = i + 1
    
    return recommendations[:limit]


def get_user_ad_course_interactions(db: Session, user_id: str) -> Dict[str, int]:
    """
    Get user's ad interactions mapped to courses.
    """
    interactions = {}
    
    # Get ad clicks
    clicks = db.query(AdClick).filter(AdClick.user_id == user_id).all()
    for click in clicks:
        # Get courses linked to this ad
        mappings = db.query(AdCourseMapping).filter(AdCourseMapping.ad_id == click.ad_id).all()
        for mapping in mappings:
            key = f'clicks_{mapping.course_id}'
            interactions[key] = interactions.get(key, 0) + 1
    
    # Get ad impressions
    impressions = db.query(AdImpression).filter(AdImpression.user_id == user_id).all()
    for imp in impressions:
        mappings = db.query(AdCourseMapping).filter(AdCourseMapping.ad_id == imp.ad_id).all()
        for mapping in mappings:
            key = f'views_{mapping.course_id}'
            interactions[key] = interactions.get(key, 0) + 1
    
    return interactions


def update_lead_course_interests(db: Session, user_id: str):
    """
    Update LeadCourseInterest records for a user based on their behavior.
    """
    recommendations = get_course_recommendations_for_user(db, user_id, limit=20)
    
    for rec in recommendations:
        # Get or create interest record
        interest = db.query(LeadCourseInterest).filter(
            LeadCourseInterest.user_id == user_id,
            LeadCourseInterest.course_id == rec['course_id']
        ).first()
        
        if not interest:
            interest = LeadCourseInterest(
                user_id=user_id,
                course_id=rec['course_id'],
                first_interaction_at=datetime.utcnow()
            )
            db.add(interest)
        
        interest.ad_clicks = rec['ad_clicks']
        interest.ad_views = rec['ad_views']
        interest.interest_score = rec['interest_score']
        interest.purchase_probability = rec['purchase_probability']
        interest.recommendation_rank = rec['rank']
        interest.recommendation_reason = rec['recommendation_reason']
        interest.last_interaction_at = datetime.utcnow()
    
    db.commit()


# =============================================================================
# ANALYTICS & INSIGHTS
# =============================================================================

def get_course_analytics(
    db: Session,
    university_id: Optional[str] = None,
    level_filter: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get comprehensive course analytics.
    """
    # Get courses
    course_query = db.query(Course).filter(Course.is_active == True)
    if level_filter:
        course_query = course_query.filter(Course.level == level_filter)
    courses = course_query.all()
    
    # Group by level
    by_level = defaultdict(list)
    for course in courses:
        by_level[course.level].append(course)
    
    # Calculate metrics per level
    level_metrics = {}
    for level, level_courses in by_level.items():
        # Get total interest and conversions for these courses
        course_ids = [c.id for c in level_courses]
        
        interests = db.query(LeadCourseInterest).filter(
            LeadCourseInterest.course_id.in_(course_ids)
        ).all()
        
        conversions = db.query(CourseConversion).filter(
            CourseConversion.course_id.in_(course_ids)
        ).all()
        
        total_interested = len(set(i.user_id for i in interests if i.interest_score >= 50))
        total_conversions = len(conversions)
        total_revenue = sum(c.revenue for c in conversions)
        
        level_metrics[level] = {
            'course_count': len(level_courses),
            'interested_leads': total_interested,
            'conversions': total_conversions,
            'revenue': total_revenue,
            'conversion_rate': (total_conversions / total_interested * 100) if total_interested > 0 else 0,
        }
    
    # Top courses by interest
    top_courses = []
    for course in courses:
        interest_count = db.query(LeadCourseInterest).filter(
            LeadCourseInterest.course_id == course.id,
            LeadCourseInterest.interest_score >= 40
        ).count()
        
        top_courses.append({
            'id': course.id,
            'name': course.name,
            'level': course.level,
            'category': course.category,
            'interested_leads': interest_count,
            'price': course.price,
            'conversion_rate': course.conversion_rate,
        })
    
    top_courses.sort(key=lambda x: x['interested_leads'], reverse=True)
    
    return {
        'by_level': level_metrics,
        'top_courses': top_courses[:10],
        'total_courses': len(courses),
    }


def get_ad_course_performance(db: Session) -> List[Dict[str, Any]]:
    """
    Get performance metrics for ads linked to courses.
    """
    results = []
    
    # Get all ad-course mappings
    mappings = db.query(AdCourseMapping).all()
    
    for mapping in mappings:
        ad = mapping.ad
        course = mapping.course
        
        if not ad or not course:
            continue
        
        # Count clicks and impressions for this ad
        clicks = db.query(AdClick).filter(AdClick.ad_id == ad.id).count()
        impressions = db.query(AdImpression).filter(AdImpression.ad_id == ad.id).count()
        
        # Count conversions from this ad to this course
        conversions = db.query(CourseConversion).filter(
            CourseConversion.source_ad_id == ad.id,
            CourseConversion.course_id == course.id
        ).count()
        
        ctr = (clicks / impressions * 100) if impressions > 0 else 0
        conversion_rate = (conversions / clicks * 100) if clicks > 0 else 0
        
        results.append({
            'ad_id': ad.id,
            'ad_title': ad.title,
            'course_id': course.id,
            'course_name': course.name,
            'course_level': course.level,
            'impressions': impressions,
            'clicks': clicks,
            'ctr': round(ctr, 2),
            'conversions': conversions,
            'conversion_rate': round(conversion_rate, 2),
        })
    
    results.sort(key=lambda x: x['conversions'], reverse=True)
    return results


def get_leads_by_course_interest(
    db: Session,
    course_id: Optional[str] = None,
    level: Optional[str] = None,
    min_score: float = 50,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Get leads filtered by course interest.
    """
    query = db.query(LeadCourseInterest).filter(
        LeadCourseInterest.interest_score >= min_score
    )
    
    if course_id:
        query = query.filter(LeadCourseInterest.course_id == course_id)
    
    if level:
        # Join with courses to filter by level
        query = query.join(Course).filter(Course.level == level)
    
    interests = query.order_by(LeadCourseInterest.purchase_probability.desc()).limit(limit).all()
    
    results = []
    for interest in interests:
        user = db.query(User).filter(User.id == interest.user_id).first()
        profile = db.query(UserProfile).filter(UserProfile.user_id == interest.user_id).first()
        lead_score = db.query(LeadScore).filter(LeadScore.user_id == interest.user_id).first()
        course = db.query(Course).filter(Course.id == interest.course_id).first()
        
        if not user or not course:
            continue
        
        results.append({
            'user_id': user.id,
            'user_name': user.name,
            'user_email': user.email,
            'graduation_year': user.graduation_year,
            'job_title': profile.job_title if profile else None,
            'company': profile.company if profile else None,
            
            'course_id': course.id,
            'course_name': course.name,
            'course_level': course.level,
            
            'interest_score': interest.interest_score,
            'purchase_probability': interest.purchase_probability,
            'recommendation_reason': interest.recommendation_reason,
            'ad_clicks': interest.ad_clicks,
            'ad_views': interest.ad_views,
            
            'lead_category': lead_score.lead_category if lead_score else 'cold',
            'overall_lead_score': lead_score.overall_score if lead_score else 0,
            
            'has_contacted': interest.has_contacted,
            'has_enrolled': interest.has_enrolled,
        })
    
    return results


# =============================================================================
# SEED DATA GENERATION
# =============================================================================

def generate_seed_courses(db: Session) -> List[Course]:
    """
    Generate comprehensive seed courses for UG and PG programs.
    """
    courses_data = [
        # ========== UNDERGRADUATE (UG) COURSES ==========
        {
            'name': 'Bachelor of Technology in Computer Science',
            'short_name': 'B.Tech CS',
            'level': CourseLevel.UG.value,
            'category': CourseCategory.TECHNOLOGY.value,
            'target_experience_min': 0,
            'target_experience_max': 3,
            'target_career_goals': ['software engineer', 'developer', 'tech lead'],
            'price': 45000,
            'duration_months': 48,
            'provider_name': 'MIT',
            'format': 'offline',
            'is_featured': True,
        },
        {
            'name': 'Bachelor of Business Administration',
            'short_name': 'BBA',
            'level': CourseLevel.UG.value,
            'category': CourseCategory.BUSINESS.value,
            'target_experience_min': 0,
            'target_experience_max': 3,
            'target_career_goals': ['business analyst', 'consultant', 'manager'],
            'price': 35000,
            'duration_months': 36,
            'provider_name': 'Harvard Business School',
            'format': 'offline',
        },
        {
            'name': 'Bachelor of Science in Data Science',
            'short_name': 'B.Sc Data Science',
            'level': CourseLevel.UG.value,
            'category': CourseCategory.DATA_SCIENCE.value,
            'target_experience_min': 0,
            'target_experience_max': 3,
            'target_career_goals': ['data scientist', 'data analyst', 'ml engineer'],
            'price': 40000,
            'duration_months': 48,
            'provider_name': 'Stanford University',
            'format': 'hybrid',
        },
        {
            'name': 'Bachelor of Commerce with Finance',
            'short_name': 'B.Com Finance',
            'level': CourseLevel.UG.value,
            'category': CourseCategory.FINANCE.value,
            'target_experience_min': 0,
            'target_experience_max': 3,
            'target_career_goals': ['financial analyst', 'accountant', 'investment banker'],
            'price': 30000,
            'duration_months': 36,
            'provider_name': 'Wharton School',
            'format': 'offline',
        },
        {
            'name': 'Bachelor of Design',
            'short_name': 'B.Des',
            'level': CourseLevel.UG.value,
            'category': CourseCategory.DESIGN.value,
            'target_experience_min': 0,
            'target_experience_max': 3,
            'target_career_goals': ['ux designer', 'product designer', 'creative director'],
            'price': 38000,
            'duration_months': 48,
            'provider_name': 'Rhode Island School of Design',
            'format': 'offline',
        },
        
        # ========== POSTGRADUATE (PG) COURSES ==========
        {
            'name': 'Master of Business Administration',
            'short_name': 'MBA',
            'level': CourseLevel.PG.value,
            'category': CourseCategory.MANAGEMENT.value,
            'target_experience_min': 3,
            'target_experience_max': 10,
            'target_career_goals': ['consultant', 'director', 'ceo', 'startup founder'],
            'price': 150000,
            'duration_months': 24,
            'provider_name': 'Harvard Business School',
            'format': 'offline',
            'is_featured': True,
        },
        {
            'name': 'Master of Science in Computer Science',
            'short_name': 'MS CS',
            'level': CourseLevel.PG.value,
            'category': CourseCategory.TECHNOLOGY.value,
            'target_experience_min': 2,
            'target_experience_max': 8,
            'target_career_goals': ['tech lead', 'architect', 'principal engineer'],
            'price': 80000,
            'duration_months': 24,
            'provider_name': 'Stanford University',
            'format': 'offline',
            'is_featured': True,
        },
        {
            'name': 'Master of Science in Data Science',
            'short_name': 'MS Data Science',
            'level': CourseLevel.PG.value,
            'category': CourseCategory.DATA_SCIENCE.value,
            'target_experience_min': 2,
            'target_experience_max': 8,
            'target_career_goals': ['data scientist', 'ml lead', 'chief data officer'],
            'price': 75000,
            'duration_months': 18,
            'provider_name': 'MIT',
            'format': 'hybrid',
            'is_featured': True,
        },
        {
            'name': 'Master of Finance',
            'short_name': 'MFin',
            'level': CourseLevel.PG.value,
            'category': CourseCategory.FINANCE.value,
            'target_experience_min': 3,
            'target_experience_max': 10,
            'target_career_goals': ['investment banker', 'portfolio manager', 'cfo'],
            'price': 120000,
            'duration_months': 18,
            'provider_name': 'Wharton School',
            'format': 'offline',
        },
        {
            'name': 'Master of Marketing',
            'short_name': 'MMkt',
            'level': CourseLevel.PG.value,
            'category': CourseCategory.MARKETING.value,
            'target_experience_min': 2,
            'target_experience_max': 8,
            'target_career_goals': ['marketing director', 'cmo', 'brand manager'],
            'price': 70000,
            'duration_months': 18,
            'provider_name': 'Kellogg School',
            'format': 'hybrid',
        },
        {
            'name': 'Master of Engineering Management',
            'short_name': 'MEM',
            'level': CourseLevel.PG.value,
            'category': CourseCategory.ENGINEERING.value,
            'target_experience_min': 3,
            'target_experience_max': 10,
            'target_career_goals': ['vp engineering', 'engineering director', 'cto'],
            'price': 85000,
            'duration_months': 18,
            'provider_name': 'Duke University',
            'format': 'hybrid',
        },
        {
            'name': 'Master of Healthcare Administration',
            'short_name': 'MHA',
            'level': CourseLevel.PG.value,
            'category': CourseCategory.HEALTHCARE.value,
            'target_experience_min': 3,
            'target_experience_max': 12,
            'target_career_goals': ['healthcare administrator', 'hospital ceo', 'healthcare consultant'],
            'price': 90000,
            'duration_months': 24,
            'provider_name': 'Johns Hopkins',
            'format': 'offline',
        },
        
        # ========== EXECUTIVE PROGRAMS ==========
        {
            'name': 'Executive MBA',
            'short_name': 'EMBA',
            'level': CourseLevel.EXECUTIVE.value,
            'category': CourseCategory.MANAGEMENT.value,
            'target_experience_min': 8,
            'target_experience_max': 25,
            'target_career_goals': ['c-suite', 'board member', 'ceo'],
            'price': 200000,
            'duration_months': 18,
            'provider_name': 'INSEAD',
            'format': 'hybrid',
            'is_featured': True,
        },
        {
            'name': 'Executive Leadership Program',
            'short_name': 'ELP',
            'level': CourseLevel.EXECUTIVE.value,
            'category': CourseCategory.MANAGEMENT.value,
            'target_experience_min': 10,
            'target_experience_max': 30,
            'target_career_goals': ['ceo', 'president', 'managing director'],
            'price': 50000,
            'duration_months': 6,
            'provider_name': 'Harvard Executive Education',
            'format': 'hybrid',
        },
        {
            'name': 'Chief Technology Officer Program',
            'short_name': 'CTO Program',
            'level': CourseLevel.EXECUTIVE.value,
            'category': CourseCategory.TECHNOLOGY.value,
            'target_experience_min': 10,
            'target_experience_max': 25,
            'target_career_goals': ['cto', 'vp engineering', 'tech advisor'],
            'price': 45000,
            'duration_months': 6,
            'provider_name': 'MIT Sloan',
            'format': 'hybrid',
        },
        
        # ========== CERTIFICATE PROGRAMS ==========
        {
            'name': 'Product Management Certificate',
            'short_name': 'PM Cert',
            'level': CourseLevel.CERTIFICATE.value,
            'category': CourseCategory.BUSINESS.value,
            'target_experience_min': 2,
            'target_experience_max': 12,
            'target_career_goals': ['product manager', 'product director', 'cpo'],
            'price': 8000,
            'duration_months': 3,
            'provider_name': 'Google',
            'format': 'online',
        },
        {
            'name': 'Machine Learning Specialization',
            'short_name': 'ML Cert',
            'level': CourseLevel.CERTIFICATE.value,
            'category': CourseCategory.DATA_SCIENCE.value,
            'target_experience_min': 1,
            'target_experience_max': 10,
            'target_career_goals': ['ml engineer', 'data scientist', 'ai researcher'],
            'price': 5000,
            'duration_months': 4,
            'provider_name': 'DeepLearning.AI',
            'format': 'online',
        },
        {
            'name': 'Cloud Architecture Certificate',
            'short_name': 'Cloud Cert',
            'level': CourseLevel.CERTIFICATE.value,
            'category': CourseCategory.TECHNOLOGY.value,
            'target_experience_min': 2,
            'target_experience_max': 12,
            'target_career_goals': ['cloud architect', 'devops engineer', 'solutions architect'],
            'price': 6000,
            'duration_months': 3,
            'provider_name': 'AWS',
            'format': 'online',
        },
        {
            'name': 'Digital Marketing Certificate',
            'short_name': 'DM Cert',
            'level': CourseLevel.CERTIFICATE.value,
            'category': CourseCategory.MARKETING.value,
            'target_experience_min': 0,
            'target_experience_max': 8,
            'target_career_goals': ['digital marketer', 'growth manager', 'marketing manager'],
            'price': 4000,
            'duration_months': 3,
            'provider_name': 'Google',
            'format': 'online',
        },
        {
            'name': 'UX Design Professional Certificate',
            'short_name': 'UX Cert',
            'level': CourseLevel.CERTIFICATE.value,
            'category': CourseCategory.DESIGN.value,
            'target_experience_min': 0,
            'target_experience_max': 8,
            'target_career_goals': ['ux designer', 'product designer', 'design lead'],
            'price': 3500,
            'duration_months': 6,
            'provider_name': 'Google',
            'format': 'online',
        },
    ]
    
    created_courses = []
    for data in courses_data:
        # Check if course already exists
        existing = db.query(Course).filter(Course.name == data['name']).first()
        if existing:
            continue
        
        course = Course(
            name=data['name'],
            short_name=data.get('short_name'),
            description=f"Comprehensive {data['level'].upper()} program in {data['category']}",
            level=data['level'],
            category=data['category'],
            target_experience_min=data['target_experience_min'],
            target_experience_max=data['target_experience_max'],
            target_career_goals=data.get('target_career_goals', []),
            price=data['price'],
            duration_months=data['duration_months'],
            provider_name=data.get('provider_name'),
            format=data.get('format', 'hybrid'),
            is_featured=data.get('is_featured', False),
            avg_rating=round(random.uniform(4.2, 4.9), 1),
            conversion_rate=round(random.uniform(0.05, 0.20), 3),
        )
        db.add(course)
        created_courses.append(course)
    
    db.commit()
    return created_courses


def generate_seed_ads_for_courses(db: Session):
    """
    Generate seed ads linked to courses.
    """
    courses = db.query(Course).filter(Course.is_active == True).all()
    
    ad_templates = [
        "{course} - Transform Your Career",
        "Enroll Now: {course}",
        "Limited Seats: {course}",
        "{level} Program: {course}",
        "Advance Your Career with {course}",
        "Top Ranked {course} Program",
        "{provider}'s {course}",
        "Start Your {category} Journey",
    ]
    
    for course in courses:
        # Create 1-2 ads per course
        num_ads = random.randint(1, 2)
        
        for i in range(num_ads):
            template = random.choice(ad_templates)
            ad_title = template.format(
                course=course.short_name or course.name,
                level=course.level.upper(),
                provider=course.provider_name or 'Top University',
                category=course.category.replace('_', ' ').title()
            )
            
            # Check if ad already exists
            existing = db.query(Ad).filter(Ad.title == ad_title).first()
            if existing:
                # Just create mapping if ad exists
                mapping_exists = db.query(AdCourseMapping).filter(
                    AdCourseMapping.ad_id == existing.id,
                    AdCourseMapping.course_id == course.id
                ).first()
                if not mapping_exists:
                    mapping = AdCourseMapping(
                        ad_id=existing.id,
                        course_id=course.id,
                        relevance_score=1.0,
                        is_primary=True
                    )
                    db.add(mapping)
                continue
            
            # Create new ad
            ad = Ad(
                title=ad_title,
                description=f"Enroll in {course.name} from {course.provider_name}. {course.duration_months} months. {course.format.title()} format.",
                target_url=f"https://example.com/courses/{course.id}",
                is_active=True,
            )
            db.add(ad)
            db.flush()
            
            # Create mapping
            mapping = AdCourseMapping(
                ad_id=ad.id,
                course_id=course.id,
                relevance_score=1.0,
                is_primary=True
            )
            db.add(mapping)
    
    db.commit()


def generate_seed_lead_interactions(db: Session, num_interactions: int = 1000):
    """
    Generate realistic lead interaction data.
    """
    users = db.query(User).filter(User.role == UserRole.ALUMNI, User.is_active == True).all()
    ads = db.query(Ad).filter(Ad.is_active == True).all()
    courses = db.query(Course).filter(Course.is_active == True).all()
    
    if not users or not ads:
        logger.warning("No users or ads found for seed data generation")
        return
    
    # Career goals for generating roadmap requests
    career_goals = [
        'Tech Lead', 'Product Manager', 'Data Scientist', 'Software Engineer',
        'VP Engineering', 'Startup Founder', 'Consultant', 'MBA',
        'Machine Learning Engineer', 'Cloud Architect', 'UX Designer',
        'Marketing Director', 'Financial Analyst', 'Healthcare Administrator'
    ]
    
    interactions_created = 0
    
    for _ in range(num_interactions):
        user = random.choice(users)
        
        # Determine user's likely course level based on graduation year
        current_year = datetime.now().year
        years_since_grad = current_year - (user.graduation_year or current_year - 5)
        
        if years_since_grad <= 3:
            preferred_level = CourseLevel.UG.value
        elif years_since_grad <= 8:
            preferred_level = CourseLevel.PG.value
        else:
            preferred_level = random.choice([CourseLevel.PG.value, CourseLevel.EXECUTIVE.value])
        
        # Filter ads/courses by preferred level
        level_courses = [c for c in courses if c.level == preferred_level]
        if not level_courses:
            level_courses = courses
        
        # Choose a course to be interested in
        interested_course = random.choice(level_courses)
        
        # Find ads for this course
        course_ads = db.query(Ad).join(AdCourseMapping).filter(
            AdCourseMapping.course_id == interested_course.id
        ).all()
        
        if not course_ads:
            course_ads = ads
        
        ad = random.choice(course_ads)
        
        # Generate interactions based on probability
        # More interactions = hotter lead
        
        # Ad impressions (everyone sees ads)
        num_impressions = random.randint(1, 10)
        for _ in range(num_impressions):
            days_ago = random.randint(0, 60)
            impression = AdImpression(
                user_id=user.id,
                ad_id=ad.id,
                university_id=user.university_id,
                viewed_at=datetime.utcnow() - timedelta(days=days_ago)
            )
            db.add(impression)
            interactions_created += 1
        
        # Ad clicks (30% click rate for interested users)
        if random.random() < 0.3:
            num_clicks = random.randint(1, 3)
            for _ in range(num_clicks):
                days_ago = random.randint(0, 45)
                click = AdClick(
                    user_id=user.id,
                    ad_id=ad.id,
                    university_id=user.university_id,
                    clicked_at=datetime.utcnow() - timedelta(days=days_ago)
                )
                db.add(click)
                interactions_created += 1
        
        # Career roadmap requests (40% of users)
        if random.random() < 0.4:
            goal = random.choice(career_goals)
            days_ago = random.randint(0, 90)
            request = CareerRoadmapRequest(
                user_id=user.id,
                university_id=user.university_id,
                career_goal=goal,
                target_position=goal,
                current_position='Current Role',
                requested_at=datetime.utcnow() - timedelta(days=days_ago)
            )
            db.add(request)
            interactions_created += 1
            
            # Roadmap views
            if random.random() < 0.7:
                for _ in range(random.randint(1, 5)):
                    view = CareerRoadmapView(
                        user_id=user.id,
                        career_goal=goal,
                        university_id=user.university_id,
                        roadmap_request_id=request.id,
                        viewed_at=datetime.utcnow() - timedelta(days=random.randint(0, 30))
                    )
                    db.add(view)
                    interactions_created += 1
        
        # Commit every 100 interactions
        if interactions_created % 100 == 0:
            db.commit()
    
    db.commit()
    logger.info(f"Generated {interactions_created} seed interactions")


def run_full_seed_data_generation(db: Session):
    """
    Run complete seed data generation for Lead Intelligence.
    """
    logger.info("Starting seed data generation...")
    
    # 1. Generate courses
    logger.info("Generating courses...")
    courses = generate_seed_courses(db)
    logger.info(f"Created {len(courses)} courses")
    
    # 2. Generate ads for courses
    logger.info("Generating ads...")
    generate_seed_ads_for_courses(db)
    
    # 3. Generate lead interactions
    logger.info("Generating lead interactions...")
    generate_seed_lead_interactions(db, num_interactions=2000)
    
    # 4. Calculate lead scores
    logger.info("Calculating lead scores...")
    from app.services.lead_intelligence_service import batch_update_lead_scores
    batch_update_lead_scores(db)
    
    # 5. Update course interests
    logger.info("Updating course interests...")
    users = db.query(User).filter(User.role == UserRole.ALUMNI).limit(100).all()
    for user in users:
        try:
            update_lead_course_interests(db, user.id)
        except Exception as e:
            logger.error(f"Failed to update interests for user {user.id}: {e}")
    
    logger.info("Seed data generation complete!")
    
    return {
        'courses_created': len(courses),
        'interactions_generated': 2000,
    }

