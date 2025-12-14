"""
University model
"""
from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship
from app.db.base import BaseModel


class University(BaseModel):
    """University model"""
    __tablename__ = "universities"

    name = Column(String(255), nullable=False, unique=True, index=True)
    code = Column(String(50), nullable=True, unique=True, index=True)  # Short code like "MIT", "STANFORD"
    website_template = Column(String(100), nullable=True)  # Template choice for this university
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)

    # Relationships
    users = relationship("User", back_populates="university")

