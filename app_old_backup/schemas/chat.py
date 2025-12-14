"""
Chat schemas for AI Q&A
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ChatMessageBase(BaseModel):
    """Base chat message schema"""
    content: str = Field(..., min_length=1)
    role: str = Field(..., pattern="^(user|assistant|system)$")


class ChatMessageCreate(BaseModel):
    """Schema for creating chat message"""
    content: str = Field(..., min_length=1)
    session_id: Optional[int] = None  # If None, create new session


class ChatMessageResponse(ChatMessageBase):
    """Chat message response schema"""
    id: int
    session_id: int
    metadata: Optional[str] = None
    tokens_used: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatSessionCreate(BaseModel):
    """Schema for creating chat session"""
    title: Optional[str] = None


class ChatSessionResponse(BaseModel):
    """Chat session response schema"""
    id: int
    user_id: int
    title: Optional[str] = None
    is_active: bool
    last_message_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatSessionWithMessages(ChatSessionResponse):
    """Chat session with messages"""
    messages: List[ChatMessageResponse] = []


class ChatResponse(BaseModel):
    """Chat response with message and sources"""
    message: ChatMessageResponse
    session: ChatSessionResponse
    sources: Optional[List[Dict[str, Any]]] = None  # Document sources for RAG


