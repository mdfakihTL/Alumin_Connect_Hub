"""
Chat endpoints for AI-powered Q&A
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_async_session
from app.services.chat_service import ChatService
from app.schemas.chat import (
    ChatMessageCreate, ChatResponse, ChatSessionResponse,
    ChatSessionWithMessages, ChatMessageResponse
)
from app.api.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/message", response_model=ChatResponse)
async def send_message(
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Send a message and get AI response with RAG"""
    chat_service = ChatService(session)
    return await chat_service.send_message(message_data, current_user.id)


@router.get("/sessions", response_model=List[ChatSessionResponse])
async def list_sessions(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """List user's chat sessions"""
    chat_service = ChatService(session)
    sessions = await chat_service.list_sessions(current_user.id, skip, limit)
    return sessions


@router.get("/sessions/{session_id}", response_model=ChatSessionWithMessages)
async def get_session(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Get chat session with messages"""
    chat_service = ChatService(session)
    chat_session = await chat_service.get_session(session_id, current_user.id)
    if not chat_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    messages = await chat_service.get_session_messages(session_id, current_user.id)
    return ChatSessionWithMessages(
        **chat_session.__dict__,
        messages=messages
    )


