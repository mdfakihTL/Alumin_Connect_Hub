"""
Chat models for AI-powered Q&A
"""
from sqlalchemy import Column, String, Text, ForeignKey, Integer, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.db.base import BaseModel


class ChatSession(BaseModel):
    """Chat session model"""
    __tablename__ = "chat_sessions"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_message_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")


class ChatMessage(BaseModel):
    """Chat message model"""
    __tablename__ = "chat_messages"

    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    extra_metadata = Column("metadata", Text, nullable=True)  # JSON string for additional data (sources, citations, etc.) (stored as 'metadata' in DB)
    tokens_used = Column(Integer, nullable=True)  # For tracking API usage

    # Relationships
    session = relationship("ChatSession", back_populates="messages")


