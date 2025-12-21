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
# AI ROADMAP GENERATION (Using Groq - FREE, or OpenAI as fallback)
# ==============================================================================

def generate_roadmap_with_ai(request: GenerateRoadmapRequest) -> GeneratedRoadmap:
    """
    Generate a career roadmap using AI.
    
    Supports (in order of preference):
    1. Groq (FREE) - Uses Llama 3 or Mixtral models
    2. Google Gemini (FREE tier)
    3. OpenAI (Paid)
    
    Falls back to template-based response if no API is available.
    """
    # Check for API keys in order of preference (free first)
    groq_key = os.getenv("GROQ_API_KEY")
    gemini_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    if groq_key:
        return _generate_with_groq(request, groq_key)
    elif gemini_key:
        return _generate_with_gemini(request, gemini_key)
    elif openai_key:
        return _generate_with_openai(request, openai_key)
    else:
        logger.warning("No AI API key configured. Using template-based roadmap.")
        return _generate_template_roadmap(request)


def _get_system_prompt() -> str:
    """Get the system prompt for roadmap generation."""
    return """You are a career advisor AI. Generate detailed, actionable career roadmaps.
        
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

IMPORTANT: Return ONLY valid JSON, no markdown formatting."""


def _get_user_prompt(request: GenerateRoadmapRequest) -> str:
    """Get the user prompt for roadmap generation."""
    return f"""Create a detailed career roadmap for:

Career Goal: {request.career_goal}
Current Role: {request.current_role or "Entry level / Student"}
Years of Experience: {request.years_experience or 0}
Industry: {request.industry or "Not specified"}
Additional Context: {request.additional_context or "None"}

Provide practical, actionable steps with realistic timelines. Include market insights and salary expectations.
Return ONLY valid JSON."""


def _parse_ai_response(content: str, request: GenerateRoadmapRequest) -> GeneratedRoadmap:
    """Parse AI response and convert to GeneratedRoadmap."""
    # Clean up response - remove markdown code blocks if present
    content = content.strip()
    if content.startswith("```json"):
        content = content[7:]
    if content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    content = content.strip()
    
    result = json.loads(content)
    
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


def _generate_with_groq(request: GenerateRoadmapRequest, api_key: str) -> GeneratedRoadmap:
    """
    Generate roadmap using Groq API (FREE).
    
    Groq offers free access to:
    - llama-3.3-70b-versatile (latest, best quality)
    - llama-3.1-8b-instant (faster, good for quick responses)
    - mixtral-8x7b-32768 (good alternative)
    """
    try:
        import httpx
        
        # Use llama-3.3-70b-versatile as default (latest and most capable)
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        logger.info(f"🚀 Generating AI roadmap with Groq ({model}) for goal: {request.career_goal}")
        
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": _get_system_prompt()},
                    {"role": "user", "content": _get_user_prompt(request)}
                ],
                "temperature": 0.7,
                "max_tokens": 2500,
                "response_format": {"type": "json_object"}
            },
            timeout=90.0  # Increased timeout for complex generation
        )
        
        if response.status_code != 200:
            logger.error(f"❌ Groq API error {response.status_code}: {response.text[:500]}")
            # Try fallback model if main model fails
            if model != "llama-3.1-8b-instant":
                logger.info("Trying fallback model: llama-3.1-8b-instant")
                return _generate_with_groq_fallback(request, api_key)
            return _generate_template_roadmap(request)
        
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        logger.info(f"✅ Groq AI roadmap generated successfully ({len(content)} chars)")
        
        return _parse_ai_response(content, request)
        
    except httpx.TimeoutException:
        logger.error("⏱️ Groq API timed out - using template")
        return _generate_template_roadmap(request)
    except Exception as e:
        logger.error(f"❌ Groq API failed: {type(e).__name__}: {e}")
        return _generate_template_roadmap(request)


def _generate_with_groq_fallback(request: GenerateRoadmapRequest, api_key: str) -> GeneratedRoadmap:
    """Fallback to faster/smaller Groq model if main model fails."""
    try:
        import httpx
        
        model = "llama-3.1-8b-instant"
        logger.info(f"🔄 Using Groq fallback model: {model}")
        
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": _get_system_prompt()},
                    {"role": "user", "content": _get_user_prompt(request)}
                ],
                "temperature": 0.7,
                "max_tokens": 2000,
                "response_format": {"type": "json_object"}
            },
            timeout=60.0
        )
        
        if response.status_code != 200:
            logger.error(f"❌ Groq fallback also failed: {response.status_code}")
            return _generate_template_roadmap(request)
        
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        logger.info(f"✅ Groq fallback generated roadmap successfully")
        
        return _parse_ai_response(content, request)
        
    except Exception as e:
        logger.error(f"❌ Groq fallback failed: {e}")
        return _generate_template_roadmap(request)


def _generate_with_gemini(request: GenerateRoadmapRequest, api_key: str) -> GeneratedRoadmap:
    """
    Generate roadmap using Google Gemini API (FREE tier available).
    
    Free tier: 60 requests per minute
    """
    try:
        import httpx
        
        logger.info("Using Google Gemini API for roadmap generation")
        
        model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        
        prompt = f"{_get_system_prompt()}\n\n{_get_user_prompt(request)}"
        
        response = httpx.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            params={"key": api_key},
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 2000,
                    "responseMimeType": "application/json"
                }
            },
            timeout=60.0
        )
        
        response.raise_for_status()
        result = response.json()
        content = result["candidates"][0]["content"]["parts"][0]["text"]
        
        return _parse_ai_response(content, request)
        
    except Exception as e:
        logger.error(f"Gemini API failed: {e}")
        return _generate_template_roadmap(request)


def _generate_with_openai(request: GenerateRoadmapRequest, api_key: str) -> GeneratedRoadmap:
    """Generate roadmap using OpenAI API (Paid)."""
    try:
        import openai
        
        logger.info("Using OpenAI API for roadmap generation")
        
        client = openai.OpenAI(api_key=api_key)
        
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
            messages=[
                {"role": "system", "content": _get_system_prompt()},
                {"role": "user", "content": _get_user_prompt(request)}
            ],
            temperature=0.7,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        return _parse_ai_response(content, request)
        
    except Exception as e:
        logger.error(f"OpenAI API failed: {e}")
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


def get_popular_roadmaps_with_alumni(
    db: Session,
    university_id: Optional[str] = None,
    include_alumni_details: bool = False
) -> List[Dict[str, Any]]:
    """
    Get popular roadmaps enriched with REAL alumni data from the database.
    
    For each career path template:
    - Counts actual alumni working in related roles
    - Fetches preview of up to 3 alumni
    - Identifies if mentors are available
    - Gets real company names from alumni profiles
    """
    enriched_roadmaps = []
    
    for template in POPULAR_ROADMAPS:
        # Find alumni matching this career path
        alumni = find_related_alumni(
            db=db,
            career_goal=template["career_goal"],
            university_id=university_id,
            limit=10
        )
        
        # Get real alumni count
        real_alumni_count = len(alumni) if alumni else 0
        
        # Check if any mentors are available
        has_mentors = any(a.is_mentor for a in alumni) if alumni else False
        
        # Get real companies from alumni profiles
        real_companies = list(set(
            a.company for a in alumni 
            if a.company and len(a.company) > 1
        ))[:4]
        
        # Create alumni preview (up to 3)
        alumni_preview = []
        for a in alumni[:3]:
            alumni_preview.append({
                "id": a.id,
                "name": a.name,
                "avatar": a.avatar,
                "job_title": a.job_title,
                "company": a.company,
                "is_mentor": a.is_mentor
            })
        
        # Build enriched roadmap
        enriched = {
            "id": template["id"],
            "title": template["title"],
            "career_goal": template["career_goal"],
            "estimated_duration": template["estimated_duration"],
            "alumni_count": max(real_alumni_count, template.get("alumni_count", 0)),
            "success_rate": template["success_rate"],
            "key_steps": template["key_steps"],
            "top_companies": real_companies if real_companies else template.get("top_companies", []),
            "alumni_preview": alumni_preview,
            "has_mentors": has_mentors
        }
        
        # Include full alumni details if requested
        if include_alumni_details:
            enriched["related_alumni"] = [
                {
                    "id": a.id,
                    "name": a.name,
                    "avatar": a.avatar,
                    "job_title": a.job_title,
                    "company": a.company,
                    "graduation_year": a.graduation_year,
                    "major": a.major,
                    "is_mentor": a.is_mentor,
                    "match_reason": a.match_reason
                }
                for a in alumni
            ]
        
        enriched_roadmaps.append(enriched)
    
    # Sort by real alumni count (most popular first)
    enriched_roadmaps.sort(key=lambda x: x["alumni_count"], reverse=True)
    
    return enriched_roadmaps

