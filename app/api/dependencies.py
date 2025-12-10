"""
API dependencies for authentication and authorization
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_async_session
from app.repositories.user_repository import UserRepository
from app.core.security import decode_token
from app.models.user import UserRole, User

# Use HTTPBearer for simpler Bearer token authentication in Swagger UI
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_async_session)
) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception

    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(int(user_id))
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user"""
    return current_user


def require_role(allowed_roles: list[UserRole]):
    """Dependency factory for role-based access control"""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        # Convert current_user.role to string (handles both enum and string)
        user_role_str = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
        # Convert allowed roles to strings for comparison
        allowed_role_values = [role.value for role in allowed_roles]
        if user_role_str not in allowed_role_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker


# Common role dependencies
require_super_admin = require_role([UserRole.SUPER_ADMIN])
require_university_admin = require_role([UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN])
require_alumni = require_role([UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.ALUMNI])

# Legacy aliases for backward compatibility
require_admin = require_university_admin  # University admin is the standard admin

