"""
Admin Management Service
Handles admin user creation, password resets, and audit logging
"""
import secrets
import string
import json
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
import logging

from app.models.user import User, UserRole, UserProfile
from app.models.university import University
from app.models.admin_management import (
    AdminPasswordResetRequest, AdminAuditLog,
    PasswordResetStatus, AuditAction
)
from app.models.notification import Notification, NotificationType
from app.core.security import get_password_hash
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)

# Configuration
TEMP_PASSWORD_EXPIRY_HOURS = 24
PASSWORD_LENGTH = 12


def generate_secure_password(length: int = PASSWORD_LENGTH) -> str:
    """Generate a secure random password"""
    # Use a mix of letters, digits, and safe special characters
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    # Ensure at least one of each type
    password = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice("!@#$%^&*")
    ]
    # Fill the rest
    password += [secrets.choice(alphabet) for _ in range(length - 4)]
    # Shuffle
    secrets.SystemRandom().shuffle(password)
    return ''.join(password)


def create_audit_log(
    db: Session,
    action: AuditAction,
    performed_by: str,
    target_user_id: Optional[str] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> AdminAuditLog:
    """Create an audit log entry"""
    log = AdminAuditLog(
        action=action,
        performed_by=performed_by,
        target_user_id=target_user_id,
        details=json.dumps(details) if details else None,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    logger.info(f"Audit log created: {action.value} by {performed_by}")
    return log


def create_admin_user(
    db: Session,
    email: str,
    name: str,
    university_id: str,
    created_by: str,
    password: Optional[str] = None,
    send_email: bool = True,
    ip_address: Optional[str] = None
) -> Tuple[User, str]:
    """
    Create a new admin user with automatic password generation
    Returns (user, plain_password)
    """
    # Check if email exists
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise ValueError("Email already registered")
    
    # Verify university exists
    university = db.query(University).filter(University.id == university_id).first()
    if not university:
        raise ValueError("University not found")
    
    # Generate password if not provided
    plain_password = password or generate_secure_password()
    
    # Calculate password expiry
    expires_at = datetime.utcnow() + timedelta(hours=TEMP_PASSWORD_EXPIRY_HOURS)
    
    # Create admin user
    admin = User(
        email=email,
        username=email.split('@')[0],
        hashed_password=get_password_hash(plain_password),
        name=name,
        university_id=university_id,
        role=UserRole.ADMIN,
        is_active=True,
        force_password_reset=True,  # Must change password on first login
        temp_password_expires_at=expires_at
    )
    
    db.add(admin)
    db.commit()
    db.refresh(admin)
    
    # Create profile
    profile = UserProfile(user_id=admin.id)
    db.add(profile)
    db.commit()
    
    # Create audit log
    create_audit_log(
        db=db,
        action=AuditAction.ADMIN_CREATED,
        performed_by=created_by,
        target_user_id=admin.id,
        details={
            "admin_email": email,
            "admin_name": name,
            "university_id": university_id,
            "university_name": university.name
        },
        ip_address=ip_address
    )
    
    # Send email with credentials
    if send_email:
        try:
            email_service = EmailService.from_university(university)
            if email_service.enabled:
                email_service.send_admin_credentials_email(
                    to_email=email,
                    admin_name=name,
                    password=plain_password,
                    university_name=university.name,
                    expires_in_hours=TEMP_PASSWORD_EXPIRY_HOURS
                )
                logger.info(f"Admin credentials email sent to {email}")
        except Exception as e:
            logger.error(f"Failed to send admin credentials email: {str(e)}")
    
    return admin, plain_password


def request_password_reset(
    db: Session,
    admin_id: str,
    ip_address: Optional[str] = None
) -> AdminPasswordResetRequest:
    """
    Create a password reset request for an admin
    """
    admin = db.query(User).filter(
        User.id == admin_id,
        User.role == UserRole.ADMIN
    ).first()
    
    if not admin:
        raise ValueError("Admin not found")
    
    # Check if there's already a pending request
    existing = db.query(AdminPasswordResetRequest).filter(
        AdminPasswordResetRequest.admin_id == admin_id,
        AdminPasswordResetRequest.status == PasswordResetStatus.PENDING
    ).first()
    
    if existing:
        raise ValueError("A password reset request is already pending")
    
    # Create request
    request = AdminPasswordResetRequest(
        admin_id=admin_id,
        status=PasswordResetStatus.PENDING
    )
    
    db.add(request)
    
    # Also set the legacy flag
    admin.password_reset_requested = True
    admin.password_reset_requested_at = datetime.utcnow()
    
    db.commit()
    db.refresh(request)
    
    # Create audit log
    create_audit_log(
        db=db,
        action=AuditAction.PASSWORD_RESET_REQUESTED,
        performed_by=admin_id,
        target_user_id=admin_id,
        ip_address=ip_address
    )
    
    logger.info(f"Password reset request created for admin {admin_id}")
    return request


def approve_password_reset(
    db: Session,
    request_id: str,
    approved_by: str,
    send_email: bool = True,
    ip_address: Optional[str] = None
) -> Tuple[AdminPasswordResetRequest, str]:
    """
    Approve a password reset request and generate new password
    Returns (request, new_plain_password)
    """
    request = db.query(AdminPasswordResetRequest).filter(
        AdminPasswordResetRequest.id == request_id
    ).first()
    
    if not request:
        raise ValueError("Password reset request not found")
    
    if request.status != PasswordResetStatus.PENDING:
        raise ValueError(f"Request is already {request.status.value}")
    
    admin = db.query(User).filter(User.id == request.admin_id).first()
    if not admin:
        raise ValueError("Admin user not found")
    
    university = db.query(University).filter(University.id == admin.university_id).first()
    
    # Generate new password
    new_password = generate_secure_password()
    expires_at = datetime.utcnow() + timedelta(hours=TEMP_PASSWORD_EXPIRY_HOURS)
    
    # Update admin
    admin.hashed_password = get_password_hash(new_password)
    admin.force_password_reset = True
    admin.temp_password_expires_at = expires_at
    admin.password_reset_requested = False
    admin.password_reset_requested_at = None
    
    # Update request
    request.status = PasswordResetStatus.APPROVED
    request.processed_at = datetime.utcnow()
    request.processed_by = approved_by
    
    db.commit()
    db.refresh(request)
    
    # Create audit log
    create_audit_log(
        db=db,
        action=AuditAction.PASSWORD_RESET_APPROVED,
        performed_by=approved_by,
        target_user_id=admin.id,
        details={"request_id": request_id},
        ip_address=ip_address
    )
    
    # Create notification
    notification = Notification(
        user_id=admin.id,
        type=NotificationType.ANNOUNCEMENT,
        title="Password Reset Approved",
        message="Your password reset request has been approved. Check your email for new credentials."
    )
    db.add(notification)
    db.commit()
    
    # Send email
    if send_email:
        try:
            email_service = EmailService.from_university(university) if university else EmailService()
            if email_service.enabled:
                email_service.send_password_reset_approved_email(
                    to_email=admin.email,
                    admin_name=admin.name,
                    new_password=new_password,
                    expires_in_hours=TEMP_PASSWORD_EXPIRY_HOURS
                )
                logger.info(f"Password reset approved email sent to {admin.email}")
        except Exception as e:
            logger.error(f"Failed to send password reset approved email: {str(e)}")
    
    return request, new_password


def reject_password_reset(
    db: Session,
    request_id: str,
    rejected_by: str,
    reason: Optional[str] = None,
    send_email: bool = True,
    ip_address: Optional[str] = None
) -> AdminPasswordResetRequest:
    """
    Reject a password reset request
    """
    request = db.query(AdminPasswordResetRequest).filter(
        AdminPasswordResetRequest.id == request_id
    ).first()
    
    if not request:
        raise ValueError("Password reset request not found")
    
    if request.status != PasswordResetStatus.PENDING:
        raise ValueError(f"Request is already {request.status.value}")
    
    admin = db.query(User).filter(User.id == request.admin_id).first()
    if not admin:
        raise ValueError("Admin user not found")
    
    university = db.query(University).filter(University.id == admin.university_id).first()
    
    # Update admin
    admin.password_reset_requested = False
    admin.password_reset_requested_at = None
    
    # Update request
    request.status = PasswordResetStatus.REJECTED
    request.processed_at = datetime.utcnow()
    request.processed_by = rejected_by
    request.rejection_reason = reason
    
    db.commit()
    db.refresh(request)
    
    # Create audit log
    create_audit_log(
        db=db,
        action=AuditAction.PASSWORD_RESET_REJECTED,
        performed_by=rejected_by,
        target_user_id=admin.id,
        details={"request_id": request_id, "reason": reason},
        ip_address=ip_address
    )
    
    # Create notification
    notification = Notification(
        user_id=admin.id,
        type=NotificationType.ANNOUNCEMENT,
        title="Password Reset Declined",
        message=f"Your password reset request has been declined.{' Reason: ' + reason if reason else ''}"
    )
    db.add(notification)
    db.commit()
    
    # Send email
    if send_email:
        try:
            email_service = EmailService.from_university(university) if university else EmailService()
            if email_service.enabled:
                email_service.send_password_reset_rejected_email(
                    to_email=admin.email,
                    admin_name=admin.name,
                    reason=reason
                )
                logger.info(f"Password reset rejected email sent to {admin.email}")
        except Exception as e:
            logger.error(f"Failed to send password reset rejected email: {str(e)}")
    
    return request


def toggle_admin_status(
    db: Session,
    admin_id: str,
    toggled_by: str,
    ip_address: Optional[str] = None
) -> User:
    """
    Toggle admin active status
    """
    admin = db.query(User).filter(
        User.id == admin_id,
        User.role == UserRole.ADMIN
    ).first()
    
    if not admin:
        raise ValueError("Admin not found")
    
    old_status = admin.is_active
    admin.is_active = not old_status
    
    db.commit()
    db.refresh(admin)
    
    # Create audit log
    action = AuditAction.ADMIN_ACTIVATED if admin.is_active else AuditAction.ADMIN_DEACTIVATED
    create_audit_log(
        db=db,
        action=action,
        performed_by=toggled_by,
        target_user_id=admin_id,
        details={"old_status": old_status, "new_status": admin.is_active},
        ip_address=ip_address
    )
    
    return admin


def get_password_reset_stats(db: Session) -> dict:
    """Get password reset request statistics"""
    pending = db.query(AdminPasswordResetRequest).filter(
        AdminPasswordResetRequest.status == PasswordResetStatus.PENDING
    ).count()
    
    approved = db.query(AdminPasswordResetRequest).filter(
        AdminPasswordResetRequest.status == PasswordResetStatus.APPROVED
    ).count()
    
    rejected = db.query(AdminPasswordResetRequest).filter(
        AdminPasswordResetRequest.status == PasswordResetStatus.REJECTED
    ).count()
    
    return {
        "total": pending + approved + rejected,
        "pending": pending,
        "approved": approved,
        "rejected": rejected
    }


def check_temp_password_expired(user: User) -> bool:
    """Check if user's temporary password has expired"""
    if not user.temp_password_expires_at:
        return False
    return datetime.utcnow() > user.temp_password_expires_at


def complete_first_login_password_change(
    db: Session,
    user_id: str,
    new_password: str,
    ip_address: Optional[str] = None
) -> User:
    """
    Complete first login password change
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise ValueError("User not found")
    
    user.hashed_password = get_password_hash(new_password)
    user.force_password_reset = False
    user.temp_password_expires_at = None
    user.last_password_change = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    
    # Create audit log
    create_audit_log(
        db=db,
        action=AuditAction.FIRST_LOGIN_PASSWORD_CHANGE,
        performed_by=user_id,
        target_user_id=user_id,
        ip_address=ip_address
    )
    
    return user

