"""
User management endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_async_session
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserResponse, UserUpdate
from app.api.dependencies import (
    get_current_active_user, 
    require_super_admin, 
    require_university_admin
)
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Update current user"""
    user_repo = UserRepository(session)
    updated = await user_repo.update(current_user.id, user_data)
    return updated


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_university_admin),  # University admin and super admin can list
    session: AsyncSession = Depends(get_async_session)
):
    """List all users (university admin and super admin only)"""
    user_repo = UserRepository(session)
    users = await user_repo.list_users(skip, limit)
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(require_university_admin),  # University admin and super admin can view
    session: AsyncSession = Depends(get_async_session)
):
    """Get user by ID (university admin and super admin only)"""
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


