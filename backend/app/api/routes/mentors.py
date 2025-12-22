"""
Mentor API routes for alumni to find and match with mentors
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import json

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User, UserProfile
from app.models.mentor import Mentor, MentorMatch
from app.models.university import University

router = APIRouter()


# Schemas
class MentorResponse(BaseModel):
    id: str
    user_id: str
    name: str
    avatar: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    university: Optional[str] = None
    graduation_year: Optional[str] = None
    location: Optional[str] = None
    expertise: List[str] = []
    bio: Optional[str] = None
    availability: str = "Medium"
    match_score: int = 0
    mentees_count: int = 0
    years_experience: int = 0

    class Config:
        from_attributes = True


class MentorListResponse(BaseModel):
    mentors: List[MentorResponse]
    total: int


class MentorMatchCreate(BaseModel):
    mentor_id: str


class MentorMatchResponse(BaseModel):
    id: str
    mentor_id: str
    mentor_user_id: str  # User ID of the mentor for messaging
    mentor_name: str
    mentor_avatar: Optional[str] = None
    mentor_title: Optional[str] = None
    mentor_company: Optional[str] = None
    status: str
    matched_at: str


class MyMatchesResponse(BaseModel):
    matches: List[MentorMatchResponse]
    total: int


def calculate_match_score(user: User, mentor: Mentor, mentor_user: User) -> int:
    """Calculate match score between user and mentor based on various factors"""
    score = 50  # Base score
    
    # Same university bonus
    if user.university_id == mentor_user.university_id:
        score += 20
    
    # Similar major
    if user.major and mentor_user.major:
        if user.major.lower() == mentor_user.major.lower():
            score += 15
        elif any(word in mentor_user.major.lower() for word in user.major.lower().split()):
            score += 10
    
    # Mentor has more experience (graduated earlier)
    if user.graduation_year and mentor_user.graduation_year:
        year_diff = mentor_user.graduation_year - user.graduation_year
        if year_diff >= 5:
            score += 15
        elif year_diff >= 3:
            score += 10
    
    # Cap at 100
    return min(score, 100)


@router.get("/available", response_model=MentorListResponse)
async def get_available_mentors(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    expertise: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get available mentors for the current user.
    Excludes mentors the user has already matched with.
    """
    # Get user IDs of mentors the user has already matched with
    matched_user_ids_query = db.query(Mentor.user_id).join(
        MentorMatch, MentorMatch.mentor_id == Mentor.id
    ).filter(
        MentorMatch.mentee_id == current_user.id
    )
    matched_user_ids = [m[0] for m in matched_user_ids_query.all()]
    
    # Query users who are mentors - use LEFT JOIN to include those without mentor profile
    query = db.query(User).outerjoin(
        Mentor, Mentor.user_id == User.id
    ).filter(
        User.is_mentor == True,
        User.is_active == True,
        User.id != current_user.id  # Don't show self
    )
    
    # Exclude already matched mentors
    if matched_user_ids:
        query = query.filter(User.id.notin_(matched_user_ids))
    
    # Optional expertise filter (only works for users with mentor profile)
    if expertise:
        query = query.filter(Mentor.expertise.ilike(f'%{expertise}%'))
    
    # Order by same university first
    total = query.count()
    
    mentor_users = query.order_by(
        (User.university_id == current_user.university_id).desc(),
        User.name.asc()
    ).offset((page - 1) * page_size).limit(page_size).all()
    
    mentors = []
    for user in mentor_users:
        # Get mentor profile if exists
        mentor = db.query(Mentor).filter(Mentor.user_id == user.id).first()
        
        # Get university name
        university_name = None
        if user.university_id:
            university = db.query(University).filter(University.id == user.university_id).first()
            if university:
                university_name = university.name
        
        # Get profile for additional info
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        
        # Parse expertise
        expertise_list = []
        if mentor and mentor.expertise:
            try:
                expertise_list = json.loads(mentor.expertise)
            except:
                expertise_list = []
        
        # Calculate personalized match score
        match_score = calculate_match_score(current_user, mentor, user) if mentor else 60
        
        # Create or use mentor ID (use user ID as fallback if no mentor profile)
        mentor_id = mentor.id if mentor else f"user_{user.id}"
        
        mentors.append(MentorResponse(
            id=mentor_id,
            user_id=user.id,
            name=user.name,
            avatar=user.avatar,
            title=profile.job_title if profile else (mentor.title if mentor else "Professional"),
            company=profile.company if profile else (mentor.company if mentor else ""),
            university=university_name,
            graduation_year=str(user.graduation_year) if user.graduation_year else None,
            location=(mentor.location if mentor else None) or (profile.city if profile else None),
            expertise=expertise_list,
            bio=(mentor.bio if mentor else None) or (profile.bio if profile else None) or "Experienced professional ready to mentor.",
            availability=mentor.availability if mentor else "Medium",
            match_score=match_score,
            mentees_count=mentor.mentees_count if mentor else 0,
            years_experience=mentor.years_experience if mentor else 0
        ))
    
    # Sort by match score
    mentors.sort(key=lambda x: x.match_score, reverse=True)
    
    return MentorListResponse(mentors=mentors, total=total)


@router.post("/match", status_code=status.HTTP_201_CREATED)
async def create_mentor_match(
    match_data: MentorMatchCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a mentor match (when user swipes right)
    """
    mentor_id = match_data.mentor_id
    mentor_user = None
    mentor = None
    
    # Handle case where mentor_id is "user_<user_id>" (no mentor profile exists)
    if mentor_id.startswith("user_"):
        user_id = mentor_id.replace("user_", "")
        mentor_user = db.query(User).filter(User.id == user_id, User.is_mentor == True).first()
        
        if not mentor_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mentor not found"
            )
        
        # Create a mentor profile for this user
        mentor = Mentor(
            user_id=user_id,
            availability="Medium"
        )
        db.add(mentor)
        db.flush()  # Get the ID
        mentor_id = mentor.id
    else:
        # Normal case - mentor profile exists
        mentor = db.query(Mentor).filter(Mentor.id == mentor_id).first()
        if not mentor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mentor not found"
            )
        mentor_user = db.query(User).filter(User.id == mentor.user_id).first()
    
    # Check if already matched
    existing_match = db.query(MentorMatch).filter(
        MentorMatch.mentor_id == mentor_id,
        MentorMatch.mentee_id == current_user.id
    ).first()
    
    if existing_match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already matched with this mentor"
        )
    
    # Create match
    match = MentorMatch(
        mentor_id=mentor_id,
        mentee_id=current_user.id,
        status="matched"
    )
    
    db.add(match)
    
    # Increment mentor's mentee count
    mentor.mentees_count = (mentor.mentees_count or 0) + 1
    
    # Create notification for mentor
    from app.models.notification import Notification, NotificationType
    
    notification = Notification(
        user_id=mentor.user_id,
        type=NotificationType.MENTORSHIP,
        title="New Mentee Match!",
        message=f"{current_user.name} wants you as their mentor",
        avatar=current_user.avatar,
        action_url="/mentorship",
        related_id=match.id
    )
    db.add(notification)
    
    db.commit()
    db.refresh(match)
    
    return {
        "message": f"Successfully matched with {mentor_user.name if mentor_user else 'mentor'}!",
        "success": True,
        "match_id": match.id
    }


@router.get("/my-matches", response_model=MyMatchesResponse)
async def get_my_matches(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all mentors the current user has matched with
    """
    matches = db.query(MentorMatch, Mentor, User).join(
        Mentor, MentorMatch.mentor_id == Mentor.id
    ).join(
        User, Mentor.user_id == User.id
    ).filter(
        MentorMatch.mentee_id == current_user.id
    ).order_by(MentorMatch.matched_at.desc()).all()
    
    result = []
    for match, mentor, user in matches:
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        
        result.append(MentorMatchResponse(
            id=match.id,
            mentor_id=mentor.id,
            mentor_user_id=user.id,  # Include user ID for messaging
            mentor_name=user.name,
            mentor_avatar=user.avatar,
            mentor_title=profile.job_title if profile else mentor.title,
            mentor_company=profile.company if profile else mentor.company,
            status=match.status,
            matched_at=match.matched_at.isoformat() if match.matched_at else ""
        ))
    
    return MyMatchesResponse(matches=result, total=len(result))


@router.delete("/match/{match_id}")
async def remove_mentor_match(
    match_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Remove a mentor match (unmatch)
    """
    match = db.query(MentorMatch).filter(
        MentorMatch.id == match_id,
        MentorMatch.mentee_id == current_user.id
    ).first()
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    # Decrement mentor's mentee count
    mentor = db.query(Mentor).filter(Mentor.id == match.mentor_id).first()
    if mentor:
        mentor.mentees_count = max(0, (mentor.mentees_count or 0) - 1)
    
    db.delete(match)
    db.commit()
    
    return {"message": "Match removed", "success": True}


@router.get("/{mentor_id}", response_model=MentorResponse)
async def get_mentor_details(
    mentor_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific mentor
    """
    result = db.query(Mentor, User).join(
        User, Mentor.user_id == User.id
    ).filter(Mentor.id == mentor_id).first()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor not found"
        )
    
    mentor, user = result
    
    # Get university name
    university_name = None
    if user.university_id:
        university = db.query(University).filter(University.id == user.university_id).first()
        if university:
            university_name = university.name
    
    # Get profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    
    # Parse expertise
    try:
        expertise_list = json.loads(mentor.expertise) if mentor.expertise else []
    except:
        expertise_list = []
    
    # Calculate match score
    match_score = calculate_match_score(current_user, mentor, user)
    
    return MentorResponse(
        id=mentor.id,
        user_id=user.id,
        name=user.name,
        avatar=user.avatar,
        title=profile.job_title if profile else mentor.title,
        company=profile.company if profile else mentor.company,
        university=university_name,
        graduation_year=str(user.graduation_year) if user.graduation_year else None,
        location=mentor.location or (profile.city if profile else None),
        expertise=expertise_list,
        bio=mentor.bio or (profile.bio if profile else None),
        availability=mentor.availability or "Medium",
        match_score=match_score,
        mentees_count=mentor.mentees_count or 0,
        years_experience=mentor.years_experience or 0
    )

