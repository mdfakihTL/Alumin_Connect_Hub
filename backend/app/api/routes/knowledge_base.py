"""
Knowledge Base API Routes - S3 Integrated Version

Endpoints:
- POST /admin/knowledge-base/upload - Upload a document (local)
- POST /admin/knowledge-base/upload-s3 - Upload a document to S3
- GET /admin/knowledge-base/documents - List all documents
- DELETE /admin/knowledge-base/documents/{filename} - Delete a document
- GET /admin/knowledge-base/status - Get KB status
- POST /chat/query - Ask a question (RAG endpoint)
- POST /admin/knowledge-base/reload - Reload all documents including S3
"""

import os
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Form
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
import logging

from app.services.knowledge_base import (
    save_uploaded_document,
    list_documents,
    delete_document,
    get_knowledge_base_status,
    retrieve_relevant_chunks,
    build_context,
    load_all_documents_with_s3,
    UNIVERSITY_ID,
    UNIVERSITY_NAME,
)
from app.core.database import get_db
from app.services.s3_service import S3Service

logger = logging.getLogger(__name__)
s3_service = S3Service()

# ==============================================================================
# ROUTERS
# ==============================================================================

# Admin router for document management
admin_kb_router = APIRouter(prefix="/admin/knowledge-base", tags=["Knowledge Base Admin"])

# Chat router for user queries
chat_router = APIRouter(prefix="/chat", tags=["Knowledge Base Chat"])


# ==============================================================================
# PYDANTIC MODELS
# ==============================================================================

class ChatQueryRequest(BaseModel):
    """Request model for chat queries."""
    question: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "question": "What are the admission requirements for MIT?"
            }
        }


class ChatQueryResponse(BaseModel):
    """Response model for chat queries."""
    answer: str
    sources: List[str]
    university_id: str
    university_name: str
    context_used: str  # For debugging/transparency
    is_dummy: bool = True  # Flag indicating demo mode


class DocumentInfo(BaseModel):
    """Document information model."""
    filename: str
    size_bytes: int
    university_id: str


class UploadResponse(BaseModel):
    """Upload response model."""
    success: bool
    message: str
    filename: Optional[str] = None


class KBStatusResponse(BaseModel):
    """Knowledge base status response."""
    university_id: str
    university_name: str
    document_count: int
    chunk_count: int
    documents: List[str]
    storage_path: str
    is_dummy: bool
    notes: str


# ==============================================================================
# ADMIN ENDPOINTS
# ==============================================================================

@admin_kb_router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document to the MIT knowledge base.
    
    DUMMY NOTES:
    - No authentication (assumes trusted admin)
    - Only .txt files accepted
    - File saved to /data/knowledge_base/mit/
    - Knowledge base reloaded after upload
    
    Args:
        file: The .txt file to upload
        
    Returns:
        Upload result
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    if not file.filename.endswith('.txt'):
        raise HTTPException(
            status_code=400, 
            detail="Only .txt files are allowed. This is a demo limitation."
        )
    
    # Read file content
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {str(e)}")
    
    # Check file size (limit to 1MB for demo)
    max_size = 1 * 1024 * 1024  # 1MB
    if len(content) > max_size:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Max size is {max_size // 1024}KB for demo."
        )
    
    # Save document
    success = save_uploaded_document(file.filename, content)
    
    if success:
        return UploadResponse(
            success=True,
            message=f"Document '{file.filename}' uploaded successfully to MIT knowledge base",
            filename=file.filename
        )
    else:
        raise HTTPException(
            status_code=500, 
            detail="Failed to save document"
        )


@admin_kb_router.get("/documents", response_model=List[DocumentInfo])
async def get_documents():
    """
    List all documents in the MIT knowledge base.
    
    Returns:
        List of document information
    """
    documents = list_documents()
    return [DocumentInfo(**doc) for doc in documents]


@admin_kb_router.delete("/documents/{filename}")
async def remove_document(filename: str):
    """
    Delete a document from the MIT knowledge base.
    
    Args:
        filename: Name of the file to delete
        
    Returns:
        Deletion result
    """
    success = delete_document(filename)
    
    if success:
        return {"success": True, "message": f"Document '{filename}' deleted"}
    else:
        raise HTTPException(
            status_code=404, 
            detail=f"Document '{filename}' not found"
        )


@admin_kb_router.get("/status", response_model=KBStatusResponse)
async def get_status():
    """
    Get the current status of the MIT knowledge base.
    
    Returns:
        Knowledge base status information
    """
    status = get_knowledge_base_status()
    return KBStatusResponse(**status)


class S3UploadRequest(BaseModel):
    """Request model for S3 document upload."""
    title: str
    description: Optional[str] = None
    university_id: str = "mit"


class S3DocumentResponse(BaseModel):
    """Response model for S3 document operations."""
    success: bool
    message: str
    document_id: Optional[str] = None
    s3_url: Optional[str] = None


@admin_kb_router.post("/upload-s3", response_model=S3DocumentResponse)
async def upload_document_to_s3(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(None),
    university_id: str = Form("mit"),
    db: Session = Depends(get_db)
):
    """
    Upload a document to S3 and store reference in database.
    
    This endpoint:
    1. Uploads the file to S3 bucket
    2. Stores the S3 URL in the database
    3. Reloads the knowledge base to include the new document
    
    Args:
        file: The document file to upload
        title: Document title
        description: Optional description
        university_id: University ID (default: mit)
        
    Returns:
        Upload result with document ID and S3 URL
    """
    from app.models.knowledge_base import KnowledgeBaseDocument
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    # Check file type
    allowed_types = ['.txt', '.md', '.pdf', '.doc', '.docx']
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Supported: {', '.join(allowed_types)}"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Check file size (limit to 50MB)
        max_size = 50 * 1024 * 1024
        if len(content) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Max size is {max_size // (1024*1024)}MB"
            )
        
        # Upload to S3 - use alumni-portal prefix to match existing structure
        s3_folder = f"alumni-portal/knowledge-base/{university_id}"
        s3_url = await s3_service.upload_file_from_bytes(
            file_content=content,
            filename=file.filename,
            folder=s3_folder,
            content_type=file.content_type or "application/octet-stream"
        )
        
        if not s3_url:
            raise HTTPException(status_code=500, detail="Failed to upload to S3")
        
        # Create database record
        doc_id = str(uuid.uuid4())
        s3_key = f"{s3_folder}/{file.filename}"
        
        kb_doc = KnowledgeBaseDocument(
            id=doc_id,
            university_id=university_id,
            title=title,
            description=description,
            filename=file.filename,
            s3_key=s3_key,
            s3_url=s3_url,
            file_type=file_ext.lstrip('.'),
            file_size=len(content),
            is_active=True
        )
        
        db.add(kb_doc)
        db.commit()
        
        # Reload knowledge base to include new document
        load_all_documents_with_s3(db)
        
        logger.info(f"Uploaded KB document to S3: {title} ({file.filename})")
        
        return S3DocumentResponse(
            success=True,
            message=f"Document '{title}' uploaded successfully",
            document_id=doc_id,
            s3_url=s3_url
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading KB document to S3: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@admin_kb_router.get("/s3-documents")
async def list_s3_documents(
    university_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all S3-stored knowledge base documents for a university.
    
    Args:
        university_id: Optional university ID to filter by (defaults to user's university)
    
    Returns:
        List of S3 documents from database
    """
    from app.models.knowledge_base import KnowledgeBaseDocument
    
    # Use provided university_id or default to UNIVERSITY_ID constant
    filter_university = university_id if university_id else UNIVERSITY_ID
    
    docs = db.query(KnowledgeBaseDocument).filter(
        KnowledgeBaseDocument.university_id == filter_university
    ).all()
    
    return [
        {
            "id": doc.id,
            "title": doc.title,
            "description": doc.description,
            "filename": doc.filename,
            "s3_url": doc.s3_url,
            "file_type": doc.file_type,
            "file_size": doc.file_size,
            "is_active": doc.is_active,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
            "university_id": doc.university_id
        }
        for doc in docs
    ]


@admin_kb_router.delete("/s3-documents/{doc_id}")
async def delete_s3_document(doc_id: str, db: Session = Depends(get_db)):
    """
    Delete an S3 knowledge base document.
    
    Args:
        doc_id: Document ID to delete
        
    Returns:
        Deletion result
    """
    from app.models.knowledge_base import KnowledgeBaseDocument
    
    doc = db.query(KnowledgeBaseDocument).filter(
        KnowledgeBaseDocument.id == doc_id
    ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete from S3
    s3_deleted = False
    if doc.s3_url:
        s3_deleted = s3_service.delete_file(doc.s3_url)
        if s3_deleted:
            logger.info(f"Deleted from S3: {doc.s3_url}")
        else:
            logger.warning(f"Failed to delete from S3: {doc.s3_url}")
    
    # Delete from database
    doc_title = doc.title
    db.delete(doc)
    db.commit()
    
    # Reload knowledge base
    load_all_documents_with_s3(db)
    
    return {
        "success": True, 
        "message": f"Document '{doc_title}' deleted",
        "s3_deleted": s3_deleted
    }


@admin_kb_router.post("/reload")
async def reload_knowledge_base(db: Session = Depends(get_db)):
    """
    Reload all knowledge base documents (local + S3).
    
    Returns:
        Reload status with document counts
    """
    total = load_all_documents_with_s3(db)
    
    return {
        "success": True,
        "message": f"Knowledge base reloaded with {total} documents",
        "document_count": total
    }


# ==============================================================================
# CHAT ENDPOINT
# ==============================================================================

def generate_answer_with_llm(question: str, context: str) -> str:
    """
    Generate an answer using Groq AI (or fallback to OpenAI).
    
    Uses Groq's fast LLM inference with llama models.
    Falls back to simple response if no API key is set.
    
    Args:
        question: User's question
        context: Retrieved context from knowledge base
        
    Returns:
        Generated answer string
    """
    from app.core.config import settings
    
    groq_api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
    openai_api_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
    
    system_prompt = f"""You are a friendly and helpful AI assistant for {UNIVERSITY_NAME} ({UNIVERSITY_ID.upper()}).

Your role:
1. For greetings (hi, hello, hey, etc.) - respond warmly and introduce yourself as MIT's AI assistant, offering to help with questions about admissions, academics, campus life, alumni services, etc.
2. For questions about MIT - answer based on the provided context from MIT documents. Be accurate and cite sources when available.
3. For general questions - if context is available, use it. If not, politely explain you specialize in MIT-related information and offer to help with MIT topics.

Be conversational, helpful, and concise. Do NOT make up specific facts about MIT - only use provided context for MIT-specific information."""
    
    # Build appropriate user prompt based on whether we have context
    if context and context.strip():
        user_prompt = f"""Context from MIT knowledge base:
{context}

User message: {question}

Please provide a helpful response. If the user is asking about MIT topics, use the context above. For greetings or general chat, respond naturally."""
    else:
        user_prompt = f"""User message: {question}

No specific MIT documents were found for this query. If this is a greeting, respond warmly and offer to help with MIT-related questions. If it's a question about MIT that you can't answer without documents, let them know you can help with topics like admissions, academics, campus life, and alumni services if they ask about those."""

    # Try Groq first (faster)
    if groq_api_key:
        try:
            import requests
            
            headers = {
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "llama-3.3-70b-versatile",  # Latest Groq model
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 1000
            }
            
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            else:
                logger.error(f"Groq API error: {response.status_code} - {response.text}")
                
        except Exception as e:
            logger.error(f"Groq API error: {e}")
    
    # Fallback to OpenAI
    if openai_api_key:
        try:
            import openai
            
            client = openai.OpenAI(api_key=openai_api_key)
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
    
    # No API key set - return simple response
    logger.warning("No AI API key set (GROQ_API_KEY or OPENAI_API_KEY). Returning simple response.")
    
    if not context:
        return (
            "I don't have any relevant information in the MIT knowledge base "
            "to answer your question. Please make sure documents have been uploaded."
        )
    
    return (
        f"Based on the MIT knowledge base:\n\n"
        f"{context}\n\n"
        f"[Note: Set GROQ_API_KEY or OPENAI_API_KEY for AI-generated answers.]"
    )


@chat_router.post("/query", response_model=ChatQueryResponse)
async def chat_query(request: ChatQueryRequest):
    """
    Ask a question about MIT and get an AI-generated answer.
    
    This endpoint:
    1. Takes the user's question
    2. Retrieves relevant chunks using keyword matching (DUMMY)
    3. Builds context from retrieved chunks
    4. Passes context + question to LLM
    5. Returns the answer with sources
    
    DUMMY NOTES:
    - Uses simple keyword matching, not vector search
    - Falls back to simple response if no OpenAI key
    - Single university (MIT) only
    
    Args:
        request: ChatQueryRequest with the question
        
    Returns:
        ChatQueryResponse with answer and sources
    """
    question = request.question.strip()
    
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    if len(question) > 1000:
        raise HTTPException(status_code=400, detail="Question too long (max 1000 chars)")
    
    # Retrieve relevant chunks
    relevant_chunks = retrieve_relevant_chunks(question, top_k=3)
    
    # Build context
    context = build_context(relevant_chunks)
    
    # Get unique source documents
    sources = list(set(chunk.document_name for chunk in relevant_chunks))
    
    # Generate answer
    answer = generate_answer_with_llm(question, context)
    
    return ChatQueryResponse(
        answer=answer,
        sources=sources,
        university_id=UNIVERSITY_ID,
        university_name=UNIVERSITY_NAME,
        context_used=context[:500] + "..." if len(context) > 500 else context,
        is_dummy=True
    )


# ==============================================================================
# COMBINED ROUTER FOR MAIN APP
# ==============================================================================

# Create a combined router that includes both admin and chat routes
knowledge_base_router = APIRouter()
knowledge_base_router.include_router(admin_kb_router)
knowledge_base_router.include_router(chat_router)

