from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.event import Event, EventRegistration
from app.models.university import University
from app.schemas.event import (
    EventCreate, EventUpdate, EventResponse, EventListResponse,
    EventRegistrationResponse
)

router = APIRouter()


@router.get("/", response_model=EventListResponse)
async def list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    university_id: Optional[str] = None,
    category: Optional[str] = None,
    is_virtual: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List events with pagination and filtering.
    """
    query = db.query(Event).filter(Event.is_active == True)
    
    if university_id:
        query = query.filter(Event.university_id == university_id)
    
    if category:
        query = query.filter(Event.category == category)
    
    if is_virtual is not None:
        query = query.filter(Event.is_virtual == is_virtual)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Event.title.ilike(search_term)) |
            (Event.description.ilike(search_term)) |
            (Event.location.ilike(search_term))
        )
    
    query = query.order_by(Event.event_date.asc())
    
    total = query.count()
    events = query.offset((page - 1) * page_size).limit(page_size).all()
    
    event_responses = []
    for event in events:
        # Get organizer name
        organizer = db.query(User).filter(User.id == event.organizer_id).first()
        organizer_name = organizer.name if organizer else "Unknown"
        
        # Check if current user is registered
        is_registered = db.query(EventRegistration).filter(
            EventRegistration.event_id == event.id,
            EventRegistration.user_id == current_user.id
        ).first() is not None
        
        event_responses.append(EventResponse(
            id=event.id,
            title=event.title,
            date=event.event_date,
            time=event.event_time,
            location=event.location,
            attendees=event.attendees_count,
            image=event.image,
            description=event.description,
            is_virtual=event.is_virtual,
            meeting_link=event.meeting_link if is_registered else None,
            organizer=organizer_name,
            category=event.category,
            is_registered=is_registered,
            created_at=event.created_at
        ))
    
    return EventListResponse(
        events=event_responses,
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new event.
    """
    event = Event(
        university_id=current_user.university_id,
        organizer_id=current_user.id,
        title=event_data.title,
        description=event_data.description,
        image=event_data.image,
        event_date=event_data.event_date,
        event_time=event_data.event_time,
        location=event_data.location,
        is_virtual=event_data.is_virtual,
        meeting_link=event_data.meeting_link,
        category=event_data.category,
        max_attendees=event_data.max_attendees
    )
    
    db.add(event)
    db.commit()
    db.refresh(event)
    
    # Auto-register creator
    registration = EventRegistration(
        event_id=event.id,
        user_id=current_user.id
    )
    db.add(registration)
    event.attendees_count = 1
    db.commit()
    
    return EventResponse(
        id=event.id,
        title=event.title,
        date=event.event_date,
        time=event.event_time,
        location=event.location,
        attendees=event.attendees_count,
        image=event.image,
        description=event.description,
        is_virtual=event.is_virtual,
        meeting_link=event.meeting_link,
        organizer="You",
        category=event.category,
        is_registered=True,
        created_at=event.created_at
    )


@router.get("/registered/me", response_model=EventListResponse)
async def get_registered_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get events the current user is registered for.
    """
    registrations = db.query(EventRegistration).filter(
        EventRegistration.user_id == current_user.id
    ).all()
    
    event_ids = [r.event_id for r in registrations]
    
    query = db.query(Event).filter(
        Event.id.in_(event_ids),
        Event.is_active == True
    ).order_by(Event.event_date.asc())
    
    total = query.count()
    events = query.offset((page - 1) * page_size).limit(page_size).all()
    
    event_responses = []
    for event in events:
        organizer = db.query(User).filter(User.id == event.organizer_id).first()
        organizer_name = organizer.name if organizer else "Unknown"
        
        event_responses.append(EventResponse(
            id=event.id,
            title=event.title,
            date=event.event_date,
            time=event.event_time,
            location=event.location,
            attendees=event.attendees_count,
            image=event.image,
            description=event.description,
            is_virtual=event.is_virtual,
            meeting_link=event.meeting_link,
            organizer=organizer_name,
            category=event.category,
            is_registered=True,
            created_at=event.created_at
        ))
    
    return EventListResponse(
        events=event_responses,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get event by ID.
    """
    event = db.query(Event).filter(Event.id == event_id, Event.is_active == True).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    organizer = db.query(User).filter(User.id == event.organizer_id).first()
    organizer_name = organizer.name if organizer else "Unknown"
    
    is_registered = db.query(EventRegistration).filter(
        EventRegistration.event_id == event.id,
        EventRegistration.user_id == current_user.id
    ).first() is not None
    
    return EventResponse(
        id=event.id,
        title=event.title,
        date=event.event_date,
        time=event.event_time,
        location=event.location,
        attendees=event.attendees_count,
        image=event.image,
        description=event.description,
        is_virtual=event.is_virtual,
        meeting_link=event.meeting_link if is_registered else None,
        organizer=organizer_name,
        category=event.category,
        is_registered=is_registered,
        created_at=event.created_at
    )


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    event_data: EventUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update an event (organizer or admin only).
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    if event.organizer_id != current_user.id and current_user.role.value not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this event"
        )
    
    if event_data.title is not None:
        event.title = event_data.title
    if event_data.description is not None:
        event.description = event_data.description
    if event_data.event_date is not None:
        event.event_date = event_data.event_date
    if event_data.event_time is not None:
        event.event_time = event_data.event_time
    if event_data.location is not None:
        event.location = event_data.location
    if event_data.category is not None:
        event.category = event_data.category
    if event_data.image is not None:
        event.image = event_data.image
    if event_data.is_virtual is not None:
        event.is_virtual = event_data.is_virtual
    if event_data.meeting_link is not None:
        event.meeting_link = event_data.meeting_link
    if event_data.max_attendees is not None:
        event.max_attendees = event_data.max_attendees
    if event_data.is_active is not None:
        event.is_active = event_data.is_active
    
    db.commit()
    db.refresh(event)
    
    return EventResponse(
        id=event.id,
        title=event.title,
        date=event.event_date,
        time=event.event_time,
        location=event.location,
        attendees=event.attendees_count,
        image=event.image,
        description=event.description,
        is_virtual=event.is_virtual,
        meeting_link=event.meeting_link,
        organizer="You",
        category=event.category,
        is_registered=True,
        created_at=event.created_at
    )


@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete an event (organizer or admin only).
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    if event.organizer_id != current_user.id and current_user.role.value not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this event"
        )
    
    event.is_active = False
    db.commit()
    
    return {"message": "Event deleted successfully", "success": True}


@router.post("/{event_id}/register")
async def register_for_event(
    event_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Register for an event.
    """
    event = db.query(Event).filter(Event.id == event_id, Event.is_active == True).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Check if already registered
    existing = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already registered for this event"
        )
    
    # Check max attendees
    if event.max_attendees and event.attendees_count >= event.max_attendees:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event is at full capacity"
        )
    
    registration = EventRegistration(
        event_id=event_id,
        user_id=current_user.id
    )
    db.add(registration)
    event.attendees_count += 1
    db.commit()
    
    return {
        "message": f"Registered for {event.title}",
        "success": True,
        "attendees": event.attendees_count
    }


@router.delete("/{event_id}/register")
async def unregister_from_event(
    event_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Unregister from an event.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    registration = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == current_user.id
    ).first()
    
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not registered for this event"
        )
    
    db.delete(registration)
    event.attendees_count = max(0, event.attendees_count - 1)
    db.commit()
    
    return {
        "message": f"Unregistered from {event.title}",
        "success": True,
        "attendees": event.attendees_count
    }

