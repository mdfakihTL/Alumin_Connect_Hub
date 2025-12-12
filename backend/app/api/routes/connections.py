from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User, UserProfile
from app.models.connection import Connection, ConnectionRequest, ConnectionStatus
from app.models.university import University
from app.schemas.connection import (
    ConnectionResponse, ConnectionRequestCreate, ConnectionRequestResponse,
    ConnectionListResponse, ConnectionUserResponse, ConnectionRequestFromUser
)

router = APIRouter()


@router.get("/", response_model=ConnectionListResponse)
async def list_connections(
    search: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List all connections for the current user.
    """
    connections = db.query(Connection).filter(
        or_(
            Connection.user_id == current_user.id,
            Connection.connected_user_id == current_user.id
        )
    ).all()
    
    connection_responses = []
    for conn in connections:
        # Get the other user in the connection
        other_user_id = conn.connected_user_id if conn.user_id == current_user.id else conn.user_id
        other_user = db.query(User).filter(User.id == other_user_id).first()
        
        if not other_user:
            continue
        
        # Apply search filter
        if search:
            search_term = search.lower()
            if (search_term not in other_user.name.lower() and
                search_term not in (other_user.major or "").lower()):
                continue
        
        # Get profile info
        profile = db.query(UserProfile).filter(UserProfile.user_id == other_user.id).first()
        
        # Get university name
        university_name = "Unknown"
        if other_user.university_id:
            university = db.query(University).filter(University.id == other_user.university_id).first()
            if university:
                university_name = university.name
        
        connection_responses.append(ConnectionResponse(
            id=conn.id,
            user=ConnectionUserResponse(
                id=other_user.id,
                name=other_user.name,
                avatar=other_user.avatar or "",
                university=university_name,
                year=str(other_user.graduation_year) if other_user.graduation_year else "",
                major=other_user.major or "Not specified",
                job_title=profile.job_title if profile else "Professional",
                company=profile.company if profile else "Company"
            ),
            connected_date=conn.connected_at.strftime("%Y-%m-%d")
        ))
    
    return ConnectionListResponse(
        connections=connection_responses,
        total=len(connection_responses)
    )


@router.post("/request", status_code=status.HTTP_201_CREATED)
async def send_connection_request(
    request_data: ConnectionRequestCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Send a connection request to another user.
    """
    # Check if target user exists
    target_user = db.query(User).filter(User.id == request_data.to_user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already connected
    existing_connection = db.query(Connection).filter(
        or_(
            and_(Connection.user_id == current_user.id, Connection.connected_user_id == request_data.to_user_id),
            and_(Connection.user_id == request_data.to_user_id, Connection.connected_user_id == current_user.id)
        )
    ).first()
    
    if existing_connection:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already connected with this user"
        )
    
    # Check if request already exists
    existing_request = db.query(ConnectionRequest).filter(
        or_(
            and_(ConnectionRequest.from_user_id == current_user.id, ConnectionRequest.to_user_id == request_data.to_user_id),
            and_(ConnectionRequest.from_user_id == request_data.to_user_id, ConnectionRequest.to_user_id == current_user.id)
        ),
        ConnectionRequest.status == ConnectionStatus.PENDING
    ).first()
    
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Connection request already exists"
        )
    
    # Create request
    connection_request = ConnectionRequest(
        from_user_id=current_user.id,
        to_user_id=request_data.to_user_id
    )
    
    db.add(connection_request)
    db.commit()
    db.refresh(connection_request)
    
    return {
        "message": f"Connection request sent to {target_user.name}",
        "success": True,
        "request_id": connection_request.id
    }


@router.get("/requests/received", response_model=List[ConnectionRequestResponse])
async def get_received_requests(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get connection requests received by the current user.
    """
    requests = db.query(ConnectionRequest).filter(
        ConnectionRequest.to_user_id == current_user.id,
        ConnectionRequest.status == ConnectionStatus.PENDING
    ).all()
    
    responses = []
    for req in requests:
        from_user = db.query(User).filter(User.id == req.from_user_id).first()
        if not from_user:
            continue
        
        university_name = None
        if from_user.university_id:
            university = db.query(University).filter(University.id == from_user.university_id).first()
            if university:
                university_name = university.name
        
        responses.append(ConnectionRequestResponse(
            id=req.id,
            from_user=ConnectionRequestFromUser(
                id=from_user.id,
                name=from_user.name,
                avatar=from_user.avatar,
                university=university_name,
                year=str(from_user.graduation_year) if from_user.graduation_year else None
            ),
            to_user_id=req.to_user_id,
            status=req.status.value,
            date=req.created_at.isoformat()
        ))
    
    return responses


@router.get("/requests/sent", response_model=List[ConnectionRequestResponse])
async def get_sent_requests(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get connection requests sent by the current user.
    """
    requests = db.query(ConnectionRequest).filter(
        ConnectionRequest.from_user_id == current_user.id,
        ConnectionRequest.status == ConnectionStatus.PENDING
    ).all()
    
    responses = []
    for req in requests:
        to_user = db.query(User).filter(User.id == req.to_user_id).first()
        if not to_user:
            continue
        
        responses.append(ConnectionRequestResponse(
            id=req.id,
            from_user=ConnectionRequestFromUser(
                id=current_user.id,
                name=current_user.name,
                avatar=current_user.avatar,
                university=None,
                year=None
            ),
            to_user_id=to_user.id,
            status=req.status.value,
            date=req.created_at.isoformat()
        ))
    
    return responses


@router.post("/requests/{request_id}/accept")
async def accept_connection_request(
    request_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Accept a connection request.
    """
    connection_request = db.query(ConnectionRequest).filter(
        ConnectionRequest.id == request_id,
        ConnectionRequest.to_user_id == current_user.id,
        ConnectionRequest.status == ConnectionStatus.PENDING
    ).first()
    
    if not connection_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection request not found"
        )
    
    # Update request status
    connection_request.status = ConnectionStatus.ACCEPTED
    
    # Create connection
    connection = Connection(
        user_id=connection_request.from_user_id,
        connected_user_id=connection_request.to_user_id
    )
    
    db.add(connection)
    
    # Update user profiles' connection counts
    from_profile = db.query(UserProfile).filter(UserProfile.user_id == connection_request.from_user_id).first()
    if from_profile:
        from_profile.connections_count += 1
    
    to_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if to_profile:
        to_profile.connections_count += 1
    
    db.commit()
    
    from_user = db.query(User).filter(User.id == connection_request.from_user_id).first()
    
    return {
        "message": f"You are now connected with {from_user.name if from_user else 'user'}",
        "success": True
    }


@router.post("/requests/{request_id}/reject")
async def reject_connection_request(
    request_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Reject a connection request.
    """
    connection_request = db.query(ConnectionRequest).filter(
        ConnectionRequest.id == request_id,
        ConnectionRequest.to_user_id == current_user.id,
        ConnectionRequest.status == ConnectionStatus.PENDING
    ).first()
    
    if not connection_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection request not found"
        )
    
    connection_request.status = ConnectionStatus.REJECTED
    db.commit()
    
    return {"message": "Connection request rejected", "success": True}


@router.delete("/{connection_id}")
async def remove_connection(
    connection_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Remove a connection.
    """
    connection = db.query(Connection).filter(
        Connection.id == connection_id,
        or_(
            Connection.user_id == current_user.id,
            Connection.connected_user_id == current_user.id
        )
    ).first()
    
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )
    
    # Get the other user
    other_user_id = connection.connected_user_id if connection.user_id == current_user.id else connection.user_id
    
    # Update connection counts
    current_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if current_profile:
        current_profile.connections_count = max(0, current_profile.connections_count - 1)
    
    other_profile = db.query(UserProfile).filter(UserProfile.user_id == other_user_id).first()
    if other_profile:
        other_profile.connections_count = max(0, other_profile.connections_count - 1)
    
    db.delete(connection)
    db.commit()
    
    return {"message": "Connection removed", "success": True}


@router.get("/check/{user_id}")
async def check_connection_status(
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Check connection status with a user.
    """
    # Check if connected
    is_connected = db.query(Connection).filter(
        or_(
            and_(Connection.user_id == current_user.id, Connection.connected_user_id == user_id),
            and_(Connection.user_id == user_id, Connection.connected_user_id == current_user.id)
        )
    ).first() is not None
    
    # Check for pending request
    pending_request = db.query(ConnectionRequest).filter(
        or_(
            and_(ConnectionRequest.from_user_id == current_user.id, ConnectionRequest.to_user_id == user_id),
            and_(ConnectionRequest.from_user_id == user_id, ConnectionRequest.to_user_id == current_user.id)
        ),
        ConnectionRequest.status == ConnectionStatus.PENDING
    ).first()
    
    has_pending = pending_request is not None
    is_sender = pending_request.from_user_id == current_user.id if pending_request else False
    
    return {
        "is_connected": is_connected,
        "has_pending_request": has_pending,
        "is_request_sender": is_sender
    }

