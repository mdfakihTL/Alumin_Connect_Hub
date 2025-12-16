from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
import logging

from app.core.database import get_db
from app.core.security import get_current_active_user, get_password_hash
from app.models.user import User, UserRole, UserProfile
from app.models.university import University
from app.services.email_service import EmailService
from app.models.event import Event
from app.models.group import Group
from app.models.document import DocumentRequest, DocumentStatus
from app.models.support import SupportTicket, TicketStatus, TicketResponse, TicketPriority
from app.models.mentor import Mentor
from app.models.fundraiser import Fundraiser
from app.models.ad import Ad
from app.models.notification import Notification, NotificationType
from app.schemas.admin import (
    AdminDashboardStats, AlumniUserCreate, AlumniUserResponse,
    AlumniUserListResponse, BulkImportResponse, PasswordResetRequest,
    PasswordResetListResponse, AdminTicketResponse, AdminTicketListResponse,
    AdminTicketDetailResponse, TicketResponseItem,
    AdminDocumentRequestResponse, AdminDocumentListResponse,
    FundraiserCreate, FundraiserUpdate, FundraiserResponse,
    AdCreate, AdUpdate, AdResponse, PasswordResetBody
)

router = APIRouter()
logger = logging.getLogger(__name__)


def require_admin(current_user: User = Depends(get_current_active_user)):
    """Dependency to require admin role."""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get("/dashboard", response_model=AdminDashboardStats)
async def get_admin_dashboard(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get admin dashboard statistics.
    """
    university_id = current_user.university_id
    
    # Total alumni
    total_alumni = db.query(User).filter(
        User.university_id == university_id,
        User.role == UserRole.ALUMNI
    ).count()
    
    # Active mentors
    active_mentors = db.query(User).filter(
        User.university_id == university_id,
        User.is_mentor == True
    ).count()
    
    # Pending documents
    pending_documents = db.query(DocumentRequest).filter(
        DocumentRequest.university_id == university_id,
        DocumentRequest.status == DocumentStatus.PENDING
    ).count()
    
    # Upcoming events (this month)
    upcoming_events = db.query(Event).filter(
        Event.university_id == university_id,
        Event.is_active == True
    ).count()
    
    # Password reset requests
    password_resets = db.query(User).filter(
        User.university_id == university_id,
        User.password_reset_requested == True
    ).count()
    
    # Active groups
    active_groups = db.query(Group).filter(
        Group.university_id == university_id,
        Group.is_active == True
    ).count()
    
    # Active fundraisers
    active_fundraisers = db.query(Fundraiser).filter(
        Fundraiser.university_id == university_id,
        Fundraiser.is_active == True
    ).count()
    
    # Open support tickets
    open_tickets = db.query(SupportTicket).filter(
        SupportTicket.university_id == university_id,
        SupportTicket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])
    ).count()
    
    return AdminDashboardStats(
        total_alumni=total_alumni,
        active_mentors=active_mentors,
        pending_documents=pending_documents,
        upcoming_events=upcoming_events,
        password_resets=password_resets,
        active_groups=active_groups,
        active_fundraisers=active_fundraisers,
        open_tickets=open_tickets
    )


# User Management
@router.get("/users", response_model=AlumniUserListResponse)
async def list_users(
    search: Optional[str] = None,
    graduation_year: Optional[int] = None,
    major: Optional[str] = None,
    is_mentor: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List all alumni users for the university.
    """
    query = db.query(User).filter(
        User.university_id == current_user.university_id,
        User.role == UserRole.ALUMNI
    )
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.name.ilike(search_term)) |
            (User.email.ilike(search_term))
        )
    
    if graduation_year:
        query = query.filter(User.graduation_year == graduation_year)
    
    if major:
        query = query.filter(User.major.ilike(f"%{major}%"))
    
    if is_mentor is not None:
        query = query.filter(User.is_mentor == is_mentor)
    
    total = query.count()
    users = query.offset((page - 1) * page_size).limit(page_size).all()
    
    user_responses = []
    for user in users:
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        user_responses.append(AlumniUserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            avatar=user.avatar,
            graduation_year=user.graduation_year,
            major=user.major,
            is_mentor=user.is_mentor,
            is_active=user.is_active,
            job_title=profile.job_title if profile else None,
            company=profile.company if profile else None,
            created_at=user.created_at
        ))
    
    return AlumniUserListResponse(
        users=user_responses,
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("/users", response_model=AlumniUserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: AlumniUserCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new alumni user.
    """
    try:
        # Check if email exists
        existing = db.query(User).filter(User.email == user_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Generate username from email (before @ symbol) for database compatibility
        username = user_data.email.split('@')[0] if user_data.email else None
        
        user = User(
            email=user_data.email,
            username=username,  # Set username for database compatibility
            hashed_password=get_password_hash(user_data.password),
            name=user_data.name,
            university_id=current_user.university_id,
            graduation_year=user_data.graduation_year,
            major=user_data.major,
            role=UserRole.ALUMNI
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create profile
        profile = UserProfile(user_id=user.id)
        db.add(profile)
        db.commit()
        
        # Get profile for response
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        
        # Get university for email (with SMTP settings)
        university = db.query(University).filter(University.id == current_user.university_id).first()
        university_name = university.name if university else None
        
        # Send welcome email using university-specific SMTP settings (or global fallback)
        # Wrap in try-except to ensure email failure doesn't break user creation
        try:
            # Use university-specific email service if configured, otherwise use global
            uni_email_service = EmailService.from_university(university) if university else EmailService()
            
            if uni_email_service.enabled:
                uni_email_service.send_welcome_email(
                    to_email=user.email,
                    user_name=user.name,
                    password=user_data.password,  # Send plain password for initial login
                    university_name=university_name
                )
                logger.info(f"Welcome email sent to {user.email}")
            else:
                logger.warning(f"Email service not enabled. SMTP not configured. Email not sent to {user.email}")
        except Exception as e:
            # Log error but don't fail user creation if email fails
            import traceback
            error_trace = traceback.format_exc()
            logger.error(f"Failed to send welcome email to {user.email}: {str(e)}\n{error_trace}")
        
        return AlumniUserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            avatar=user.avatar,
            graduation_year=user.graduation_year,
            major=user.major,
            is_mentor=user.is_mentor,
            is_active=user.is_active,
            job_title=profile.job_title if profile else None,
            company=profile.company if profile else None,
            created_at=user.created_at
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"Error creating user: {str(e)}\n{error_trace}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )


@router.post("/users/bulk-import", response_model=BulkImportResponse)
async def bulk_import_users(
    users: List[AlumniUserCreate],
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Bulk import alumni users with welcome emails.
    """
    success_count = 0
    failed_count = 0
    errors = []
    
    # Get university for email
    university = db.query(University).filter(University.id == current_user.university_id).first()
    university_name = university.name if university else None
    
    for user_data in users:
        try:
            existing = db.query(User).filter(User.email == user_data.email).first()
            if existing:
                failed_count += 1
                errors.append(f"{user_data.email}: Already exists")
                continue
            
            # Generate username from email
            username = user_data.email.split('@')[0] if user_data.email else None
            
            user = User(
                email=user_data.email,
                username=username,
                hashed_password=get_password_hash(user_data.password),
                name=user_data.name,
                university_id=current_user.university_id,
                graduation_year=user_data.graduation_year,
                major=user_data.major,
                role=UserRole.ALUMNI
            )
            
            # Add both user and profile before committing to ensure atomicity
            db.add(user)
            db.flush()  # Flush to get user.id without committing
            
            profile = UserProfile(user_id=user.id)
            db.add(profile)
            
            # Commit both user and profile together
            db.commit()
            
            # Send welcome email with credentials
            try:
                uni_email_service = EmailService.from_university(university) if university else EmailService()
                if uni_email_service.enabled:
                    uni_email_service.send_welcome_email(
                        to_email=user.email,
                        user_name=user.name,
                        password=user_data.password,  # Send plain password
                        university_name=university_name
                    )
                    logger.info(f"Welcome email sent to {user.email}")
            except Exception as e:
                logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
                # Don't fail the import if email fails
            
            success_count += 1
        except Exception as e:
            db.rollback()  # Rollback on any failure to prevent orphaned records
            failed_count += 1
            errors.append(f"{user_data.email}: {str(e)}")
    
    return BulkImportResponse(
        success_count=success_count,
        failed_count=failed_count,
        errors=errors
    )


@router.delete("/users/{user_id}")
async def deactivate_user(
    user_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Deactivate a user.
    """
    user = db.query(User).filter(
        User.id == user_id,
        User.university_id == current_user.university_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = False
    db.commit()
    
    return {"message": "User deactivated", "success": True}


@router.put("/users/{user_id}/activate")
async def activate_user(
    user_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Activate a deactivated user.
    """
    user = db.query(User).filter(
        User.id == user_id,
        User.university_id == current_user.university_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    db.commit()
    
    return {"message": "User activated", "success": True}


# Password Reset Management
@router.get("/password-resets", response_model=PasswordResetListResponse)
async def list_password_resets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List pending password reset requests.
    """
    query = db.query(User).filter(
        User.university_id == current_user.university_id,
        User.password_reset_requested == True
    )
    
    total = query.count()
    users = query.offset((page - 1) * page_size).limit(page_size).all()
    
    requests = [
        PasswordResetRequest(
            id=user.id,
            user_name=user.name,
            user_email=user.email,
            requested_at=user.password_reset_requested_at
        )
        for user in users
    ]
    
    return PasswordResetListResponse(
        requests=requests,
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("/password-resets/{user_id}/reset")
async def reset_user_password(
    user_id: str,
    password_data: PasswordResetBody,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Reset a user's password.
    """
    user = db.query(User).filter(
        User.id == user_id,
        User.university_id == current_user.university_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.hashed_password = get_password_hash(password_data.new_password)
    user.password_reset_requested = False
    user.password_reset_requested_at = None
    db.commit()
    
    # Create notification
    notification = Notification(
        user_id=user_id,
        type=NotificationType.ANNOUNCEMENT,
        title="Password Reset",
        message="Your password has been reset by the administrator."
    )
    db.add(notification)
    db.commit()
    
    return {"message": "Password reset successfully", "success": True}


# Document Management
@router.get("/documents", response_model=AdminDocumentListResponse)
async def list_document_requests(
    status_filter: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List document requests for the university.
    """
    query = db.query(DocumentRequest).filter(
        DocumentRequest.university_id == current_user.university_id
    )
    
    if status_filter:
        try:
            status_enum = DocumentStatus(status_filter)
            query = query.filter(DocumentRequest.status == status_enum)
        except ValueError:
            pass
    
    query = query.order_by(DocumentRequest.requested_at.desc())
    
    total = query.count()
    requests = query.offset((page - 1) * page_size).limit(page_size).all()
    
    request_responses = []
    for req in requests:
        user = db.query(User).filter(User.id == req.user_id).first()
        request_responses.append(AdminDocumentRequestResponse(
            id=req.id,
            user_id=req.user_id,
            user_name=user.name if user else "Unknown",
            user_email=user.email if user else "",
            document_type=req.document_type,
            reason=req.reason,
            status=req.status.value,
            requested_at=req.requested_at,
            estimated_completion=req.estimated_completion
        ))
    
    return AdminDocumentListResponse(
        requests=request_responses,
        total=total,
        page=page,
        page_size=page_size
    )


@router.put("/documents/{request_id}/status")
async def update_document_status(
    request_id: str,
    new_status: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update document request status.
    """
    doc_request = db.query(DocumentRequest).filter(
        DocumentRequest.id == request_id,
        DocumentRequest.university_id == current_user.university_id
    ).first()
    
    if not doc_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document request not found"
        )
    
    try:
        doc_request.status = DocumentStatus(new_status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {[s.value for s in DocumentStatus]}"
        )
    
    db.commit()
    
    # Notify user
    notification = Notification(
        user_id=doc_request.user_id,
        type=NotificationType.ANNOUNCEMENT,
        title="Document Request Update",
        message=f"Your {doc_request.document_type} request has been {new_status}.",
        related_id=request_id
    )
    db.add(notification)
    db.commit()
    
    return {"message": f"Status updated to {new_status}", "success": True}


# Support Ticket Management
@router.get("/tickets", response_model=AdminTicketListResponse)
async def list_admin_tickets(
    status_filter: Optional[str] = None,
    priority: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List support tickets for the university.
    """
    query = db.query(SupportTicket).filter(
        SupportTicket.university_id == current_user.university_id
    )
    
    if status_filter:
        try:
            status_enum = TicketStatus(status_filter)
            query = query.filter(SupportTicket.status == status_enum)
        except ValueError:
            pass
    
    if priority:
        try:
            priority_enum = TicketPriority(priority)
            query = query.filter(SupportTicket.priority == priority_enum)
        except ValueError:
            pass
    
    query = query.order_by(SupportTicket.created_at.desc())
    
    total = query.count()
    tickets = query.offset((page - 1) * page_size).limit(page_size).all()
    
    ticket_responses = []
    for ticket in tickets:
        response_count = db.query(TicketResponse).filter(
            TicketResponse.ticket_id == ticket.id
        ).count()
        
        ticket_responses.append(AdminTicketResponse(
            id=ticket.id,
            user_id=ticket.user_id,
            user_name=ticket.user_name,
            user_email=ticket.user_email,
            subject=ticket.subject,
            category=ticket.category.value,
            priority=ticket.priority.value,
            status=ticket.status.value,
            description=ticket.description,
            response_count=response_count,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at
        ))
    
    return AdminTicketListResponse(
        tickets=ticket_responses,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/tickets/{ticket_id}", response_model=AdminTicketDetailResponse)
async def get_admin_ticket_detail(
    ticket_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get detailed support ticket with full conversation history.
    """
    ticket = db.query(SupportTicket).filter(
        SupportTicket.id == ticket_id,
        SupportTicket.university_id == current_user.university_id
    ).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Get all responses for this ticket
    responses = db.query(TicketResponse).filter(
        TicketResponse.ticket_id == ticket_id
    ).order_by(TicketResponse.created_at.asc()).all()
    
    response_list = [
        TicketResponseItem(
            id=r.id,
            message=r.message,
            responder_name=r.responder_name,
            is_admin=r.is_admin,
            created_at=r.created_at
        )
        for r in responses
    ]
    
    return AdminTicketDetailResponse(
        id=ticket.id,
        user_id=ticket.user_id,
        user_name=ticket.user_name,
        user_email=ticket.user_email,
        subject=ticket.subject,
        category=ticket.category.value,
        priority=ticket.priority.value,
        status=ticket.status.value,
        description=ticket.description,
        responses=response_list,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at
    )


@router.put("/tickets/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: str,
    new_status: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update support ticket status.
    """
    ticket = db.query(SupportTicket).filter(
        SupportTicket.id == ticket_id,
        SupportTicket.university_id == current_user.university_id
    ).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    try:
        ticket.status = TicketStatus(new_status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {[s.value for s in TicketStatus]}"
        )
    
    ticket.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": f"Ticket status updated to {new_status}", "success": True}


@router.post("/tickets/{ticket_id}/respond")
async def admin_respond_to_ticket(
    ticket_id: str,
    message: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Admin response to a support ticket.
    """
    ticket = db.query(SupportTicket).filter(
        SupportTicket.id == ticket_id,
        SupportTicket.university_id == current_user.university_id
    ).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    response = TicketResponse(
        ticket_id=ticket_id,
        responder_name=current_user.name,
        is_admin=True,
        message=message
    )
    
    db.add(response)
    
    if ticket.status == TicketStatus.OPEN:
        ticket.status = TicketStatus.IN_PROGRESS
    
    ticket.updated_at = datetime.utcnow()
    db.commit()
    
    # Notify user
    notification = Notification(
        user_id=ticket.user_id,
        type=NotificationType.ANNOUNCEMENT,
        title="Support Ticket Response",
        message=f"New response on your ticket: {ticket.subject}",
        related_id=ticket_id
    )
    db.add(notification)
    db.commit()
    
    return {"message": "Response added", "success": True}


# Fundraiser Management
@router.get("/fundraisers", response_model=List[FundraiserResponse])
async def list_fundraisers(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List fundraisers for the university.
    """
    fundraisers = db.query(Fundraiser).filter(
        Fundraiser.university_id == current_user.university_id
    ).order_by(Fundraiser.created_at.desc()).all()
    
    return [
        FundraiserResponse(
            id=f.id,
            title=f.title,
            description=f.description,
            image=f.image,
            goal_amount=f.goal_amount,
            current_amount=f.current_amount,
            donation_link=f.donation_link,
            start_date=f.start_date.isoformat() if f.start_date else None,
            end_date=f.end_date.isoformat() if f.end_date else None,
            is_active=f.is_active
        )
        for f in fundraisers
    ]


@router.post("/fundraisers", response_model=FundraiserResponse, status_code=status.HTTP_201_CREATED)
async def create_fundraiser(
    fundraiser_data: FundraiserCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new fundraiser.
    """
    fundraiser = Fundraiser(
        university_id=current_user.university_id,
        title=fundraiser_data.title,
        description=fundraiser_data.description,
        image=fundraiser_data.image,
        goal_amount=fundraiser_data.goal_amount,
        donation_link=fundraiser_data.donation_link,
        start_date=fundraiser_data.start_date,
        end_date=fundraiser_data.end_date
    )
    
    db.add(fundraiser)
    db.commit()
    db.refresh(fundraiser)
    
    return FundraiserResponse(
        id=fundraiser.id,
        title=fundraiser.title,
        description=fundraiser.description,
        image=fundraiser.image,
        goal_amount=fundraiser.goal_amount,
        current_amount=fundraiser.current_amount,
        donation_link=fundraiser.donation_link,
        start_date=fundraiser.start_date.isoformat() if fundraiser.start_date else None,
        end_date=fundraiser.end_date.isoformat() if fundraiser.end_date else None,
        is_active=fundraiser.is_active
    )


@router.put("/fundraisers/{fundraiser_id}", response_model=FundraiserResponse)
async def update_fundraiser(
    fundraiser_id: str,
    fundraiser_data: FundraiserUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update a fundraiser.
    """
    fundraiser = db.query(Fundraiser).filter(
        Fundraiser.id == fundraiser_id,
        Fundraiser.university_id == current_user.university_id
    ).first()
    
    if not fundraiser:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fundraiser not found"
        )
    
    if fundraiser_data.title is not None:
        fundraiser.title = fundraiser_data.title
    if fundraiser_data.description is not None:
        fundraiser.description = fundraiser_data.description
    if fundraiser_data.image is not None:
        fundraiser.image = fundraiser_data.image
    if fundraiser_data.goal_amount is not None:
        fundraiser.goal_amount = fundraiser_data.goal_amount
    if fundraiser_data.donation_link is not None:
        fundraiser.donation_link = fundraiser_data.donation_link
    if fundraiser_data.is_active is not None:
        fundraiser.is_active = fundraiser_data.is_active
    
    db.commit()
    db.refresh(fundraiser)
    
    return FundraiserResponse(
        id=fundraiser.id,
        title=fundraiser.title,
        description=fundraiser.description,
        image=fundraiser.image,
        goal_amount=fundraiser.goal_amount,
        current_amount=fundraiser.current_amount,
        donation_link=fundraiser.donation_link,
        start_date=fundraiser.start_date.isoformat() if fundraiser.start_date else None,
        end_date=fundraiser.end_date.isoformat() if fundraiser.end_date else None,
        is_active=fundraiser.is_active
    )


@router.delete("/fundraisers/{fundraiser_id}")
async def delete_fundraiser(
    fundraiser_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a fundraiser.
    """
    fundraiser = db.query(Fundraiser).filter(
        Fundraiser.id == fundraiser_id,
        Fundraiser.university_id == current_user.university_id
    ).first()
    
    if not fundraiser:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fundraiser not found"
        )
    
    db.delete(fundraiser)
    db.commit()
    
    return {"message": "Fundraiser deleted", "success": True}


# Ad Management
@router.get("/ads", response_model=List[AdResponse])
async def list_ads(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List ads for the university.
    """
    ads = db.query(Ad).filter(
        Ad.university_id == current_user.university_id
    ).order_by(Ad.created_at.desc()).all()
    
    return [
        AdResponse(
            id=ad.id,
            image=ad.image,
            title=ad.title,
            description=ad.description,
            link=ad.link,
            is_active=ad.is_active,
            type=ad.type
        )
        for ad in ads
    ]


@router.post("/ads", response_model=AdResponse, status_code=status.HTTP_201_CREATED)
async def create_ad(
    ad_data: AdCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new ad.
    """
    ad = Ad(
        university_id=current_user.university_id,
        image=ad_data.image,
        title=ad_data.title,
        description=ad_data.description,
        link=ad_data.link,
        type=ad_data.type or "general"
    )
    
    db.add(ad)
    db.commit()
    db.refresh(ad)
    
    return AdResponse(
        id=ad.id,
        image=ad.image,
        title=ad.title,
        description=ad.description,
        link=ad.link,
        is_active=ad.is_active,
        type=ad.type
    )


@router.put("/ads/{ad_id}", response_model=AdResponse)
async def update_ad(
    ad_id: str,
    ad_data: AdUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update an ad.
    """
    ad = db.query(Ad).filter(
        Ad.id == ad_id,
        Ad.university_id == current_user.university_id
    ).first()
    
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ad not found"
        )
    
    if ad_data.image is not None:
        ad.image = ad_data.image
    if ad_data.title is not None:
        ad.title = ad_data.title
    if ad_data.description is not None:
        ad.description = ad_data.description
    if ad_data.link is not None:
        ad.link = ad_data.link
    if ad_data.is_active is not None:
        ad.is_active = ad_data.is_active
    
    db.commit()
    db.refresh(ad)
    
    return AdResponse(
        id=ad.id,
        image=ad.image,
        title=ad.title,
        description=ad.description,
        link=ad.link,
        is_active=ad.is_active,
        type=ad.type
    )


@router.delete("/ads/{ad_id}")
async def delete_ad(
    ad_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Delete an ad.
    """
    ad = db.query(Ad).filter(
        Ad.id == ad_id,
        Ad.university_id == current_user.university_id
    ).first()
    
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ad not found"
        )
    
    db.delete(ad)
    db.commit()
    
    return {"message": "Ad deleted", "success": True}

