"""
Document models for file uploads and vector search
"""
from sqlalchemy import Column, String, Text, ForeignKey, Integer, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel


class DocumentType(str, enum.Enum):
    """Document types"""
    PDF = "pdf"
    DOC = "doc"
    DOCX = "docx"
    TXT = "txt"
    MD = "md"
    OTHER = "other"


class DocumentStatus(str, enum.Enum):
    """Document processing status"""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class Document(BaseModel):
    """Document model"""
    __tablename__ = "documents"

    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    file_path = Column(String(512), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    file_type = Column(SQLEnum(DocumentType), nullable=False)
    mime_type = Column(String(100), nullable=False)
    status = Column(SQLEnum(DocumentStatus), default=DocumentStatus.UPLOADED, nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    uploader_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=False)
    chroma_id = Column(String(255), nullable=True, index=True)  # ChromaDB document ID
    extra_metadata = Column("metadata", Text, nullable=True)  # JSON string for additional metadata (stored as 'metadata' in DB)

    # Relationships
    uploader = relationship("User", back_populates="documents")
    embeddings = relationship("DocumentEmbedding", back_populates="document", cascade="all, delete-orphan")


class DocumentEmbedding(BaseModel):
    """Document embedding metadata"""
    __tablename__ = "document_embeddings"

    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)  # Index of chunk in document
    chunk_text = Column(Text, nullable=False)  # Text content of chunk
    chunk_start = Column(Integer, nullable=True)  # Start position in original document
    chunk_end = Column(Integer, nullable=True)  # End position in original document
    embedding_vector_id = Column(String(255), nullable=True)  # Reference to vector in ChromaDB
    extra_metadata = Column("metadata", Text, nullable=True)  # JSON string for chunk metadata (stored as 'metadata' in DB)

    # Relationships
    document = relationship("Document", back_populates="embeddings")


