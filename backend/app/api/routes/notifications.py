from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.notification import Notification, NotificationType
from app.schemas.notification import (
    NotificationResponse, NotificationListResponse
)

router = APIRouter()


def format_time(dt: datetime) -> str:
    """Format datetime as relative time."""
    if not dt:
        return ""
    # Handle timezone-aware datetimes
    from datetime import timezone
    if dt.tzinfo is not None:
        now = datetime.now(timezone.utc)
    else:
        now = datetime.utcnow()
    diff = now - dt
    
    if diff.total_seconds() < 60:
        return "Just now"
    elif diff.total_seconds() < 3600:
        mins = int(diff.total_seconds() / 60)
        return f"{mins}m ago"
    elif diff.total_seconds() < 86400:
        hours = int(diff.total_seconds() / 3600)
        return f"{hours}h ago"
    elif diff.days < 7:
        return f"{diff.days}d ago"
    else:
        return dt.strftime("%b %d, %Y")


@router.get("/", response_model=NotificationListResponse)
async def list_notifications(
    type_filter: Optional[str] = None,
    unread_only: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List notifications for the current user.
    """
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id
    )
    
    if type_filter:
        try:
            notif_type = NotificationType(type_filter)
            query = query.filter(Notification.type == notif_type)
        except ValueError:
            pass
    
    if unread_only:
        query = query.filter(Notification.read == False)
    
    query = query.order_by(Notification.created_at.desc())
    
    total = query.count()
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).count()
    
    notifications = query.offset((page - 1) * page_size).limit(page_size).all()
    
    notification_responses = []
    for notif in notifications:
        notification_responses.append(NotificationResponse(
            id=notif.id,
            type=notif.type.value,
            title=notif.title,
            message=notif.message,
            avatar=notif.avatar,
            read=notif.read,
            time=format_time(notif.created_at),
            created_at=notif.created_at,
            action_url=notif.action_url,
            related_id=notif.related_id
        ))
    
    return NotificationListResponse(
        notifications=notification_responses,
        total=total,
        unread_count=unread_count,
        page=page,
        page_size=page_size
    )


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get the count of unread notifications.
    """
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).count()
    
    return {"unread_count": count}


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific notification.
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return NotificationResponse(
        id=notification.id,
        type=notification.type.value,
        title=notification.title,
        message=notification.message,
        avatar=notification.avatar,
        read=notification.read,
        time=format_time(notification.created_at),
        created_at=notification.created_at,
        action_url=notification.action_url,
        related_id=notification.related_id
    )


@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Mark a notification as read.
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.read = True
    db.commit()
    
    return {"message": "Notification marked as read", "success": True}


@router.put("/mark-all-read")
async def mark_all_as_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Mark all notifications as read.
    """
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).update({Notification.read: True})
    
    db.commit()
    
    return {"message": "All notifications marked as read", "success": True}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a notification.
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    db.delete(notification)
    db.commit()
    
    return {"message": "Notification deleted", "success": True}


@router.delete("/")
async def clear_all_notifications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Clear all notifications for the current user.
    """
    db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).delete()
    
    db.commit()
    
    return {"message": "All notifications cleared", "success": True}

