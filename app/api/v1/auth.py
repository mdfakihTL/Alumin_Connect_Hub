"""
Authentication endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_async_session
from app.services.auth_service import AuthService
from app.schemas.user import UserCreate, UserLogin, Token, UserResponse
from app.api.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    session: AsyncSession = Depends(get_async_session)
):
    """Register a new user"""
    auth_service = AuthService(session)
    result = await auth_service.register(user_data)
    return result


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    session: AsyncSession = Depends(get_async_session)
):
    """Login and get access token"""
    auth_service = AuthService(session)
    return await auth_service.login(credentials)


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    session: AsyncSession = Depends(get_async_session)
):
    """Refresh access token"""
    auth_service = AuthService(session)
    return await auth_service.refresh_token(refresh_token)


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Logout user"""
    auth_service = AuthService(session)
    await auth_service.logout(current_user.id)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information"""
    return current_user


