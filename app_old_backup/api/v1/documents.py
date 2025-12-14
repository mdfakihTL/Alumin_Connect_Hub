"""
Document endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_async_session
from app.services.document_service import DocumentService
from app.schemas.document import (
    DocumentCreate, DocumentUpdate, DocumentResponse,
    DocumentSearchQuery, DocumentSearchResult, DocumentUploadResponse
)
from app.api.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    is_public: bool = Form(False),
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Upload a document"""
    document_data = DocumentCreate(
        title=title,
        description=description,
        is_public=is_public
    )
    document_service = DocumentService(session)
    result = await document_service.upload_document(file, document_data, current_user.id)
    return result


@router.post("/search", response_model=List[DocumentSearchResult])
async def search_documents(
    query: DocumentSearchQuery,
    current_user: Optional[User] = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Search documents using vector similarity"""
    document_service = DocumentService(session)
    user_id = current_user.id if current_user else None
    return await document_service.search_documents(query, user_id)


@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    skip: int = 0,
    limit: int = 100,
    current_user: Optional[User] = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """List documents"""
    document_service = DocumentService(session)
    user_id = current_user.id if current_user else None
    documents = await document_service.list_documents(skip, limit, user_id)
    return documents


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    current_user: Optional[User] = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Get document by ID"""
    document_service = DocumentService(session)
    user_id = current_user.id if current_user else None
    return await document_service.get_document(document_id, user_id)


@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    document_data: DocumentUpdate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Update document"""
    document_service = DocumentService(session)
    return await document_service.update_document(document_id, document_data, current_user.id)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Delete document"""
    document_service = DocumentService(session)
    await document_service.delete_document(document_id, current_user.id)
    return None


