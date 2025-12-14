"""
Document schemas
"""
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.document import DocumentType, DocumentStatus


class DocumentBase(BaseModel):
    """Base document schema"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_public: bool = False


class DocumentCreate(DocumentBase):
    """Schema for document creation"""
    pass


class DocumentUpdate(BaseModel):
    """Schema for document update"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_public: Optional[bool] = None


class DocumentResponse(DocumentBase):
    """Document response schema"""
    id: int
    file_name: str
    file_size: int
    file_type: DocumentType
    mime_type: str
    status: DocumentStatus
    uploader_id: int
    chroma_id: Optional[str] = None
    metadata: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentUploadResponse(BaseModel):
    """Document upload response"""
    document: DocumentResponse
    message: str


class DocumentSearchQuery(BaseModel):
    """Schema for document search query"""
    query: str = Field(..., min_length=1)
    limit: int = Field(10, ge=1, le=50)
    filter_metadata: Optional[Dict[str, Any]] = None


class DocumentSearchResult(BaseModel):
    """Document search result schema"""
    document_id: int
    document_title: str
    chunk_text: str
    chunk_index: int
    similarity_score: float
    metadata: Optional[Dict[str, Any]] = None


