"""
Pytest configuration and fixtures
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from app.main import app
from app.db.base import Base
from app.db.session import get_async_session
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole


# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/alumni_portal_test"
TEST_DATABASE_URL_SYNC = "postgresql://postgres:postgres@localhost:5432/alumni_portal_test"

# Create test engines
test_async_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_sync_engine = create_engine(TEST_DATABASE_URL_SYNC, echo=False)

TestAsyncSessionLocal = async_sessionmaker(
    test_async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)


@pytest.fixture(scope="function")
async def db_session():
    """Create a test database session"""
    async with test_async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestAsyncSessionLocal() as session:
        yield session
        await session.rollback()
    
    async with test_async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
async def client(db_session):
    """Create a test client"""
    async def override_get_session():
        yield db_session
    
    app.dependency_overrides[get_async_session] = override_get_session
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session):
    """Create a test user"""
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password=get_password_hash("testpass123"),
        full_name="Test User",
        role=UserRole.ALUMNI,
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def super_admin_user(db_session):
    """Create a super admin user"""
    user = User(
        email="superadmin@example.com",
        username="superadmin",
        hashed_password=get_password_hash("superadmin123"),
        full_name="Super Admin User",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def university_admin_user(db_session):
    """Create a university admin user"""
    user = User(
        email="university@example.com",
        username="university",
        hashed_password=get_password_hash("university123"),
        full_name="University Admin User",
        role=UserRole.UNIVERSITY_ADMIN,
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


