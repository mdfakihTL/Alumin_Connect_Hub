"""
MIT Knowledge Base API Routes - MVP/Demo Version

Endpoints:
- POST /admin/knowledge-base/upload - Upload a document
- GET /admin/knowledge-base/documents - List all documents
- DELETE /admin/knowledge-base/documents/{filename} - Delete a document
- GET /admin/knowledge-base/status - Get KB status
- POST /chat/query - Ask a question (RAG endpoint)

DUMMY NOTES:
- No authentication required (trusted admin access)
- Single university (MIT) hardcoded
- Uses keyword matching instead of vector search
- OpenAI integration for answer generation
"""

import os
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
import logging

from app.services.knowledge_base import (
    save_uploaded_document,
    list_documents,
    delete_document,
    get_knowledge_base_status,
    retrieve_relevant_chunks,
    build_context,
    UNIVERSITY_ID,
    UNIVERSITY_NAME,
)

logger = logging.getLogger(__name__)

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


# ==============================================================================
# CHAT ENDPOINT
# ==============================================================================

def generate_answer_with_llm(question: str, context: str) -> str:
    """
    Generate an answer using OpenAI API.
    
    DUMMY NOTES:
    - Falls back to simple response if OpenAI key not set
    - Uses GPT-3.5-turbo for cost efficiency in demo
    
    Args:
        question: User's question
        context: Retrieved context from knowledge base
        
    Returns:
        Generated answer string
    """
    openai_api_key = os.getenv("OPENAI_API_KEY")
    
    if not openai_api_key:
        # DUMMY: Return context-based response without LLM
        logger.warning("OPENAI_API_KEY not set. Returning simple response.")
        
        if not context:
            return (
                "I don't have any relevant information in the MIT knowledge base "
                "to answer your question. Please make sure documents have been uploaded."
            )
        
        return (
            f"Based on the MIT knowledge base:\n\n"
            f"{context}\n\n"
            f"[Note: This is a simplified response. Set OPENAI_API_KEY for AI-generated answers.]"
        )
    
    # Use OpenAI to generate answer
    try:
        import openai
        
        client = openai.OpenAI(api_key=openai_api_key)
        
        system_prompt = f"""You are an AI assistant for {UNIVERSITY_NAME} ({UNIVERSITY_ID.upper()}).
You MUST only answer questions based on the provided context from MIT documents.
If the context doesn't contain relevant information, say you don't have that information.
Do NOT make up information. Be helpful and concise.
Always cite which document the information came from."""
        
        user_prompt = f"""Context from MIT knowledge base:
{context if context else "No relevant documents found."}

Question: {question}

Please answer the question based ONLY on the context above. If the context doesn't contain the answer, say so."""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  # Using 3.5 for cost efficiency in demo
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,  # Lower temperature for more factual responses
            max_tokens=500
        )
        
        return response.choices[0].message.content
        
    except ImportError:
        logger.error("OpenAI package not installed")
        return f"OpenAI package not installed. Based on documents:\n\n{context}"
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        return f"Error generating AI response. Based on documents:\n\n{context}"


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

