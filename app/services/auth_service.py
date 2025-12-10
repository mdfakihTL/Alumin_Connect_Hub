"""
Authentication service
"""
from typing import Optional
from datetime import timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserLogin, Token, UserResponse
from app.models.user import UserRole


class AuthService:
    """Service for authentication operations"""

    def __init__(self, session: AsyncSession):
        self.user_repo = UserRepository(session)
        self.session = session

    async def register(self, user_data: UserCreate) -> dict:
        """Register a new user"""
        # Check if user already exists
        existing_user = await self.user_repo.get_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        existing_username = await self.user_repo.get_by_username(user_data.username)
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

        # Create user
        hashed_password = get_password_hash(user_data.password)
        user = await self.user_repo.create(user_data, hashed_password)

        # Generate tokens - convert role to string if it's an enum
        role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
        access_token = create_access_token(
            data={"sub": str(user.id), "username": user.username, "role": role_str}
        )
        refresh_token = create_refresh_token(
            data={"sub": str(user.id), "username": user.username}
        )

        # Save refresh token
        await self.user_repo.update_refresh_token(user.id, refresh_token)

        # Convert user to response schema
        user_response = UserResponse.model_validate(user)

        return {
            "user": user_response.model_dump(),
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    async def login(self, credentials: UserLogin) -> Token:
        """Authenticate user and return tokens"""
        user = await self.user_repo.get_by_username(credentials.username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )

        if not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )

        # Generate tokens - convert role to string if it's an enum
        role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
        access_token = create_access_token(
            data={"sub": str(user.id), "username": user.username, "role": role_str}
        )
        refresh_token = create_refresh_token(
            data={"sub": str(user.id), "username": user.username}
        )

        # Save refresh token
        await self.user_repo.update_refresh_token(user.id, refresh_token)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )

    async def refresh_token(self, refresh_token: str) -> Token:
        """Refresh access token"""
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        user_id = int(payload.get("sub"))
        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )

        # Generate new tokens
        access_token = create_access_token(
            data={"sub": str(user.id), "username": user.username, "role": user.role}
        )
        new_refresh_token = create_refresh_token(
            data={"sub": str(user.id), "username": user.username}
        )

        # Save new refresh token
        await self.user_repo.update_refresh_token(user.id, new_refresh_token)

        return Token(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer"
        )

    async def logout(self, user_id: int) -> bool:
        """Logout user by invalidating refresh token"""
        await self.user_repo.update_refresh_token(user_id, None)
        return True


