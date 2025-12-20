"""
Career Roadmap Service
Handles AI roadmap generation, alumni matching, and roadmap management
"""
import os
import json
import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.models.user import User, UserProfile
from app.models.career_roadmap import SavedRoadmap, RoadmapProgress
from app.schemas.career_roadmap import (
    GenerateRoadmapRequest, 
    GeneratedRoadmap, 
    Milestone,
    RelatedAlumni,
    SaveRoadmapRequest
)

logger = logging.getLogger(__name__)

# ==============================================================================
# POPULAR CAREER TEMPLATES (Static data for MVP)
# ==============================================================================

POPULAR_ROADMAPS = [
    {
        "id": "tech-lead",
        "title": "Software Engineer to Tech Lead",
        "career_goal": "Tech Lead / Engineering Manager",
        "estimated_duration": "2-3 years",
        "alumni_count": 23,
        "success_rate": 89,
        "key_steps": ["Master system design", "Lead projects", "Mentor juniors", "Build influence"],
        "top_companies": ["Google", "Amazon", "Microsoft", "Meta"]
    },
    {
        "id": "product-manager",
        "title": "Product Manager Career Path",
        "career_goal": "Senior Product Manager",
        "estimated_duration": "3-4 years",
        "alumni_count": 17,
        "success_rate": 92,
        "key_steps": ["Learn product strategy", "Stakeholder management", "Data analytics", "Leadership"],
        "top_companies": ["Google", "Apple", "Spotify", "Airbnb"]
    },
    {
        "id": "startup-founder",
        "title": "Startup Founder Journey",
        "career_goal": "Startup Founder / CEO",
        "estimated_duration": "4-5 years",
        "alumni_count": 12,
        "success_rate": 78,
        "key_steps": ["Validate idea", "Build MVP", "Raise funding", "Scale team"],
        "top_companies": ["Y Combinator", "Techstars", "500 Startups"]
    },
    {
        "id": "data-scientist",
        "title": "Data Scientist to ML Lead",
        "career_goal": "Machine Learning Lead",
        "estimated_duration": "3-4 years",
        "alumni_count": 15,
        "success_rate": 85,
        "key_steps": ["Master ML fundamentals", "Deploy production models", "Lead ML projects", "Research publications"],
        "top_companies": ["Google AI", "OpenAI", "DeepMind", "NVIDIA"]
    },
    {
        "id": "consultant",
        "title": "Management Consultant Path",
        "career_goal": "Senior Consultant / Partner",
        "estimated_duration": "5-7 years",
        "alumni_count": 10,
        "success_rate": 82,
        "key_steps": ["Build analytical skills", "Client management", "Industry expertise", "Business development"],
        "top_companies": ["McKinsey", "BCG", "Bain", "Deloitte"]
    }
]


# ==============================================================================
# AI ROADMAP GENERATION (Using OpenAI / Compatible with Grok)
# ==============================================================================

def generate_roadmap_with_ai(request: GenerateRoadmapRequest) -> GeneratedRoadmap:
    """
    Generate a career roadmap using AI (OpenAI GPT or Grok).
    
    Falls back to template-based response if API is unavailable.
    """
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("XAI_API_KEY")
    
    if not api_key:
        logger.warning("No AI API key configured. Using template-based roadmap.")
        return _generate_template_roadmap(request)
    
    try:
        import openai
        
        # Configure client (works for both OpenAI and xAI Grok)
        base_url = os.getenv("XAI_API_BASE", "https://api.openai.com/v1")
        client = openai.OpenAI(api_key=api_key, base_url=base_url)
        
        system_prompt = """You are a career advisor AI. Generate detailed, actionable career roadmaps.
        
Your response must be valid JSON with this exact structure:
{
    "title": "Current Role to Target Role",
    "summary": "Brief 2-3 sentence overview of the career path",
    "estimated_duration": "X-Y years",
    "milestones": [
        {
            "id": 1,
            "title": "Milestone title",
            "description": "Detailed description of what to achieve",
            "duration": "X-Y months",
            "skills": ["skill1", "skill2"],
            "resources": ["resource1", "resource2"],
            "tips": "Practical tip for this milestone"
        }
    ],
    "skills_required": ["skill1", "skill2", "skill3"],
    "market_insights": "Current market trends and demand for this role",
    "salary_range": "$XXk - $XXXk"
}

Create 4-6 milestones that are:
- Specific and actionable
- Progressive (building on each other)
- Realistic time estimates
- Include both technical and soft skills
"""

        user_prompt = f"""Create a detailed career roadmap for:

Career Goal: {request.career_goal}
Current Role: {request.current_role or "Entry level / Student"}
Years of Experience: {request.years_experience or 0}
Industry: {request.industry or "Not specified"}
Additional Context: {request.additional_context or "None"}

Provide practical, actionable steps with realistic timelines. Include market insights and salary expectations."""

        response = client.chat.completions.create(
            model=os.getenv("AI_MODEL", "gpt-3.5-turbo"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        
        # Convert to Pydantic model
        milestones = [Milestone(**m) for m in result.get("milestones", [])]
        
        return GeneratedRoadmap(
            title=result.get("title", f"Path to {request.career_goal}"),
            summary=result.get("summary", ""),
            estimated_duration=result.get("estimated_duration", "2-4 years"),
            milestones=milestones,
            skills_required=result.get("skills_required", []),
            market_insights=result.get("market_insights"),
            salary_range=result.get("salary_range"),
            related_alumni=[]  # Will be populated separately
        )
        
    except Exception as e:
        logger.error(f"AI roadmap generation failed: {e}")
        return _generate_template_roadmap(request)


def _generate_template_roadmap(request: GenerateRoadmapRequest) -> GeneratedRoadmap:
    """
    Generate a template-based roadmap when AI is unavailable.
    """
    goal_lower = request.career_goal.lower()
    
    # Match to closest template
    if any(word in goal_lower for word in ["tech lead", "engineering manager", "lead engineer"]):
        template = POPULAR_ROADMAPS[0]
    elif any(word in goal_lower for word in ["product", "pm", "product manager"]):
        template = POPULAR_ROADMAPS[1]
    elif any(word in goal_lower for word in ["founder", "startup", "entrepreneur", "ceo"]):
        template = POPULAR_ROADMAPS[2]
    elif any(word in goal_lower for word in ["data", "ml", "machine learning", "ai"]):
        template = POPULAR_ROADMAPS[3]
    elif any(word in goal_lower for word in ["consult", "mba", "strategy"]):
        template = POPULAR_ROADMAPS[4]
    else:
        template = POPULAR_ROADMAPS[0]  # Default to tech lead
    
    # Create milestones from key steps
    milestones = []
    for i, step in enumerate(template["key_steps"], 1):
        milestones.append(Milestone(
            id=i,
            title=step,
            description=f"Focus on {step.lower()} to progress in your career path.",
            duration="6-12 months",
            skills=[step.split()[0], "Communication", "Leadership"],
            resources=["Online courses", "Books", "Mentorship"],
            tips=f"Network with professionals who have achieved this milestone."
        ))
    
    return GeneratedRoadmap(
        title=f"{request.current_role or 'Your Role'} to {request.career_goal}",
        summary=f"A comprehensive roadmap to help you achieve your goal of becoming a {request.career_goal}. "
                f"Based on successful career paths of alumni in similar roles.",
        estimated_duration=template["estimated_duration"],
        milestones=milestones,
        skills_required=["Technical Skills", "Leadership", "Communication", "Strategic Thinking"],
        market_insights="This career path is in high demand. Focus on building both technical and soft skills.",
        salary_range="$100k - $200k+ depending on experience and location",
        related_alumni=[]
    )


# ==============================================================================
# ALUMNI MATCHING
# ==============================================================================

def find_related_alumni(
    db: Session, 
    career_goal: str, 
    university_id: Optional[str] = None,
    limit: int = 10
) -> List[RelatedAlumni]:
    """
    Find alumni who are working in roles related to the career goal.
    
    Searches by:
    - Job title matching
    - Company matching
    - Major/field relevance
    - Mentor status (prioritized)
    """
    keywords = extract_keywords(career_goal)
    
    # Build query for users with profiles
    query = db.query(User, UserProfile).join(
        UserProfile, User.id == UserProfile.user_id
    ).filter(
        User.is_active == True
    )
    
    # Filter by university if specified
    if university_id:
        query = query.filter(User.university_id == university_id)
    
    # Build OR conditions for keyword matching
    keyword_conditions = []
    for keyword in keywords:
        keyword_conditions.extend([
            UserProfile.job_title.ilike(f"%{keyword}%"),
            UserProfile.company.ilike(f"%{keyword}%"),
            User.major.ilike(f"%{keyword}%")
        ])
    
    if keyword_conditions:
        query = query.filter(or_(*keyword_conditions))
    
    # Prioritize mentors
    query = query.order_by(User.is_mentor.desc(), UserProfile.connections_count.desc())
    
    results = query.limit(limit).all()
    
    related_alumni = []
    for user, profile in results:
        # Determine match reason
        job_title = profile.job_title or ""
        company = profile.company or ""
        
        if any(kw.lower() in job_title.lower() for kw in keywords):
            reason = f"Works as {job_title}"
        elif any(kw.lower() in company.lower() for kw in keywords):
            reason = f"Works at {company}"
        elif user.is_mentor:
            reason = "Mentor in related field"
        else:
            reason = "Similar career background"
        
        related_alumni.append(RelatedAlumni(
            id=user.id,
            name=user.name,
            avatar=user.avatar,
            job_title=profile.job_title,
            company=profile.company,
            graduation_year=user.graduation_year,
            major=user.major,
            is_mentor=user.is_mentor,
            match_reason=reason
        ))
    
    return related_alumni


def extract_keywords(career_goal: str) -> List[str]:
    """
    Extract relevant keywords from career goal for alumni matching.
    """
    # Common job-related words to filter out
    stop_words = {
        'become', 'want', 'to', 'be', 'a', 'an', 'the', 'at', 'in', 'for',
        'with', 'and', 'or', 'of', 'my', 'career', 'goal', 'dream', 'job',
        'position', 'role', 'work', 'working', 'senior', 'junior', 'mid',
        'level', 'top', 'best', 'company', 'firm', 'corporation'
    }
    
    # Extract words
    words = career_goal.lower().replace(',', ' ').replace('.', ' ').split()
    
    # Filter and keep meaningful keywords
    keywords = [w for w in words if w not in stop_words and len(w) > 2]
    
    # Add compound terms if present
    goal_lower = career_goal.lower()
    compound_terms = [
        'tech lead', 'product manager', 'data scientist', 'machine learning',
        'software engineer', 'engineering manager', 'project manager',
        'business analyst', 'ux designer', 'full stack', 'frontend', 'backend',
        'devops', 'cloud architect', 'ai engineer', 'research scientist'
    ]
    
    for term in compound_terms:
        if term in goal_lower and term not in keywords:
            keywords.append(term)
    
    return keywords[:10]  # Limit to 10 keywords


# ==============================================================================
# ROADMAP CRUD OPERATIONS
# ==============================================================================

def save_roadmap(
    db: Session,
    user_id: str,
    university_id: Optional[str],
    request: SaveRoadmapRequest
) -> SavedRoadmap:
    """Save a roadmap to the database."""
    roadmap = SavedRoadmap(
        user_id=user_id,
        university_id=university_id,
        career_goal=request.career_goal,
        current_role=request.current_role,
        years_experience=request.years_experience or 0,
        title=request.title,
        summary=request.summary,
        estimated_duration=request.estimated_duration,
        milestones=[m.model_dump() for m in request.milestones],
        skills_required=request.skills_required,
        is_public=request.is_public
    )
    
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)
    
    return roadmap


def get_user_roadmaps(
    db: Session,
    user_id: str,
    page: int = 1,
    page_size: int = 10
) -> tuple[List[SavedRoadmap], int]:
    """Get all roadmaps saved by a user."""
    query = db.query(SavedRoadmap).filter(
        SavedRoadmap.user_id == user_id
    ).order_by(SavedRoadmap.created_at.desc())
    
    total = query.count()
    roadmaps = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return roadmaps, total


def get_roadmap_by_id(db: Session, roadmap_id: str) -> Optional[SavedRoadmap]:
    """Get a specific roadmap by ID."""
    return db.query(SavedRoadmap).filter(SavedRoadmap.id == roadmap_id).first()


def delete_roadmap(db: Session, roadmap_id: str, user_id: str) -> bool:
    """Delete a roadmap (only by owner)."""
    roadmap = db.query(SavedRoadmap).filter(
        SavedRoadmap.id == roadmap_id,
        SavedRoadmap.user_id == user_id
    ).first()
    
    if roadmap:
        db.delete(roadmap)
        db.commit()
        return True
    return False


def update_roadmap_progress(
    db: Session,
    user_id: str,
    roadmap_id: str,
    milestone_id: int,
    completed: bool,
    notes: Optional[str] = None
) -> Optional[RoadmapProgress]:
    """Update progress on a roadmap milestone."""
    # Get or create progress record
    progress = db.query(RoadmapProgress).filter(
        RoadmapProgress.user_id == user_id,
        RoadmapProgress.roadmap_id == roadmap_id
    ).first()
    
    if not progress:
        progress = RoadmapProgress(
            user_id=user_id,
            roadmap_id=roadmap_id,
            completed_milestones={},
            milestone_notes={}
        )
        db.add(progress)
    
    # Update milestone status
    completed_milestones = progress.completed_milestones or {}
    completed_milestones[str(milestone_id)] = completed
    progress.completed_milestones = completed_milestones
    
    # Update notes if provided
    if notes is not None:
        milestone_notes = progress.milestone_notes or {}
        milestone_notes[str(milestone_id)] = notes
        progress.milestone_notes = milestone_notes
    
    # Calculate progress percentage
    roadmap = get_roadmap_by_id(db, roadmap_id)
    if roadmap and roadmap.milestones:
        total_milestones = len(roadmap.milestones)
        completed_count = sum(1 for v in completed_milestones.values() if v)
        progress.progress_percentage = int((completed_count / total_milestones) * 100)
    
    db.commit()
    db.refresh(progress)
    
    return progress


def get_popular_roadmaps() -> List[Dict[str, Any]]:
    """Get list of popular roadmap templates."""
    return POPULAR_ROADMAPS

