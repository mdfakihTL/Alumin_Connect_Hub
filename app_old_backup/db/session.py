"""
Database session management
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Async engine for FastAPI
# asyncpg doesn't support sslmode in connection string, need to parse and convert
import ssl
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

def prepare_async_url(url: str) -> str:
    """Convert PostgreSQL URL with sslmode to asyncpg-compatible format"""
    parsed = urlparse(url)
    query_params = parse_qs(parsed.query)
    
    # Remove sslmode from query and handle SSL separately
    ssl_mode = query_params.pop('sslmode', ['prefer'])[0] if 'sslmode' in query_params else 'prefer'
    channel_binding = query_params.pop('channel_binding', None)
    
    # Rebuild query without sslmode
    new_query = urlencode(query_params, doseq=True)
    new_url = urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        parsed.params,
        new_query,
        parsed.fragment
    ))
    
    return new_url, ssl_mode

async_url, ssl_mode = prepare_async_url(settings.DATABASE_URL)

# Configure SSL for asyncpg
ssl_context = None
if ssl_mode == 'require':
    ssl_context = ssl.create_default_context()

async_engine = create_async_engine(
    async_url,
    echo=settings.DEBUG,
    future=True,
    connect_args={"ssl": ssl_context} if ssl_context else {},
)

# Sync engine for Alembic migrations
sync_engine = create_engine(
    settings.DATABASE_URL_SYNC,
    echo=settings.DEBUG,
    future=True,
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Sync session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=sync_engine,
)


async def get_async_session() -> AsyncSession:
    """Dependency for getting async database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def get_sync_session():
    """Dependency for getting sync database session"""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


