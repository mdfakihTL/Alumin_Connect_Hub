from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.message import Conversation, Message
from app.models.connection import Connection
from app.schemas.message import (
    MessageCreate, MessageResponse, ConversationResponse,
    ConversationUserResponse, ConversationMessagesResponse
)

router = APIRouter()


class CreateConversationRequest(BaseModel):
    user_id: str


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List all conversations for the current user.
    """
    conversations = db.query(Conversation).filter(
        or_(
            Conversation.user1_id == current_user.id,
            Conversation.user2_id == current_user.id
        )
    ).order_by(Conversation.last_message_time.desc()).all()
    
    responses = []
    for conv in conversations:
        # Get the other user
        other_user_id = conv.user2_id if conv.user1_id == current_user.id else conv.user1_id
        other_user = db.query(User).filter(User.id == other_user_id).first()
        
        if not other_user:
            continue
        
        # Count unread messages
        unread_count = db.query(Message).filter(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user.id,
            Message.is_read == False
        ).count()
        
        # Format time
        time_str = None
        if conv.last_message_time:
            now = datetime.utcnow()
            diff = now - conv.last_message_time
            if diff.total_seconds() < 3600:
                time_str = f"{int(diff.total_seconds() / 60)}m ago"
            elif diff.total_seconds() < 86400:
                time_str = f"{int(diff.total_seconds() / 3600)}h ago"
            else:
                time_str = f"{diff.days}d ago"
        
        responses.append(ConversationResponse(
            id=conv.id,
            user=ConversationUserResponse(
                id=other_user.id,
                name=other_user.name,
                avatar=other_user.avatar
            ),
            last_message=conv.last_message,
            time=time_str,
            unread=unread_count,
            is_group=False
        ))
    
    return responses


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get total unread message count for the current user.
    """
    # Get all conversations where user is a participant
    conversations = db.query(Conversation).filter(
        or_(
            Conversation.user1_id == current_user.id,
            Conversation.user2_id == current_user.id
        )
    ).all()
    
    total_unread = 0
    for conv in conversations:
        unread_count = db.query(Message).filter(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user.id,
            Message.is_read == False
        ).count()
        total_unread += unread_count
    
    return {"count": total_unread}


@router.post("/conversations", response_model=ConversationMessagesResponse)
async def create_or_get_conversation(
    request: CreateConversationRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create or get a conversation with another user.
    """
    user_id = request.user_id
    
    # Check if user exists
    other_user = db.query(User).filter(User.id == user_id).first()
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if conversation exists
    conversation = db.query(Conversation).filter(
        or_(
            and_(Conversation.user1_id == current_user.id, Conversation.user2_id == user_id),
            and_(Conversation.user1_id == user_id, Conversation.user2_id == current_user.id)
        )
    ).first()
    
    if not conversation:
        # Create new conversation
        conversation = Conversation(
            user1_id=current_user.id,
            user2_id=user_id
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    
    # Get messages
    messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at.asc()).all()
    
    message_responses = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        message_responses.append(MessageResponse(
            id=msg.id,
            content=msg.content,
            sender=sender.name if sender else "Unknown",
            timestamp=msg.created_at.strftime("%I:%M %p"),
            is_own=msg.sender_id == current_user.id
        ))
    
    time_str = None
    if conversation.last_message_time:
        time_str = conversation.last_message_time.strftime("%I:%M %p")
    
    return ConversationMessagesResponse(
        conversation=ConversationResponse(
            id=conversation.id,
            user=ConversationUserResponse(
                id=other_user.id,
                name=other_user.name,
                avatar=other_user.avatar
            ),
            last_message=conversation.last_message,
            time=time_str,
            unread=0,
            is_group=False
        ),
        messages=message_responses
    )


@router.get("/conversations/{user_id}", response_model=ConversationMessagesResponse)
async def get_or_create_conversation(
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get or create a conversation with another user.
    """
    # Check if user exists
    other_user = db.query(User).filter(User.id == user_id).first()
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if conversation exists
    conversation = db.query(Conversation).filter(
        or_(
            and_(Conversation.user1_id == current_user.id, Conversation.user2_id == user_id),
            and_(Conversation.user1_id == user_id, Conversation.user2_id == current_user.id)
        )
    ).first()
    
    if not conversation:
        # Create new conversation
        conversation = Conversation(
            user1_id=current_user.id,
            user2_id=user_id
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    
    # Get messages
    messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at.asc()).all()
    
    # Mark messages as read
    db.query(Message).filter(
        Message.conversation_id == conversation.id,
        Message.sender_id != current_user.id,
        Message.is_read == False
    ).update({Message.is_read: True})
    db.commit()
    
    message_responses = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        message_responses.append(MessageResponse(
            id=msg.id,
            content=msg.content,
            sender=sender.name if sender else "Unknown",
            timestamp=msg.created_at.strftime("%I:%M %p"),
            is_own=msg.sender_id == current_user.id
        ))
    
    time_str = None
    if conversation.last_message_time:
        time_str = conversation.last_message_time.strftime("%I:%M %p")
    
    return ConversationMessagesResponse(
        conversation=ConversationResponse(
            id=conversation.id,
            user=ConversationUserResponse(
                id=other_user.id,
                name=other_user.name,
                avatar=other_user.avatar
            ),
            last_message=conversation.last_message,
            time=time_str,
            unread=0,
            is_group=False
        ),
        messages=message_responses
    )


@router.post("/conversations/{conversation_id}", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message_old(
    conversation_id: str,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Send a message in a conversation (old endpoint).
    """
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        or_(
            Conversation.user1_id == current_user.id,
            Conversation.user2_id == current_user.id
        )
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Create message
    message = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=message_data.content
    )
    
    db.add(message)
    
    # Update conversation
    conversation.last_message = message_data.content
    conversation.last_message_time = datetime.utcnow()
    
    db.commit()
    db.refresh(message)
    
    return MessageResponse(
        id=message.id,
        content=message.content,
        sender=current_user.name,
        timestamp=message.created_at.strftime("%I:%M %p"),
        is_own=True
    )


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: str,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Send a message in a conversation.
    """
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        or_(
            Conversation.user1_id == current_user.id,
            Conversation.user2_id == current_user.id
        )
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Create message
    message = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=message_data.content
    )
    
    db.add(message)
    
    # Update conversation
    conversation.last_message = message_data.content
    conversation.last_message_time = datetime.utcnow()
    
    db.commit()
    db.refresh(message)
    
    return MessageResponse(
        id=message.id,
        content=message.content,
        sender=current_user.name,
        timestamp=message.created_at.strftime("%I:%M %p"),
        is_own=True
    )


@router.put("/conversations/{conversation_id}/read")
async def mark_conversation_as_read(
    conversation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Mark all messages in a conversation as read.
    """
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        or_(
            Conversation.user1_id == current_user.id,
            Conversation.user2_id == current_user.id
        )
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Mark all messages from the other user as read
    db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user.id,
        Message.is_read == False
    ).update({Message.is_read: True})
    
    db.commit()
    
    return {"message": "Messages marked as read", "success": True}


@router.post("/send/{user_id}", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message_to_user(
    user_id: str,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Send a message to a user (creates conversation if needed).
    """
    # Check if user exists
    other_user = db.query(User).filter(User.id == user_id).first()
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if they are connected
    from app.models.connection import Connection
    connection = db.query(Connection).filter(
        or_(
            and_(Connection.user_id == current_user.id, Connection.connected_user_id == user_id),
            and_(Connection.user_id == user_id, Connection.connected_user_id == current_user.id)
        )
    ).first()
    
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Must be connected to message this user"
        )
    
    # Get or create conversation
    conversation = db.query(Conversation).filter(
        or_(
            and_(Conversation.user1_id == current_user.id, Conversation.user2_id == user_id),
            and_(Conversation.user1_id == user_id, Conversation.user2_id == current_user.id)
        )
    ).first()
    
    if not conversation:
        conversation = Conversation(
            user1_id=current_user.id,
            user2_id=user_id
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    
    # Create message
    message = Message(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        content=message_data.content
    )
    
    db.add(message)
    
    # Update conversation
    conversation.last_message = message_data.content
    conversation.last_message_time = datetime.utcnow()
    
    db.commit()
    db.refresh(message)
    
    return MessageResponse(
        id=message.id,
        content=message.content,
        sender=current_user.name,
        timestamp=message.created_at.strftime("%I:%M %p"),
        is_own=True
    )

