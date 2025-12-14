"""
Document repository
"""
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from app.models.document import Document, DocumentEmbedding, DocumentStatus
from app.schemas.document import DocumentCreate, DocumentUpdate


class DocumentRepository:
    """Repository for document operations"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, document_id: int) -> Optional[Document]:
        """Get document by ID"""
        result = await self.session.execute(
            select(Document)
            .where(Document.id == document_id)
            .options(selectinload(Document.uploader))
        )
        return result.scalar_one_or_none()

    async def get_by_chroma_id(self, chroma_id: str) -> Optional[Document]:
        """Get document by ChromaDB ID"""
        result = await self.session.execute(
            select(Document).where(Document.chroma_id == chroma_id)
        )
        return result.scalar_one_or_none()

    async def create(self, document_data: DocumentCreate, file_info: dict, uploader_id: int) -> Document:
        """Create new document"""
        document = Document(
            title=document_data.title,
            description=document_data.description,
            file_path=file_info['file_path'],
            file_name=file_info['file_name'],
            file_size=file_info['file_size'],
            file_type=file_info['file_type'],
            mime_type=file_info['mime_type'],
            is_public=document_data.is_public,
            uploader_id=uploader_id,
            status=DocumentStatus.UPLOADED
        )
        self.session.add(document)
        await self.session.commit()
        await self.session.refresh(document)
        return document

    async def update(self, document_id: int, document_data: DocumentUpdate) -> Optional[Document]:
        """Update document"""
        update_data = document_data.model_dump(exclude_unset=True)
        if not update_data:
            return await self.get_by_id(document_id)

        await self.session.execute(
            update(Document).where(Document.id == document_id).values(**update_data)
        )
        await self.session.commit()
        return await self.get_by_id(document_id)

    async def update_status(self, document_id: int, status: DocumentStatus, chroma_id: Optional[str] = None) -> None:
        """Update document status"""
        update_data = {"status": status}
        if chroma_id:
            update_data["chroma_id"] = chroma_id

        await self.session.execute(
            update(Document).where(Document.id == document_id).values(**update_data)
        )
        await self.session.commit()

    async def list_documents(self, skip: int = 0, limit: int = 100, user_id: Optional[int] = None) -> List[Document]:
        """List documents with pagination"""
        query = select(Document).options(selectinload(Document.uploader))
        
        if user_id:
            query = query.where(Document.uploader_id == user_id)
        
        result = await self.session.execute(
            query.offset(skip).limit(limit).order_by(Document.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_public_documents(self, skip: int = 0, limit: int = 100) -> List[Document]:
        """List public documents"""
        result = await self.session.execute(
            select(Document)
            .where(Document.is_public == True)
            .options(selectinload(Document.uploader))
            .offset(skip)
            .limit(limit)
            .order_by(Document.created_at.desc())
        )
        return list(result.scalars().all())

    async def create_embedding(self, document_id: int, embedding_data: dict) -> DocumentEmbedding:
        """Create document embedding record"""
        embedding = DocumentEmbedding(
            document_id=document_id,
            chunk_index=embedding_data['chunk_index'],
            chunk_text=embedding_data['chunk_text'],
            chunk_start=embedding_data.get('chunk_start'),
            chunk_end=embedding_data.get('chunk_end'),
            embedding_vector_id=embedding_data.get('embedding_vector_id'),
            metadata=embedding_data.get('metadata')
        )
        self.session.add(embedding)
        await self.session.commit()
        await self.session.refresh(embedding)
        return embedding

    async def delete(self, document_id: int) -> bool:
        """Delete document"""
        await self.session.execute(
            delete(Document).where(Document.id == document_id)
        )
        await self.session.commit()
        return True

