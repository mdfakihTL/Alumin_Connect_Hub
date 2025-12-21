"""
Career Roadmap API Routes
Endpoints for AI-generated career roadmaps, saving, and alumni matching
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.career_roadmap import (
    GenerateRoadmapRequest,
    GeneratedRoadmap,
    SaveRoadmapRequest,
    SavedRoadmapResponse,
    RoadmapListResponse,
    PopularRoadmapResponse,
    UpdateProgressRequest,
    RelatedAlumni,
    Milestone
)
from app.services.career_roadmap_service import (
    generate_roadmap_with_ai,
    find_related_alumni,
    save_roadmap,
    get_user_roadmaps,
    get_roadmap_by_id,
    delete_roadmap,
    update_roadmap_progress,
    get_popular_roadmaps
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/career-roadmap", tags=["Career Roadmap"])


# ==============================================================================
# AI ROADMAP GENERATION
# ==============================================================================

@router.post("/generate", response_model=GeneratedRoadmap)
async def generate_career_roadmap(
    request: GenerateRoadmapRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate an AI-powered career roadmap based on user's goals.
    
    Uses OpenAI GPT or Grok (xAI) to create personalized roadmaps with:
    - Detailed milestones with actionable steps
    - Skills required for each milestone
    - Estimated timeline
    - Market insights and salary expectations
    - Related alumni who can help
    """
    try:
        # Generate roadmap with AI
        roadmap = generate_roadmap_with_ai(request)
        
        # Find related alumni
        related_alumni = find_related_alumni(
            db=db,
            career_goal=request.career_goal,
            university_id=current_user.university_id,
            limit=5
        )
        
        # Add related alumni to response
        roadmap.related_alumni = related_alumni
        
        return roadmap
        
    except Exception as e:
        logger.error(f"Failed to generate roadmap: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate career roadmap. Please try again."
        )


# ==============================================================================
# SAVE & MANAGE ROADMAPS
# ==============================================================================

@router.post("/save", response_model=SavedRoadmapResponse)
async def save_career_roadmap(
    request: SaveRoadmapRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save a generated roadmap to user's collection.
    
    Saved roadmaps can be:
    - Tracked for progress
    - Made public for others to see
    - Edited and customized
    """
    try:
        roadmap = save_roadmap(
            db=db,
            user_id=current_user.id,
            university_id=current_user.university_id,
            request=request
        )
        
        return SavedRoadmapResponse(
            id=roadmap.id,
            user_id=roadmap.user_id,
            career_goal=roadmap.career_goal,
            current_role=roadmap.current_role,
            years_experience=roadmap.years_experience,
            title=roadmap.title,
            summary=roadmap.summary,
            estimated_duration=roadmap.estimated_duration,
            milestones=[Milestone(**m) for m in roadmap.milestones],
            skills_required=roadmap.skills_required,
            related_alumni_ids=roadmap.related_alumni_ids or [],
            is_public=roadmap.is_public,
            views_count=roadmap.views_count,
            saves_count=roadmap.saves_count,
            created_at=roadmap.created_at,
            updated_at=roadmap.updated_at
        )
        
    except Exception as e:
        logger.error(f"Failed to save roadmap: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to save roadmap. Please try again."
        )


@router.get("/my-roadmaps", response_model=RoadmapListResponse)
async def get_my_roadmaps(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all roadmaps saved by the current user.
    """
    roadmaps, total = get_user_roadmaps(
        db=db,
        user_id=current_user.id,
        page=page,
        page_size=page_size
    )
    
    return RoadmapListResponse(
        roadmaps=[
            SavedRoadmapResponse(
                id=r.id,
                user_id=r.user_id,
                career_goal=r.career_goal,
                current_role=r.current_role,
                years_experience=r.years_experience,
                title=r.title,
                summary=r.summary,
                estimated_duration=r.estimated_duration,
                milestones=[Milestone(**m) for m in (r.milestones or [])],
                skills_required=r.skills_required or [],
                related_alumni_ids=r.related_alumni_ids or [],
                is_public=r.is_public,
                views_count=r.views_count,
                saves_count=r.saves_count,
                created_at=r.created_at,
                updated_at=r.updated_at
            )
            for r in roadmaps
        ],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/roadmap/{roadmap_id}", response_model=SavedRoadmapResponse)
async def get_roadmap(
    roadmap_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific roadmap by ID.
    
    Users can only view their own roadmaps or public roadmaps.
    """
    roadmap = get_roadmap_by_id(db, roadmap_id)
    
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    # Check access
    if roadmap.user_id != current_user.id and not roadmap.is_public:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Increment view count if not owner
    if roadmap.user_id != current_user.id:
        roadmap.views_count += 1
        db.commit()
    
    return SavedRoadmapResponse(
        id=roadmap.id,
        user_id=roadmap.user_id,
        career_goal=roadmap.career_goal,
        current_role=roadmap.current_role,
        years_experience=roadmap.years_experience,
        title=roadmap.title,
        summary=roadmap.summary,
        estimated_duration=roadmap.estimated_duration,
        milestones=[Milestone(**m) for m in (roadmap.milestones or [])],
        skills_required=roadmap.skills_required or [],
        related_alumni_ids=roadmap.related_alumni_ids or [],
        is_public=roadmap.is_public,
        views_count=roadmap.views_count,
        saves_count=roadmap.saves_count,
        created_at=roadmap.created_at,
        updated_at=roadmap.updated_at
    )


@router.delete("/roadmap/{roadmap_id}")
async def delete_saved_roadmap(
    roadmap_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a saved roadmap (owner only).
    """
    success = delete_roadmap(db, roadmap_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Roadmap not found or you don't have permission to delete it"
        )
    
    return {"message": "Roadmap deleted successfully"}


# ==============================================================================
# PROGRESS TRACKING
# ==============================================================================

@router.post("/roadmap/{roadmap_id}/progress")
async def update_progress(
    roadmap_id: str,
    request: UpdateProgressRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update progress on a roadmap milestone.
    
    Track which milestones are completed and add personal notes.
    """
    # Verify roadmap exists and user owns it
    roadmap = get_roadmap_by_id(db, roadmap_id)
    if not roadmap or roadmap.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    
    progress = update_roadmap_progress(
        db=db,
        user_id=current_user.id,
        roadmap_id=roadmap_id,
        milestone_id=request.milestone_id,
        completed=request.completed,
        notes=request.notes
    )
    
    return {
        "message": "Progress updated",
        "progress_percentage": progress.progress_percentage,
        "completed_milestones": progress.completed_milestones
    }


# ==============================================================================
# POPULAR ROADMAPS & ALUMNI
# ==============================================================================

@router.get("/popular", response_model=List[PopularRoadmapResponse])
async def get_popular_roadmap_templates(
    db: Session = Depends(get_db)
):
    """
    Get popular/trending career roadmap templates with REAL alumni data.
    
    Returns templates enriched with:
    - Actual alumni count from database
    - Preview of alumni who work in these roles
    
    Note: This endpoint is public (no auth required) for browsing.
    """
    from app.services.career_roadmap_service import get_popular_roadmaps_with_alumni
    
    templates = get_popular_roadmaps_with_alumni(db, university_id=None)
    return [PopularRoadmapResponse(**t) for t in templates]


@router.get("/popular-with-alumni")
async def get_popular_with_alumni_details(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get popular roadmaps with full alumni details for each path.
    
    Returns real-time data including:
    - Alumni who achieved this career goal
    - Their current companies
    - Success metrics
    """
    from app.services.career_roadmap_service import get_popular_roadmaps_with_alumni
    
    templates = get_popular_roadmaps_with_alumni(db, current_user.university_id, include_alumni_details=True)
    return templates


@router.get("/related-alumni", response_model=List[RelatedAlumni])
async def get_related_alumni_for_goal(
    career_goal: str = Query(..., min_length=3),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Find alumni related to a specific career goal.
    
    Returns alumni who:
    - Work in similar roles
    - Are at target companies
    - Are mentors in the field
    - Have relevant experience
    """
    alumni = find_related_alumni(
        db=db,
        career_goal=career_goal,
        university_id=current_user.university_id,
        limit=limit
    )
    
    return alumni


# ==============================================================================
# SEARCH ALUMNI BY KEYWORDS
# ==============================================================================

@router.get("/search-alumni", response_model=List[RelatedAlumni])
async def search_alumni_by_role(
    query: str = Query(..., min_length=2, description="Search by job title, company, or skills"),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search for alumni by job title, company, or skills.
    
    Use this to find specific alumni to connect with based on your career interests.
    """
    alumni = find_related_alumni(
        db=db,
        career_goal=query,
        university_id=current_user.university_id,
        limit=limit
    )
    
    return alumni

