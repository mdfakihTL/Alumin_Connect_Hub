"""Knowledge Base Document model for S3-stored documents."""
from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class KnowledgeBaseDocument(Base):
    """
    Stores knowledge base documents with S3 paths.
    These documents are used by the AI chatbot to answer questions.
    """
    __tablename__ = "knowledge_base_documents"
    
    id = Column(String, primary_key=True)
    university_id = Column(String, nullable=False, index=True)  # e.g., 'mit'
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    filename = Column(String, nullable=False)
    s3_key = Column(String, nullable=False)  # S3 object key
    s3_url = Column(String, nullable=False)  # Full CloudFront/S3 URL
    file_type = Column(String, default='txt')  # txt, pdf, md, etc.
    file_size = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    uploaded_by = Column(String, nullable=True)  # Admin user ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<KnowledgeBaseDocument {self.title} ({self.university_id})>"

