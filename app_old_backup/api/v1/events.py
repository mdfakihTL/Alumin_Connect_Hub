"""
Event endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_async_session
from app.schemas.event import EventCreate, EventUpdate, EventResponse, EventRegistrationCreate, EventRegistrationResponse
from app.api.dependencies import get_current_active_user
from app.models.user import User
from sqlalchemy import select
from app.models.event import Event, EventRegistration
from datetime import datetime
from app.utils.datetime_utils import ensure_naive_utc

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Create a new event"""
    event_dict = event_data.model_dump()
    # Convert timezone-aware datetimes to naive for database compatibility
    if 'start_date' in event_dict and event_dict['start_date']:
        event_dict['start_date'] = ensure_naive_utc(event_dict['start_date'])
    if 'end_date' in event_dict and event_dict['end_date']:
        event_dict['end_date'] = ensure_naive_utc(event_dict['end_date'])
    if 'registration_deadline' in event_dict and event_dict['registration_deadline']:
        event_dict['registration_deadline'] = ensure_naive_utc(event_dict['registration_deadline'])
    
    event = Event(
        **event_dict,
        creator_id=current_user.id
    )
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return event


@router.get("/", response_model=List[EventResponse])
async def list_events(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_async_session)
):
    """List all events"""
    result = await session.execute(
        select(Event).offset(skip).limit(limit).order_by(Event.start_date.desc())
    )
    return list(result.scalars().all())


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    """Get event by ID"""
    result = await session.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    return event


@router.post("/{event_id}/register", response_model=EventRegistrationResponse, status_code=status.HTTP_201_CREATED)
async def register_for_event(
    event_id: int,
    registration_data: EventRegistrationCreate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Register for an event"""
    # Check if event exists
    result = await session.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Check if already registered
    existing = await session.execute(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == current_user.id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already registered for this event"
        )

    registration = EventRegistration(
        event_id=event_id,
        user_id=current_user.id,
        registration_date=datetime.utcnow(),
        notes=registration_data.notes
    )
    session.add(registration)
    await session.commit()
    await session.refresh(registration)
    return registration


