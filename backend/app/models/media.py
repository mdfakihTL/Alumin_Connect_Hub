"""
Temporary media storage model for storing files in database
This is a temporary solution until S3 public access is configured
"""
import uuid
from sqlalchemy import Column, String, Text, DateTime, Integer
from sqlalchemy.sql import func
from app.core.database import Base


class Media(Base):
    __tablename__ = "media"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)  # e.g., image/png, video/mp4
    file_data = Column(Text, nullable=False)  # Base64 encoded file content
    file_size = Column(Integer, nullable=False)  # Size in bytes
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

