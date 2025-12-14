"""
User model for authentication and authorization
"""
from sqlalchemy import Column, String, Boolean, Enum as SQLEnum, TypeDecorator, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ENUM
import enum
from app.db.base import BaseModel


class UserRole(str, enum.Enum):
    """User roles - values must match PostgreSQL enum (uppercase)"""
    SUPER_ADMIN = "SUPER_ADMIN"
    UNIVERSITY_ADMIN = "UNIVERSITY_ADMIN"
    ALUMNI = "ALUMNI"
    GUEST = "GUEST"


class UserRoleEnum(TypeDecorator):
    """Custom type to properly convert UserRole enum to PostgreSQL enum"""
    impl = ENUM
    cache_ok = True
    
    def __init__(self):
        super().__init__(
            'SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'ALUMNI', 'GUEST',
            name='userrole',
            native_enum=True
        )
    
    def process_bind_param(self, value, dialect):
        """Convert enum to its value (string)"""
        if value is None:
            return None
        if isinstance(value, UserRole):
            return value.value
        return value
    
    def process_result_value(self, value, dialect):
        """Convert database value to enum"""
        if value is None:
            return None
        if isinstance(value, str):
            # Map database values to enum members
            mapping = {
                'SUPER_ADMIN': UserRole.SUPER_ADMIN,
                'UNIVERSITY_ADMIN': UserRole.UNIVERSITY_ADMIN,
                'ALUMNI': UserRole.ALUMNI,
                'GUEST': UserRole.GUEST
            }
            return mapping.get(value, UserRole.GUEST)
        return value


class User(BaseModel):
    """User model"""
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    role = Column(UserRoleEnum(), default=UserRole.GUEST, nullable=False)
    last_login = Column(String(255), nullable=True)
    refresh_token = Column(String(512), nullable=True)
    university_id = Column(Integer, ForeignKey("universities.id", ondelete="SET NULL"), nullable=True, index=True)

    # Relationships
    university = relationship("University", back_populates="users")
    alumni_profile = relationship("AlumniProfile", back_populates="user", uselist=False)
    events_created = relationship("Event", back_populates="creator", foreign_keys="Event.creator_id")
    job_postings = relationship("JobPosting", back_populates="poster")
    documents = relationship("Document", back_populates="uploader")
    chat_sessions = relationship("ChatSession", back_populates="user")


