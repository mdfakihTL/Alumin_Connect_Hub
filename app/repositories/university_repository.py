"""
University repository for database operations
"""
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from app.models.university import University


class UniversityRepository:
    """Repository for university operations"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, university_id: int) -> Optional[University]:
        """Get university by ID"""
        result = await self.session.execute(
            select(University).where(University.id == university_id)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Optional[University]:
        """Get university by name"""
        result = await self.session.execute(
            select(University).where(University.name == name)
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Optional[University]:
        """Get university by code"""
        result = await self.session.execute(
            select(University).where(University.code == code)
        )
        return result.scalar_one_or_none()

    async def create(self, name: str, code: Optional[str] = None, 
                    description: Optional[str] = None, 
                    location: Optional[str] = None) -> University:
        """Create new university"""
        university = University(
            name=name,
            code=code,
            description=description,
            location=location
        )
        self.session.add(university)
        await self.session.commit()
        await self.session.refresh(university)
        return university

    async def update_website_template(self, university_id: int, template: Optional[str]) -> Optional[University]:
        """Update university website template"""
        await self.session.execute(
            update(University).where(University.id == university_id).values(website_template=template)
        )
        await self.session.commit()
        return await self.get_by_id(university_id)

    async def list_universities(self, skip: int = 0, limit: int = 100) -> List[University]:
        """List universities with pagination"""
        result = await self.session.execute(
            select(University)
            .offset(skip)
            .limit(limit)
            .order_by(University.name)
        )
        return list(result.scalars().all())

