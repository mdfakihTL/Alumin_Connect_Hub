"""
Career Roadmap Schemas
Pydantic models for request/response validation
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


# ==============================================================================
# MILESTONE SCHEMAS
# ==============================================================================

class Milestone(BaseModel):
    """Single milestone in a roadmap"""
    id: int
    title: str
    description: str
    duration: str  # e.g., "3-6 months"
    skills: List[str] = []
    resources: List[str] = []
    tips: Optional[str] = None


# ==============================================================================
# REQUEST SCHEMAS
# ==============================================================================

class GenerateRoadmapRequest(BaseModel):
    """Request to generate a new AI career roadmap"""
    career_goal: str  # e.g., "Become a Tech Lead at a top company"
    current_role: Optional[str] = None  # e.g., "Software Engineer"
    years_experience: Optional[int] = 0
    industry: Optional[str] = None  # e.g., "Technology", "Finance"
    additional_context: Optional[str] = None  # Any extra info user wants to provide
    
    class Config:
        json_schema_extra = {
            "example": {
                "career_goal": "Become a Senior Product Manager at a tech company",
                "current_role": "Junior Product Manager",
                "years_experience": 2,
                "industry": "Technology",
                "additional_context": "I have a technical background and want to focus on AI products"
            }
        }


class SaveRoadmapRequest(BaseModel):
    """Request to save a roadmap"""
    career_goal: str
    current_role: Optional[str] = None
    years_experience: Optional[int] = 0
    title: str
    summary: Optional[str] = None
    estimated_duration: Optional[str] = None
    milestones: List[Milestone]
    skills_required: List[str] = []
    is_public: bool = False


class UpdateProgressRequest(BaseModel):
    """Request to update progress on a roadmap"""
    milestone_id: int
    completed: bool
    notes: Optional[str] = None


# ==============================================================================
# RESPONSE SCHEMAS
# ==============================================================================

class RelatedAlumni(BaseModel):
    """Alumni related to a career path"""
    id: str
    name: str
    avatar: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    graduation_year: Optional[int] = None
    major: Optional[str] = None
    is_mentor: bool = False
    match_reason: str  # Why they're relevant


class GeneratedRoadmap(BaseModel):
    """AI-generated roadmap response"""
    title: str
    summary: str
    estimated_duration: str
    milestones: List[Milestone]
    skills_required: List[str]
    market_insights: Optional[str] = None
    salary_range: Optional[str] = None
    related_alumni: List[RelatedAlumni] = []


class SavedRoadmapResponse(BaseModel):
    """Saved roadmap response"""
    id: str
    user_id: str
    career_goal: str
    current_role: Optional[str] = None
    years_experience: int
    title: str
    summary: Optional[str] = None
    estimated_duration: Optional[str] = None
    milestones: List[Milestone]
    skills_required: List[str]
    related_alumni_ids: List[str] = []
    is_public: bool
    views_count: int
    saves_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Progress info (if user is tracking)
    progress: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class RoadmapListResponse(BaseModel):
    """List of saved roadmaps"""
    roadmaps: List[SavedRoadmapResponse]
    total: int
    page: int
    page_size: int


class AlumniPreview(BaseModel):
    """Brief alumni preview for popular roadmaps"""
    id: str
    name: str
    avatar: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    is_mentor: bool = False


class PopularRoadmapResponse(BaseModel):
    """Popular/trending roadmap template with real alumni data"""
    id: str
    title: str
    career_goal: str
    estimated_duration: str
    alumni_count: int  # Real count from database
    success_rate: int  # Percentage
    key_steps: List[str]
    top_companies: List[str] = []
    # Real-time alumni data
    alumni_preview: List[AlumniPreview] = []  # Up to 3 alumni previews
    has_mentors: bool = False  # Whether mentors are available for this path

