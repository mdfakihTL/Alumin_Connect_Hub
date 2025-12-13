"""
Authentication endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
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


@router.get("/template", response_model=dict)
async def get_university_template(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Get university's website template"""
    from app.repositories.university_repository import UniversityRepository
    
    if not current_user.university_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not associated with a university"
        )
    
    university_repo = UniversityRepository(session)
    university = await university_repo.get_by_id(current_user.university_id)
    
    if not university:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not found"
        )
    
    return {
        "website_template": university.website_template,
        "university_name": university.name,
        "university_id": university.id,
        "username": current_user.username,
        "role": current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    }


@router.put("/template", response_model=dict)
async def update_university_template(
    template: str = Query(..., description="Template name (e.g., 'classic-red')"),
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Update university's website template (admin only)"""
    from app.models.user import UserRole
    from app.repositories.university_repository import UniversityRepository
    
    # Check if user is admin
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN]
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update template settings"
        )
    
    if not current_user.university_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin is not associated with a university"
        )
    
    # Validate template
    if not template or len(template.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template name cannot be empty"
        )
    
    # Update university template
    university_repo = UniversityRepository(session)
    updated_university = await university_repo.update_website_template(
        current_user.university_id, template.strip()
    )
    
    if not updated_university:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="University not found"
        )
    
    return {
        "message": "University template updated successfully",
        "website_template": updated_university.website_template,
        "university_name": updated_university.name,
        "username": current_user.username
    }


