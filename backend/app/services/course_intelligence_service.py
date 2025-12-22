"""
Course Intelligence Service
Handles course lead scoring, predictions, and recommendations
"""
import logging
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from collections import defaultdict
import math

from app.models.user import User, UserProfile, UserRole
from app.models.university import University
from app.models.course_intelligence import (
    Course, CourseAd, CourseAdInteraction, CourseLead,
    CourseRecommendation, UserCourseProfile,
    CourseType, CourseCategory, LeadTemperature
)

logger = logging.getLogger(__name__)


# =============================================================================
# SEED DATA GENERATION
# =============================================================================

SEED_COURSES = [
    # PG Courses (Postgraduate)
    {
        "name": "Master of Business Administration (MBA)",
        "short_name": "MBA",
        "course_type": CourseType.PG.value,
        "category": CourseCategory.BUSINESS.value,
        "price": 45000,
        "duration_months": 24,
        "format": "hybrid",
        "min_experience_years": 2,
        "max_experience_years": 10,
        "target_education_level": "ug_graduate",
        "tags": ["leadership", "strategy", "management", "finance"]
    },
    {
        "name": "Master of Science in Data Science",
        "short_name": "MS Data Science",
        "course_type": CourseType.PG.value,
        "category": CourseCategory.DATA_SCIENCE.value,
        "price": 38000,
        "duration_months": 18,
        "format": "online",
        "min_experience_years": 0,
        "max_experience_years": 8,
        "target_education_level": "ug_graduate",
        "tags": ["machine learning", "AI", "analytics", "python"]
    },
    {
        "name": "Master of Science in Computer Science",
        "short_name": "MS CS",
        "course_type": CourseType.PG.value,
        "category": CourseCategory.TECHNOLOGY.value,
        "price": 42000,
        "duration_months": 24,
        "format": "hybrid",
        "min_experience_years": 0,
        "max_experience_years": 5,
        "target_education_level": "ug_graduate",
        "tags": ["software", "algorithms", "systems", "AI"]
    },
    {
        "name": "Master of Finance",
        "short_name": "MFin",
        "course_type": CourseType.PG.value,
        "category": CourseCategory.FINANCE.value,
        "price": 52000,
        "duration_months": 12,
        "format": "offline",
        "min_experience_years": 1,
        "max_experience_years": 8,
        "target_education_level": "ug_graduate",
        "tags": ["investment", "banking", "fintech", "risk"]
    },
    
    # UG Courses (Undergraduate pathway/bridge programs)
    {
        "name": "Bachelor's Completion Program - Business",
        "short_name": "BBA Completion",
        "course_type": CourseType.UG.value,
        "category": CourseCategory.BUSINESS.value,
        "price": 18000,
        "duration_months": 24,
        "format": "online",
        "min_experience_years": 0,
        "max_experience_years": 15,
        "target_education_level": "some_college",
        "tags": ["degree completion", "business", "management"]
    },
    {
        "name": "Bachelor's in Computer Science",
        "short_name": "BS CS",
        "course_type": CourseType.UG.value,
        "category": CourseCategory.TECHNOLOGY.value,
        "price": 22000,
        "duration_months": 36,
        "format": "online",
        "min_experience_years": 0,
        "max_experience_years": 10,
        "target_education_level": "high_school",
        "tags": ["programming", "software", "tech career"]
    },
    
    # Executive Education
    {
        "name": "Executive MBA",
        "short_name": "EMBA",
        "course_type": CourseType.EXECUTIVE.value,
        "category": CourseCategory.MANAGEMENT.value,
        "price": 85000,
        "duration_months": 18,
        "format": "hybrid",
        "min_experience_years": 8,
        "max_experience_years": 25,
        "target_education_level": "any",
        "tags": ["C-suite", "leadership", "strategy", "executive"]
    },
    {
        "name": "Senior Leadership Program",
        "short_name": "SLP",
        "course_type": CourseType.EXECUTIVE.value,
        "category": CourseCategory.MANAGEMENT.value,
        "price": 35000,
        "duration_months": 6,
        "format": "hybrid",
        "min_experience_years": 10,
        "max_experience_years": 30,
        "target_education_level": "any",
        "tags": ["leadership", "executive", "management"]
    },
    {
        "name": "Digital Transformation Leadership",
        "short_name": "DTL",
        "course_type": CourseType.EXECUTIVE.value,
        "category": CourseCategory.TECHNOLOGY.value,
        "price": 28000,
        "duration_months": 4,
        "format": "online",
        "min_experience_years": 5,
        "max_experience_years": 20,
        "target_education_level": "any",
        "tags": ["digital", "transformation", "technology", "leadership"]
    },
    
    # Certificate Programs
    {
        "name": "Professional Certificate in Machine Learning",
        "short_name": "ML Certificate",
        "course_type": CourseType.CERTIFICATE.value,
        "category": CourseCategory.DATA_SCIENCE.value,
        "price": 4500,
        "duration_months": 6,
        "format": "online",
        "min_experience_years": 0,
        "max_experience_years": 15,
        "target_education_level": "any",
        "tags": ["ML", "AI", "python", "deep learning"]
    },
    {
        "name": "Product Management Certificate",
        "short_name": "PM Certificate",
        "course_type": CourseType.CERTIFICATE.value,
        "category": CourseCategory.BUSINESS.value,
        "price": 3500,
        "duration_months": 4,
        "format": "online",
        "min_experience_years": 1,
        "max_experience_years": 12,
        "target_education_level": "any",
        "tags": ["product", "agile", "strategy", "tech"]
    },
    {
        "name": "Digital Marketing Professional Certificate",
        "short_name": "Digital Marketing Cert",
        "course_type": CourseType.CERTIFICATE.value,
        "category": CourseCategory.MARKETING.value,
        "price": 2800,
        "duration_months": 3,
        "format": "online",
        "min_experience_years": 0,
        "max_experience_years": 10,
        "target_education_level": "any",
        "tags": ["marketing", "digital", "SEO", "social media"]
    },
    {
        "name": "Cloud Architecture Certificate",
        "short_name": "Cloud Cert",
        "course_type": CourseType.CERTIFICATE.value,
        "category": CourseCategory.TECHNOLOGY.value,
        "price": 3200,
        "duration_months": 4,
        "format": "online",
        "min_experience_years": 2,
        "max_experience_years": 15,
        "target_education_level": "any",
        "tags": ["AWS", "Azure", "cloud", "DevOps"]
    },
    
    # Bootcamps
    {
        "name": "Full Stack Web Development Bootcamp",
        "short_name": "Web Dev Bootcamp",
        "course_type": CourseType.BOOTCAMP.value,
        "category": CourseCategory.TECHNOLOGY.value,
        "price": 12000,
        "duration_months": 3,
        "format": "online",
        "min_experience_years": 0,
        "max_experience_years": 5,
        "target_education_level": "any",
        "tags": ["coding", "javascript", "react", "node"]
    },
    {
        "name": "Data Analytics Bootcamp",
        "short_name": "Data Bootcamp",
        "course_type": CourseType.BOOTCAMP.value,
        "category": CourseCategory.DATA_SCIENCE.value,
        "price": 9500,
        "duration_months": 3,
        "format": "online",
        "min_experience_years": 0,
        "max_experience_years": 8,
        "target_education_level": "any",
        "tags": ["SQL", "Python", "Tableau", "analytics"]
    },
    {
        "name": "UX/UI Design Bootcamp",
        "short_name": "UX Bootcamp",
        "course_type": CourseType.BOOTCAMP.value,
        "category": CourseCategory.DESIGN.value,
        "price": 8500,
        "duration_months": 3,
        "format": "online",
        "min_experience_years": 0,
        "max_experience_years": 10,
        "target_education_level": "any",
        "tags": ["design", "Figma", "user research", "prototyping"]
    },
]

SEED_COURSE_ADS = [
    # MBA Ads
    {
        "course_short_name": "MBA",
        "headline": "Transform Your Career with an MBA",
        "description": "Join 95% of our graduates who received promotions within 2 years. Flexible hybrid format for working professionals.",
        "cta_text": "Apply Now",
        "target_career_interests": ["management", "leadership", "strategy", "consulting"]
    },
    {
        "course_short_name": "MBA",
        "headline": "MBA: Your Path to the C-Suite",
        "description": "Average salary increase of 45% post-MBA. Network with 10,000+ alumni leaders.",
        "cta_text": "Download Brochure",
        "target_career_interests": ["executive", "director", "vp", "c-suite"]
    },
    
    # Data Science Ads
    {
        "course_short_name": "MS Data Science",
        "headline": "Become a Data Scientist in 18 Months",
        "description": "Learn from industry experts at Google, Meta & Amazon. 100% online, work at your own pace.",
        "cta_text": "Start Free Trial",
        "target_career_interests": ["data scientist", "ML engineer", "analytics", "AI"]
    },
    {
        "course_short_name": "ML Certificate",
        "headline": "Master Machine Learning in 6 Months",
        "description": "Hands-on projects with real datasets. Certificate recognized by top tech companies.",
        "cta_text": "Enroll Today",
        "target_career_interests": ["AI", "machine learning", "deep learning", "data science"]
    },
    
    # Executive Ads
    {
        "course_short_name": "EMBA",
        "headline": "Executive MBA for Senior Leaders",
        "description": "For professionals with 8+ years experience. Global residencies in Singapore, London & New York.",
        "cta_text": "Request Info",
        "target_career_interests": ["CEO", "CFO", "CTO", "executive", "director"]
    },
    {
        "course_short_name": "SLP",
        "headline": "Elevate Your Leadership Impact",
        "description": "6-month intensive program for VPs and Directors. Transform how you lead.",
        "cta_text": "Apply Now",
        "target_career_interests": ["VP", "director", "senior manager", "leadership"]
    },
    
    # Tech Bootcamp Ads
    {
        "course_short_name": "Web Dev Bootcamp",
        "headline": "Learn to Code in 12 Weeks",
        "description": "Career change? Start your tech journey. 90% job placement rate.",
        "cta_text": "Get Started",
        "target_career_interests": ["software engineer", "developer", "tech", "career change"]
    },
    {
        "course_short_name": "Cloud Cert",
        "headline": "Get AWS/Azure Certified",
        "description": "Most in-demand cloud skills. 40% salary boost on average.",
        "cta_text": "Start Learning",
        "target_career_interests": ["cloud", "DevOps", "infrastructure", "backend"]
    },
    
    # PM & Marketing
    {
        "course_short_name": "PM Certificate",
        "headline": "Break into Product Management",
        "description": "Learn from PMs at Airbnb, Stripe & Notion. Build your portfolio.",
        "cta_text": "Join Now",
        "target_career_interests": ["product manager", "PM", "product", "tech"]
    },
    {
        "course_short_name": "Digital Marketing Cert",
        "headline": "Master Digital Marketing",
        "description": "SEO, Social Media, Analytics - get certified in all channels.",
        "cta_text": "Start Free",
        "target_career_interests": ["marketing", "growth", "social media", "SEO"]
    },
]


def generate_seed_data(db: Session) -> Dict[str, int]:
    """
    Generate comprehensive seed data for course intelligence.
    Returns counts of created records.
    """
    counts = {
        "courses": 0,
        "course_ads": 0,
        "interactions": 0,
        "leads": 0,
        "recommendations": 0,
        "user_profiles": 0,
    }
    
    # Get existing universities
    universities = db.query(University).filter(University.is_enabled == True).all()
    if not universities:
        logger.warning("No universities found. Creating default ones.")
        universities = _create_default_universities(db)
    
    # Create courses
    courses = {}
    for course_data in SEED_COURSES:
        existing = db.query(Course).filter(Course.short_name == course_data["short_name"]).first()
        if existing:
            courses[course_data["short_name"]] = existing
            continue
            
        course = Course(
            name=course_data["name"],
            short_name=course_data["short_name"],
            description=f"Comprehensive {course_data['name']} program designed for career advancement.",
            course_type=course_data["course_type"],
            category=course_data["category"],
            price=course_data["price"],
            duration_months=course_data["duration_months"],
            format=course_data["format"],
            min_experience_years=course_data["min_experience_years"],
            max_experience_years=course_data["max_experience_years"],
            target_education_level=course_data.get("target_education_level"),
            tags=course_data.get("tags", []),
            university_id=random.choice(universities).id if universities else None,
        )
        db.add(course)
        courses[course_data["short_name"]] = course
        counts["courses"] += 1
    
    db.commit()
    
    # Create course ads
    course_ads = []
    for ad_data in SEED_COURSE_ADS:
        course = courses.get(ad_data["course_short_name"])
        if not course:
            continue
            
        existing = db.query(CourseAd).filter(
            CourseAd.course_id == course.id,
            CourseAd.headline == ad_data["headline"]
        ).first()
        if existing:
            course_ads.append(existing)
            continue
            
        course_ad = CourseAd(
            course_id=course.id,
            headline=ad_data["headline"],
            description=ad_data["description"],
            cta_text=ad_data["cta_text"],
            target_universities=[u.id for u in universities],
            target_career_interests=ad_data.get("target_career_interests", []),
            daily_budget=random.uniform(50, 500),
            is_active=True,
        )
        db.add(course_ad)
        course_ads.append(course_ad)
        counts["course_ads"] += 1
    
    db.commit()
    
    # Get alumni users
    alumni = db.query(User).filter(
        User.role == UserRole.ALUMNI,
        User.is_active == True
    ).limit(200).all()
    
    if not alumni:
        logger.warning("No alumni found for seed data generation")
        return counts
    
    # Generate interactions, leads, and recommendations for each alumnus
    for user in alumni:
        # Create/update user course profile
        profile = _create_user_course_profile(db, user)
        counts["user_profiles"] += 1
        
        # Generate ad interactions
        num_interactions = random.randint(5, 30)
        for _ in range(num_interactions):
            if not course_ads:
                break
            ad = random.choice(course_ads)
            interaction = _create_ad_interaction(db, user, ad, profile)
            if interaction:
                counts["interactions"] += 1
        
        # Generate course leads
        relevant_courses = _get_relevant_courses(db, profile, list(courses.values()))
        for course in relevant_courses[:5]:  # Top 5 courses per user
            lead = _create_course_lead(db, user, course, profile)
            if lead:
                counts["leads"] += 1
        
        # Generate recommendations
        recommendations = _generate_recommendations(db, user, profile, list(courses.values()))
        counts["recommendations"] += len(recommendations)
    
    db.commit()
    
    logger.info(f"Seed data generated: {counts}")
    return counts


def _create_default_universities(db: Session) -> List[University]:
    """Create default universities if none exist."""
    default_unis = [
        {"name": "Massachusetts Institute of Technology", "is_enabled": True},
        {"name": "Stanford University", "is_enabled": True},
        {"name": "Harvard University", "is_enabled": True},
    ]
    
    universities = []
    for uni_data in default_unis:
        uni = University(**uni_data)
        db.add(uni)
        universities.append(uni)
    
    db.commit()
    return universities


def _create_user_course_profile(db: Session, user: User) -> UserCourseProfile:
    """Create or update user course profile."""
    profile = db.query(UserCourseProfile).filter(UserCourseProfile.user_id == user.id).first()
    
    if not profile:
        profile = UserCourseProfile(user_id=user.id, university_id=user.university_id)
        db.add(profile)
    
    # Infer education level from graduation year
    current_year = datetime.now().year
    years_since_grad = current_year - (user.graduation_year or current_year)
    
    # Randomly assign education level (in real system, this comes from user data)
    education_level = random.choice(["ug", "pg"]) if random.random() > 0.3 else "ug"
    
    # Get user profile for career info
    user_profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    
    # Update profile
    profile.education_level = education_level
    profile.graduation_year = user.graduation_year
    profile.years_since_graduation = max(0, years_since_grad)
    profile.major = user.major
    profile.current_role = user_profile.job_title if user_profile else None
    profile.current_company = user_profile.company if user_profile else None
    profile.years_of_experience = max(0, years_since_grad - random.randint(0, 2))
    
    # Infer career goals based on current role
    career_goals = _infer_career_goals(profile.current_role, profile.years_of_experience)
    profile.career_goals = career_goals
    
    # Infer preferred course types based on education and experience
    profile.preferred_course_types = _infer_preferred_course_types(
        education_level, profile.years_of_experience
    )
    
    # Infer categories based on major and role
    profile.preferred_categories = _infer_preferred_categories(
        user.major, profile.current_role
    )
    
    # Engagement score
    profile.engagement_score = random.uniform(20, 90)
    profile.conversion_readiness = random.uniform(0.1, 0.8)
    
    return profile


def _infer_career_goals(current_role: Optional[str], experience: int) -> List[str]:
    """Infer career goals based on current role and experience."""
    goals = []
    
    role_lower = (current_role or "").lower()
    
    if experience < 3:
        goals = ["senior engineer", "team lead", "specialist"]
    elif experience < 7:
        goals = ["manager", "senior manager", "director", "tech lead"]
    elif experience < 12:
        goals = ["director", "VP", "head of department", "partner"]
    else:
        goals = ["VP", "C-suite", "executive", "board member"]
    
    # Add role-specific goals
    if "engineer" in role_lower or "developer" in role_lower:
        goals.extend(["principal engineer", "tech lead", "CTO"])
    elif "product" in role_lower:
        goals.extend(["head of product", "CPO", "VP Product"])
    elif "data" in role_lower:
        goals.extend(["head of data", "chief data officer", "ML director"])
    elif "marketing" in role_lower:
        goals.extend(["CMO", "VP Marketing", "brand director"])
    elif "sales" in role_lower:
        goals.extend(["VP Sales", "CRO", "sales director"])
    
    return list(set(goals))[:5]


def _infer_preferred_course_types(education: str, experience: int) -> List[str]:
    """Infer preferred course types based on education and experience."""
    types = []
    
    if education == "ug":
        # UG graduates might want PG courses
        types.append(CourseType.PG.value)
        if experience >= 5:
            types.append(CourseType.EXECUTIVE.value)
    elif education == "pg":
        # PG graduates might want executive or certificates
        if experience >= 8:
            types.append(CourseType.EXECUTIVE.value)
        types.append(CourseType.CERTIFICATE.value)
    
    # Everyone can benefit from certificates and bootcamps
    types.extend([CourseType.CERTIFICATE.value, CourseType.BOOTCAMP.value])
    
    return list(set(types))


def _infer_preferred_categories(major: Optional[str], role: Optional[str]) -> List[str]:
    """Infer preferred course categories."""
    categories = []
    
    major_lower = (major or "").lower()
    role_lower = (role or "").lower()
    
    # From major
    if any(x in major_lower for x in ["computer", "software", "it", "tech"]):
        categories.extend([CourseCategory.TECHNOLOGY.value, CourseCategory.DATA_SCIENCE.value])
    elif any(x in major_lower for x in ["business", "commerce", "economics"]):
        categories.extend([CourseCategory.BUSINESS.value, CourseCategory.FINANCE.value])
    elif any(x in major_lower for x in ["marketing", "communication"]):
        categories.extend([CourseCategory.MARKETING.value, CourseCategory.BUSINESS.value])
    elif any(x in major_lower for x in ["data", "statistics", "math"]):
        categories.extend([CourseCategory.DATA_SCIENCE.value, CourseCategory.TECHNOLOGY.value])
    
    # From role
    if any(x in role_lower for x in ["engineer", "developer", "programmer"]):
        categories.extend([CourseCategory.TECHNOLOGY.value])
    elif any(x in role_lower for x in ["manager", "director", "lead"]):
        categories.extend([CourseCategory.MANAGEMENT.value, CourseCategory.BUSINESS.value])
    elif any(x in role_lower for x in ["data", "analyst", "scientist"]):
        categories.extend([CourseCategory.DATA_SCIENCE.value])
    
    # Default
    if not categories:
        categories = [CourseCategory.BUSINESS.value, CourseCategory.TECHNOLOGY.value]
    
    return list(set(categories))[:4]


def _create_ad_interaction(
    db: Session, user: User, ad: CourseAd, profile: UserCourseProfile
) -> Optional[CourseAdInteraction]:
    """Create an ad interaction record."""
    # Determine interaction type based on probability
    rand = random.random()
    if rand < 0.6:
        interaction_type = "impression"
    elif rand < 0.85:
        interaction_type = "click"
    elif rand < 0.95:
        interaction_type = "hover"
    else:
        interaction_type = "dismiss"
    
    # Time in the past (last 90 days)
    days_ago = random.randint(0, 90)
    created_at = datetime.utcnow() - timedelta(days=days_ago)
    
    interaction = CourseAdInteraction(
        user_id=user.id,
        course_ad_id=ad.id,
        course_id=ad.course_id,
        university_id=user.university_id,
        interaction_type=interaction_type,
        source_page=random.choice(["feed", "roadmap", "profile", "search"]),
        time_spent_seconds=random.randint(2, 120) if interaction_type == "click" else random.randint(1, 5),
        created_at=created_at,
    )
    
    db.add(interaction)
    
    # Update user profile metrics
    if interaction_type == "impression":
        profile.total_ad_impressions = (profile.total_ad_impressions or 0) + 1
    elif interaction_type == "click":
        profile.total_ad_clicks = (profile.total_ad_clicks or 0) + 1
    
    return interaction


def _get_relevant_courses(
    db: Session, profile: UserCourseProfile, courses: List[Course]
) -> List[Course]:
    """Get courses relevant to user profile."""
    scored_courses = []
    
    for course in courses:
        score = 0
        
        # Course type match
        if course.course_type in (profile.preferred_course_types or []):
            score += 30
        
        # Category match
        if course.category in (profile.preferred_categories or []):
            score += 25
        
        # Experience fit
        exp = profile.years_of_experience or 0
        if course.min_experience_years <= exp <= course.max_experience_years:
            score += 20
        
        # Education level fit
        if profile.education_level == "ug" and course.course_type == CourseType.PG.value:
            score += 15  # UG grads are good fits for PG courses
        elif profile.education_level == "pg" and course.course_type == CourseType.EXECUTIVE.value:
            score += 15
        
        # Add some randomness
        score += random.randint(0, 20)
        
        scored_courses.append((course, score))
    
    # Sort by score and return
    scored_courses.sort(key=lambda x: x[1], reverse=True)
    return [c for c, _ in scored_courses]


def _create_course_lead(
    db: Session, user: User, course: Course, profile: UserCourseProfile
) -> Optional[CourseLead]:
    """Create a course lead record."""
    existing = db.query(CourseLead).filter(
        CourseLead.user_id == user.id,
        CourseLead.course_id == course.id
    ).first()
    
    if existing:
        return None
    
    # Calculate scores
    interest_score = random.uniform(20, 90)
    fit_score = _calculate_fit_score(course, profile)
    intent_score = random.uniform(10, 80)
    
    # Overall score is weighted average
    overall_score = (interest_score * 0.35) + (fit_score * 0.35) + (intent_score * 0.30)
    
    # Determine temperature
    if overall_score >= 70:
        temperature = LeadTemperature.HOT.value
    elif overall_score >= 40:
        temperature = LeadTemperature.WARM.value
    else:
        temperature = LeadTemperature.COLD.value
    
    # Simulate interactions
    ad_impressions = random.randint(1, 20)
    ad_clicks = int(ad_impressions * random.uniform(0.05, 0.3))
    
    # Generate recommendation reasons
    reasons = _generate_recommendation_reasons(course, profile)
    
    lead = CourseLead(
        user_id=user.id,
        course_id=course.id,
        university_id=user.university_id,
        interest_score=interest_score,
        fit_score=fit_score,
        intent_score=intent_score,
        overall_score=overall_score,
        lead_temperature=temperature,
        purchase_probability=overall_score / 100 * random.uniform(0.6, 1.0),
        ad_impressions=ad_impressions,
        ad_clicks=ad_clicks,
        landing_page_visits=int(ad_clicks * random.uniform(0.3, 0.8)),
        interaction_count=ad_impressions + ad_clicks + random.randint(0, 10),
        recommendation_reasons=reasons,
        first_interaction_at=datetime.utcnow() - timedelta(days=random.randint(1, 90)),
        last_interaction_at=datetime.utcnow() - timedelta(days=random.randint(0, 14)),
    )
    
    db.add(lead)
    return lead


def _calculate_fit_score(course: Course, profile: UserCourseProfile) -> float:
    """Calculate how well a course fits the user profile."""
    score = 50.0  # Base score
    
    # Experience fit
    exp = profile.years_of_experience or 0
    if course.min_experience_years <= exp <= course.max_experience_years:
        score += 20
    elif abs(exp - course.min_experience_years) <= 2 or abs(exp - course.max_experience_years) <= 2:
        score += 10
    
    # Education level fit
    edu = profile.education_level
    if edu == "ug" and course.target_education_level == "ug_graduate":
        score += 15
    elif edu == "ug" and course.course_type == CourseType.PG.value:
        score += 10
    elif edu == "pg" and course.course_type in [CourseType.EXECUTIVE.value, CourseType.CERTIFICATE.value]:
        score += 15
    
    # Category match
    if course.category in (profile.preferred_categories or []):
        score += 15
    
    # Cap at 100
    return min(100, score)


def _generate_recommendation_reasons(course: Course, profile: UserCourseProfile) -> List[str]:
    """Generate human-readable recommendation reasons."""
    reasons = []
    
    # Experience-based
    exp = profile.years_of_experience or 0
    if course.min_experience_years <= exp <= course.max_experience_years:
        reasons.append(f"Matches your {exp} years of experience")
    
    # Education-based
    if profile.education_level == "ug" and course.course_type == CourseType.PG.value:
        reasons.append("Natural progression from your undergraduate degree")
    elif profile.education_level == "pg" and course.course_type == CourseType.EXECUTIVE.value:
        reasons.append("Executive education for career advancement")
    
    # Category-based
    if course.category in (profile.preferred_categories or []):
        reasons.append(f"Aligns with your interest in {course.category.replace('_', ' ')}")
    
    # Career goals
    if profile.career_goals:
        for goal in profile.career_goals[:2]:
            if any(tag.lower() in goal.lower() for tag in (course.tags or [])):
                reasons.append(f"Supports your goal of becoming a {goal}")
                break
    
    # Duration-based
    if course.duration_months <= 6:
        reasons.append("Short program - complete alongside your current job")
    
    # Format-based
    if course.format == "online":
        reasons.append("100% online - flexible for working professionals")
    
    return reasons[:4]


def _generate_recommendations(
    db: Session, user: User, profile: UserCourseProfile, courses: List[Course]
) -> List[CourseRecommendation]:
    """Generate course recommendations for a user."""
    recommendations = []
    relevant_courses = _get_relevant_courses(db, profile, courses)
    
    for rank, course in enumerate(relevant_courses[:5], 1):
        existing = db.query(CourseRecommendation).filter(
            CourseRecommendation.user_id == user.id,
            CourseRecommendation.course_id == course.id
        ).first()
        
        if existing:
            continue
        
        reasons = _generate_recommendation_reasons(course, profile)
        confidence = random.uniform(0.6, 0.95) if rank <= 2 else random.uniform(0.4, 0.75)
        
        rec = CourseRecommendation(
            user_id=user.id,
            course_id=course.id,
            rank=rank,
            confidence_score=confidence,
            reasons=reasons,
            feature_weights={
                "experience_match": random.uniform(0.1, 0.3),
                "education_match": random.uniform(0.1, 0.3),
                "interest_match": random.uniform(0.2, 0.4),
                "career_goal_match": random.uniform(0.1, 0.3),
            },
        )
        
        db.add(rec)
        recommendations.append(rec)
    
    return recommendations


# =============================================================================
# LEAD SCORING & PREDICTION
# =============================================================================

def calculate_course_lead_score(
    db: Session, user_id: str, course_id: str
) -> CourseLead:
    """
    Calculate or update lead score for a user-course pair.
    Uses a simple predictive model based on multiple signals.
    """
    user = db.query(User).filter(User.id == user_id).first()
    course = db.query(Course).filter(Course.id == course_id).first()
    
    if not user or not course:
        raise ValueError("User or course not found")
    
    # Get or create user profile
    profile = db.query(UserCourseProfile).filter(UserCourseProfile.user_id == user_id).first()
    if not profile:
        profile = _create_user_course_profile(db, user)
    
    # Get ad interactions for this course
    interactions = db.query(CourseAdInteraction).filter(
        CourseAdInteraction.user_id == user_id,
        CourseAdInteraction.course_id == course_id
    ).all()
    
    # Calculate interest score from interactions
    impressions = sum(1 for i in interactions if i.interaction_type == "impression")
    clicks = sum(1 for i in interactions if i.interaction_type == "click")
    time_spent = sum(i.time_spent_seconds or 0 for i in interactions)
    
    interest_score = min(100, (
        (clicks * 15) +
        (impressions * 2) +
        (time_spent / 60 * 5)
    ))
    
    # Calculate fit score
    fit_score = _calculate_fit_score(course, profile)
    
    # Calculate intent score (recency and frequency)
    recent_interactions = [i for i in interactions if i.created_at >= datetime.utcnow() - timedelta(days=14)]
    intent_score = min(100, len(recent_interactions) * 10 + (clicks * 20))
    
    # Overall score
    overall_score = (interest_score * 0.35) + (fit_score * 0.35) + (intent_score * 0.30)
    
    # Purchase probability prediction
    # Simple logistic-style function
    purchase_prob = 1 / (1 + math.exp(-(overall_score - 50) / 20))
    
    # Get or create lead
    lead = db.query(CourseLead).filter(
        CourseLead.user_id == user_id,
        CourseLead.course_id == course_id
    ).first()
    
    if not lead:
        lead = CourseLead(user_id=user_id, course_id=course_id, university_id=user.university_id)
        db.add(lead)
    
    # Update lead
    lead.interest_score = interest_score
    lead.fit_score = fit_score
    lead.intent_score = intent_score
    lead.overall_score = overall_score
    lead.purchase_probability = purchase_prob
    lead.ad_impressions = impressions
    lead.ad_clicks = clicks
    lead.interaction_count = len(interactions)
    lead.last_interaction_at = max((i.created_at for i in interactions), default=None)
    lead.recommendation_reasons = _generate_recommendation_reasons(course, profile)
    
    # Classify
    if overall_score >= 70:
        lead.lead_temperature = LeadTemperature.HOT.value
    elif overall_score >= 40:
        lead.lead_temperature = LeadTemperature.WARM.value
    else:
        lead.lead_temperature = LeadTemperature.COLD.value
    
    db.commit()
    db.refresh(lead)
    
    return lead


# =============================================================================
# ANALYTICS QUERIES
# =============================================================================

def get_course_leads_analytics(
    db: Session,
    university_id: Optional[str] = None,
    course_type: Optional[str] = None,
) -> Dict[str, Any]:
    """Get course leads analytics overview."""
    query = db.query(CourseLead).join(Course)
    
    if university_id:
        query = query.filter(CourseLead.university_id == university_id)
    if course_type:
        query = query.filter(Course.course_type == course_type)
    
    leads = query.all()
    
    # Lead counts by temperature
    hot = sum(1 for l in leads if l.lead_temperature == LeadTemperature.HOT.value)
    warm = sum(1 for l in leads if l.lead_temperature == LeadTemperature.WARM.value)
    cold = sum(1 for l in leads if l.lead_temperature == LeadTemperature.COLD.value)
    
    # By course type
    by_course_type = defaultdict(lambda: {"total": 0, "hot": 0, "warm": 0, "cold": 0})
    for lead in leads:
        course = db.query(Course).filter(Course.id == lead.course_id).first()
        if course:
            ct = course.course_type
            by_course_type[ct]["total"] += 1
            by_course_type[ct][lead.lead_temperature] += 1
    
    # Top courses by leads
    course_lead_counts = defaultdict(int)
    for lead in leads:
        course_lead_counts[lead.course_id] += 1
    
    top_courses = []
    for course_id, count in sorted(course_lead_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        course = db.query(Course).filter(Course.id == course_id).first()
        if course:
            hot_count = sum(1 for l in leads if l.course_id == course_id and l.lead_temperature == "hot")
            top_courses.append({
                "course_id": course_id,
                "course_name": course.name,
                "course_type": course.course_type,
                "total_leads": count,
                "hot_leads": hot_count,
                "avg_score": sum(l.overall_score for l in leads if l.course_id == course_id) / count,
            })
    
    return {
        "total_leads": len(leads),
        "hot_leads": hot,
        "warm_leads": warm,
        "cold_leads": cold,
        "by_course_type": dict(by_course_type),
        "top_courses": top_courses,
        "avg_purchase_probability": sum(l.purchase_probability for l in leads) / len(leads) if leads else 0,
    }


def get_course_recommendations_for_user(
    db: Session, user_id: str, limit: int = 5
) -> List[Dict[str, Any]]:
    """Get personalized course recommendations for a user."""
    recommendations = db.query(CourseRecommendation).filter(
        CourseRecommendation.user_id == user_id,
        CourseRecommendation.is_active == True
    ).order_by(CourseRecommendation.rank).limit(limit).all()
    
    results = []
    for rec in recommendations:
        course = db.query(Course).filter(Course.id == rec.course_id).first()
        if not course:
            continue
            
        results.append({
            "course_id": course.id,
            "course_name": course.name,
            "course_type": course.course_type,
            "category": course.category,
            "price": course.price,
            "duration_months": course.duration_months,
            "format": course.format,
            "rank": rec.rank,
            "confidence_score": rec.confidence_score,
            "reasons": rec.reasons,
        })
    
    return results


def get_leads_by_course_type(
    db: Session,
    course_type: str,
    university_id: Optional[str] = None,
    temperature: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> Tuple[List[Dict[str, Any]], int]:
    """Get leads filtered by course type (UG/PG)."""
    query = db.query(CourseLead).join(Course).filter(Course.course_type == course_type)
    
    if university_id:
        query = query.filter(CourseLead.university_id == university_id)
    if temperature:
        query = query.filter(CourseLead.lead_temperature == temperature)
    
    total = query.count()
    leads = query.order_by(CourseLead.overall_score.desc()).offset(offset).limit(limit).all()
    
    results = []
    for lead in leads:
        user = db.query(User).filter(User.id == lead.user_id).first()
        course = db.query(Course).filter(Course.id == lead.course_id).first()
        profile = db.query(UserCourseProfile).filter(UserCourseProfile.user_id == lead.user_id).first()
        
        if not user or not course:
            continue
        
        results.append({
            "lead_id": lead.id,
            "user_id": lead.user_id,
            "user_name": user.name,
            "user_email": user.email,
            "education_level": profile.education_level if profile else None,
            "years_experience": profile.years_of_experience if profile else None,
            "course_id": course.id,
            "course_name": course.name,
            "course_type": course.course_type,
            "overall_score": lead.overall_score,
            "interest_score": lead.interest_score,
            "fit_score": lead.fit_score,
            "intent_score": lead.intent_score,
            "lead_temperature": lead.lead_temperature,
            "purchase_probability": lead.purchase_probability,
            "ad_clicks": lead.ad_clicks,
            "recommendation_reasons": lead.recommendation_reasons,
            "last_interaction_at": lead.last_interaction_at.isoformat() if lead.last_interaction_at else None,
        })
    
    return results, total

