"""
Alumni profile endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_async_session
from app.repositories.alumni_repository import AlumniRepository
from app.schemas.alumni import AlumniProfileCreate, AlumniProfileUpdate, AlumniProfileResponse
from app.api.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/alumni", tags=["Alumni"])


@router.post("/", response_model=AlumniProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_alumni_profile(
    profile_data: AlumniProfileCreate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Create alumni profile"""
    alumni_repo = AlumniRepository(session)
    # Set user_id from current user if not provided
    if not profile_data.user_id:
        profile_data.user_id = current_user.id
    profile = await alumni_repo.create(profile_data)
    return profile


@router.get("/", response_model=List[AlumniProfileResponse])
async def list_alumni_profiles(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_async_session)
):
    """List all alumni profiles"""
    alumni_repo = AlumniRepository(session)
    profiles = await alumni_repo.list_profiles(skip, limit)
    return profiles


@router.get("/me", response_model=AlumniProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Get current user's alumni profile"""
    alumni_repo = AlumniRepository(session)
    profile = await alumni_repo.get_by_user_id(current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumni profile not found"
        )
    return profile


@router.put("/me", response_model=AlumniProfileResponse)
async def update_my_profile(
    profile_data: AlumniProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Update current user's alumni profile"""
    alumni_repo = AlumniRepository(session)
    profile = await alumni_repo.get_by_user_id(current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumni profile not found"
        )
    updated = await alumni_repo.update(profile.id, profile_data)
    return updated


@router.get("/{profile_id}", response_model=AlumniProfileResponse)
async def get_alumni_profile(
    profile_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    """Get alumni profile by ID"""
    alumni_repo = AlumniRepository(session)
    profile = await alumni_repo.get_by_id(profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumni profile not found"
        )
    return profile


