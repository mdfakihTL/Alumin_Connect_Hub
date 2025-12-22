from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.group import Group, GroupMember, GroupMessage
from app.schemas.group import (
    GroupCreate, GroupUpdate, GroupResponse, GroupListResponse,
    GroupMessageCreate, GroupMessageResponse, GroupMessageSenderResponse
)

router = APIRouter()


def format_time(dt: datetime) -> str:
    """Format datetime as relative time."""
    if not dt:
        return None
    now = datetime.utcnow()
    diff = now - dt
    
    if diff.total_seconds() < 3600:
        mins = int(diff.total_seconds() / 60)
        return f"{mins}m ago"
    elif diff.total_seconds() < 86400:
        hours = int(diff.total_seconds() / 3600)
        return f"{hours}h ago"
    else:
        days = diff.days
        return f"{days}d ago"


@router.get("/", response_model=GroupListResponse)
async def list_groups(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    university_id: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List groups with pagination and filtering.
    Private groups are only visible to members.
    """
    # Get all group IDs where the current user is a member
    user_group_ids = db.query(GroupMember.group_id).filter(
        GroupMember.user_id == current_user.id
    ).all()
    user_group_ids = [g[0] for g in user_group_ids]
    
    # Base query - active groups only
    query = db.query(Group).filter(Group.is_active == True)
    
    # Filter: Show public groups OR private groups where user is a member
    query = query.filter(
        or_(
            Group.is_private == False,  # Public groups
            Group.id.in_(user_group_ids)  # Private groups user is member of
        )
    )
    
    if university_id:
        query = query.filter(Group.university_id == university_id)
    
    if category:
        query = query.filter(Group.category == category)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Group.name.ilike(search_term)) |
            (Group.description.ilike(search_term))
        )
    
    total = query.count()
    groups = query.offset((page - 1) * page_size).limit(page_size).all()
    
    group_responses = []
    for group in groups:
        # Check if current user is a member
        is_joined = group.id in user_group_ids
        
        # Get unread count if member
        unread_count = 0
        if is_joined:
            membership = db.query(GroupMember).filter(
                GroupMember.group_id == group.id,
                GroupMember.user_id == current_user.id
            ).first()
            unread_count = membership.unread_count if membership else 0
        
        group_responses.append(GroupResponse(
            id=group.id,
            name=group.name,
            members=group.members_count,
            description=group.description,
            is_private=group.is_private,
            category=group.category,
            avatar=group.avatar,
            is_joined=is_joined,
            last_message=group.last_message if is_joined else None,
            last_message_time=format_time(group.last_message_time) if is_joined else None,
            unread_count=unread_count,
            created_at=group.created_at
        ))
    
    return GroupListResponse(
        groups=group_responses,
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("/", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    group_data: GroupCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new group.
    """
    group = Group(
        university_id=current_user.university_id,
        creator_id=current_user.id,
        name=group_data.name,
        description=group_data.description,
        category=group_data.category,
        is_private=group_data.is_private,
        avatar=group_data.avatar or f"https://api.dicebear.com/7.x/shapes/svg?seed={group_data.name}"
    )
    
    db.add(group)
    db.commit()
    db.refresh(group)
    
    # Add creator as admin member
    member = GroupMember(
        group_id=group.id,
        user_id=current_user.id,
        is_admin=True
    )
    db.add(member)
    db.commit()
    
    return GroupResponse(
        id=group.id,
        name=group.name,
        members=group.members_count,
        description=group.description,
        is_private=group.is_private,
        category=group.category,
        avatar=group.avatar,
        is_joined=True,
        last_message=None,
        last_message_time=None,
        unread_count=0,
        created_at=group.created_at
    )


@router.get("/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get group by ID.
    """
    group = db.query(Group).filter(Group.id == group_id, Group.is_active == True).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    membership = db.query(GroupMember).filter(
        GroupMember.group_id == group.id,
        GroupMember.user_id == current_user.id
    ).first()
    
    is_joined = membership is not None
    unread_count = membership.unread_count if membership else 0
    
    return GroupResponse(
        id=group.id,
        name=group.name,
        members=group.members_count,
        description=group.description,
        is_private=group.is_private,
        category=group.category,
        avatar=group.avatar,
        is_joined=is_joined,
        last_message=group.last_message if is_joined else None,
        last_message_time=format_time(group.last_message_time) if is_joined else None,
        unread_count=unread_count,
        created_at=group.created_at
    )


@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: str,
    group_data: GroupUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update a group (creator or admin only).
    """
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if user is creator or admin
    membership = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    ).first()
    
    if not membership or (not membership.is_admin and group.creator_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this group"
        )
    
    if group_data.name is not None:
        group.name = group_data.name
    if group_data.description is not None:
        group.description = group_data.description
    if group_data.category is not None:
        group.category = group_data.category
    if group_data.is_private is not None:
        group.is_private = group_data.is_private
    if group_data.avatar is not None:
        group.avatar = group_data.avatar
    
    db.commit()
    db.refresh(group)
    
    return GroupResponse(
        id=group.id,
        name=group.name,
        members=group.members_count,
        description=group.description,
        is_private=group.is_private,
        category=group.category,
        avatar=group.avatar,
        is_joined=True,
        last_message=group.last_message,
        last_message_time=format_time(group.last_message_time),
        unread_count=0,
        created_at=group.created_at
    )


@router.delete("/{group_id}")
async def delete_group(
    group_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a group (creator only).
    """
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    if group.creator_id != current_user.id and current_user.role.value not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this group"
        )
    
    group.is_active = False
    db.commit()
    
    return {"message": "Group deleted successfully", "success": True}


@router.post("/{group_id}/join")
async def join_group(
    group_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Join a group.
    """
    group = db.query(Group).filter(Group.id == group_id, Group.is_active == True).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if already a member
    existing = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already a member of this group"
        )
    
    member = GroupMember(
        group_id=group_id,
        user_id=current_user.id
    )
    db.add(member)
    group.members_count += 1
    db.commit()
    
    return {
        "message": f"Joined {group.name}",
        "success": True,
        "members": group.members_count
    }


@router.delete("/{group_id}/leave")
async def leave_group(
    group_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Leave a group.
    """
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    membership = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not a member of this group"
        )
    
    db.delete(membership)
    group.members_count = max(0, group.members_count - 1)
    db.commit()
    
    return {
        "message": f"Left {group.name}",
        "success": True,
        "members": group.members_count
    }


@router.get("/{group_id}/messages", response_model=List[GroupMessageResponse])
async def get_group_messages(
    group_id: str,
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get messages in a group.
    """
    group = db.query(Group).filter(Group.id == group_id, Group.is_active == True).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if user is a member
    membership = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Must be a member to view messages"
        )
    
    # Reset unread count
    membership.unread_count = 0
    db.commit()
    
    messages = db.query(GroupMessage).filter(
        GroupMessage.group_id == group_id
    ).order_by(GroupMessage.created_at.desc()).limit(limit).all()
    
    messages = list(reversed(messages))  # Oldest first
    
    message_responses = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        
        message_responses.append(GroupMessageResponse(
            id=msg.id,
            content=msg.content,
            sender=GroupMessageSenderResponse(
                id=sender.id if sender else "",
                name=sender.name if sender else "Unknown",
                avatar=sender.avatar if sender else None
            ),
            timestamp=msg.created_at.strftime("%I:%M %p"),
            is_own=msg.sender_id == current_user.id,
            created_at=msg.created_at
        ))
    
    return message_responses


@router.post("/{group_id}/messages", response_model=GroupMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_group_message(
    group_id: str,
    message_data: GroupMessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Send a message in a group.
    """
    group = db.query(Group).filter(Group.id == group_id, Group.is_active == True).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if user is a member
    membership = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Must be a member to send messages"
        )
    
    message = GroupMessage(
        group_id=group_id,
        sender_id=current_user.id,
        content=message_data.content
    )
    
    db.add(message)
    
    # Update group's last message
    group.last_message = message_data.content
    group.last_message_time = datetime.utcnow()
    
    # Increment unread count for other members
    db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id != current_user.id
    ).update({GroupMember.unread_count: GroupMember.unread_count + 1})
    
    db.commit()
    db.refresh(message)
    
    return GroupMessageResponse(
        id=message.id,
        content=message.content,
        sender=GroupMessageSenderResponse(
            id=current_user.id,
            name=current_user.name,
            avatar=current_user.avatar
        ),
        timestamp=message.created_at.strftime("%I:%M %p"),
        is_own=True,
        created_at=message.created_at
    )


@router.get("/joined/me", response_model=GroupListResponse)
async def get_joined_groups(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get groups the current user has joined.
    """
    memberships = db.query(GroupMember).filter(
        GroupMember.user_id == current_user.id
    ).all()
    
    group_ids = [m.group_id for m in memberships]
    
    query = db.query(Group).filter(
        Group.id.in_(group_ids),
        Group.is_active == True
    )
    
    total = query.count()
    groups = query.offset((page - 1) * page_size).limit(page_size).all()
    
    group_responses = []
    for group in groups:
        membership = next((m for m in memberships if m.group_id == group.id), None)
        
        group_responses.append(GroupResponse(
            id=group.id,
            name=group.name,
            members=group.members_count,
            description=group.description,
            is_private=group.is_private,
            category=group.category,
            avatar=group.avatar,
            is_joined=True,
            last_message=group.last_message,
            last_message_time=format_time(group.last_message_time),
            unread_count=membership.unread_count if membership else 0,
            created_at=group.created_at
        ))
    
    return GroupListResponse(
        groups=group_responses,
        total=total,
        page=page,
        page_size=page_size
    )


# ============ ADMIN MEMBER MANAGEMENT ============

@router.get("/{group_id}/members")
async def get_group_members(
    group_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all members of a group (admin only).
    """
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if user is admin or superadmin
    if current_user.role.value not in ["admin", "superadmin"]:
        # Or check if user is group admin
        membership = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == current_user.id,
            GroupMember.is_admin == True
        ).first()
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view members"
            )
    
    memberships = db.query(GroupMember).filter(
        GroupMember.group_id == group_id
    ).all()
    
    members = []
    for m in memberships:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user:
            members.append({
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "avatar": user.avatar,
                "joined_at": m.joined_at.isoformat() if m.joined_at else None,
                "is_admin": m.is_admin
            })
    
    return {"members": members}


from pydantic import BaseModel

class AddMemberRequest(BaseModel):
    user_id: str


@router.post("/{group_id}/members")
async def add_group_member(
    group_id: str,
    data: AddMemberRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Add a member to a group (admin only).
    """
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if user is admin or superadmin
    if current_user.role.value not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add members"
        )
    
    # Check if user to add exists
    user_to_add = db.query(User).filter(User.id == data.user_id).first()
    if not user_to_add:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already a member
    existing = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == data.user_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this group"
        )
    
    # Add member
    member = GroupMember(
        group_id=group_id,
        user_id=data.user_id
    )
    db.add(member)
    group.members_count += 1
    db.commit()
    
    return {
        "message": f"{user_to_add.name} added to {group.name}",
        "success": True
    }


@router.delete("/{group_id}/members/{user_id}")
async def remove_group_member(
    group_id: str,
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Remove a member from a group (admin only).
    """
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if user is admin or superadmin
    if current_user.role.value not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to remove members"
        )
    
    # Find membership
    membership = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not a member of this group"
        )
    
    # Get user name for response
    user = db.query(User).filter(User.id == user_id).first()
    user_name = user.name if user else "User"
    
    # Remove member
    db.delete(membership)
    group.members_count = max(0, group.members_count - 1)
    db.commit()
    
    return {
        "message": f"{user_name} removed from {group.name}",
        "success": True
    }
