"""
Database initialization script
"""
import asyncio
from sqlalchemy import text
from app.db.session import sync_engine, SessionLocal
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.university import University
from app.core.logging import logger


def init_db():
    """Initialize database with seed data"""
    db = SessionLocal()
    try:
        # Create default university if not exists
        default_university = db.query(University).filter(University.name == "Default University").first()
        if not default_university:
            default_university = University(
                name="Default University",
                code="DEFAULT",
                description="Default university for testing",
                location="Unknown"
            )
            db.add(default_university)
            db.commit()
            db.refresh(default_university)
            logger.info("Created default university: Default University")
        
        # Create super admin user if not exists
        super_admin = db.query(User).filter(User.email == "superadmin@alumni-portal.com").first()
        if not super_admin:
            super_admin = User(
                email="superadmin@alumni-portal.com",
                username="superadmin",
                hashed_password=get_password_hash("superadmin123"),
                full_name="Super Administrator",
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(super_admin)
            db.commit()
            logger.info("Created super admin user: superadmin@alumni-portal.com / superadmin123")

        # Create university admin user if not exists
        university_admin = db.query(User).filter(User.email == "university@alumni-portal.com").first()
        if not university_admin:
            university_admin = User(
                email="university@alumni-portal.com",
                username="university",
                hashed_password=get_password_hash("university123"),
                full_name="University Administrator",
                role=UserRole.UNIVERSITY_ADMIN,
                is_active=True,
                is_verified=True,
                university_id=default_university.id
            )
            db.add(university_admin)
            db.commit()
            logger.info("Created university admin user: university@alumni-portal.com / university123")

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
                is_verified=True,
                university_id=default_university.id
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


