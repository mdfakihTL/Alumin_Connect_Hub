"""
Base database configuration and declarative base
"""
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import declared_attr
from sqlalchemy import Column, Integer, DateTime
from datetime import datetime, timezone

Base = declarative_base()


def utc_now():
    """Get current UTC datetime (timezone-naive for PostgreSQL compatibility)"""
    return datetime.utcnow()


class BaseModel(Base):
    """Abstract base model with common fields"""
    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()


