"""
Alumni profile repository
"""
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from app.models.alumni import AlumniProfile
from app.schemas.alumni import AlumniProfileCreate, AlumniProfileUpdate
import json


class AlumniRepository:
    """Repository for alumni profile operations"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, profile_id: int) -> Optional[AlumniProfile]:
        """Get alumni profile by ID"""
        result = await self.session.execute(
            select(AlumniProfile)
            .where(AlumniProfile.id == profile_id)
            .options(selectinload(AlumniProfile.user))
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: int) -> Optional[AlumniProfile]:
        """Get alumni profile by user ID"""
        result = await self.session.execute(
            select(AlumniProfile)
            .where(AlumniProfile.user_id == user_id)
            .options(selectinload(AlumniProfile.user))
        )
        return result.scalar_one_or_none()

    async def create(self, profile_data: AlumniProfileCreate) -> AlumniProfile:
        """Create new alumni profile"""
        data = profile_data.model_dump(exclude_unset=True)
        # Convert lists to JSON strings
        if 'skills' in data and isinstance(data['skills'], list):
            data['skills'] = json.dumps(data['skills'])
        if 'interests' in data and isinstance(data['interests'], list):
            data['interests'] = json.dumps(data['interests'])

        profile = AlumniProfile(**data)
        self.session.add(profile)
        await self.session.commit()
        await self.session.refresh(profile)
        return profile

    async def update(self, profile_id: int, profile_data: AlumniProfileUpdate) -> Optional[AlumniProfile]:
        """Update alumni profile"""
        update_data = profile_data.model_dump(exclude_unset=True)
        if not update_data:
            return await self.get_by_id(profile_id)

        # Convert lists to JSON strings
        if 'skills' in update_data and isinstance(update_data['skills'], list):
            update_data['skills'] = json.dumps(update_data['skills'])
        if 'interests' in update_data and isinstance(update_data['interests'], list):
            update_data['interests'] = json.dumps(update_data['interests'])

        await self.session.execute(
            update(AlumniProfile).where(AlumniProfile.id == profile_id).values(**update_data)
        )
        await self.session.commit()
        return await self.get_by_id(profile_id)

    async def list_profiles(self, skip: int = 0, limit: int = 100) -> List[AlumniProfile]:
        """List alumni profiles with pagination"""
        result = await self.session.execute(
            select(AlumniProfile)
            .options(selectinload(AlumniProfile.user))
            .offset(skip)
            .limit(limit)
            .order_by(AlumniProfile.created_at.desc())
        )
        return list(result.scalars().all())

    async def search(self, query: str, skip: int = 0, limit: int = 100) -> List[AlumniProfile]:
        """Search alumni profiles"""
        search_term = f"%{query}%"
        result = await self.session.execute(
            select(AlumniProfile)
            .options(selectinload(AlumniProfile.user))
            .where(
                (AlumniProfile.bio.ilike(search_term)) |
                (AlumniProfile.current_position.ilike(search_term)) |
                (AlumniProfile.company.ilike(search_term)) |
                (AlumniProfile.major.ilike(search_term))
            )
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())


