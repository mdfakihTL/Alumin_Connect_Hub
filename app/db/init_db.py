"""
Database initialization script
"""
import asyncio
from sqlalchemy import text
from app.db.session import sync_engine, SessionLocal
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.core.logging import logger


def init_db():
    """Initialize database with seed data"""
    db = SessionLocal()
    try:
        # Create admin user if not exists
        admin_user = db.query(User).filter(User.email == "admin@alumni-portal.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@alumni-portal.com",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                full_name="System Administrator",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(admin_user)
            db.commit()
            logger.info("Created admin user: admin@alumni-portal.com / admin123")

        # Create test alumni user
        alumni_user = db.query(User).filter(User.email == "alumni@example.com").first()
        if not alumni_user:
            alumni_user = User(
                email="alumni@example.com",
                username="alumni",
                hashed_password=get_password_hash("alumni123"),
                full_name="Test Alumni",
                role=UserRole.ALUMNI,
                is_active=True,
                is_verified=True
            )
            db.add(alumni_user)
            db.commit()
            logger.info("Created test alumni user: alumni@example.com / alumni123")

        logger.info("Database initialization completed")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()


