"""
Email service for sending emails
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via SMTP"""
    
    def __init__(self, smtp_host=None, smtp_port=587, smtp_user=None, smtp_password=None, smtp_from_email=None):
        """
        Initialize email service with SMTP settings.
        If no settings provided, uses global settings from config.
        """
        try:
            self.smtp_host = smtp_host or getattr(settings, 'SMTP_HOST', None)
            self.smtp_port = smtp_port or getattr(settings, 'SMTP_PORT', 587)
            self.smtp_user = smtp_user or getattr(settings, 'SMTP_USER', None)
            self.smtp_password = smtp_password or getattr(settings, 'SMTP_PASSWORD', None)
            self.smtp_from_email = smtp_from_email or getattr(settings, 'SMTP_FROM_EMAIL', None) or self.smtp_user
            self.enabled = all([self.smtp_host, self.smtp_user, self.smtp_password])
        except Exception as e:
            logger.error(f"Error initializing EmailService: {str(e)}")
            self.enabled = False
    
    @classmethod
    def from_university(cls, university):
        """
        Create EmailService instance from University model.
        Falls back to global settings if university doesn't have email configured.
        """
        if university and university.email and university.smtp_host:
            return cls(
                smtp_host=university.smtp_host,
                smtp_port=university.smtp_port or 587,
                smtp_user=university.smtp_user,
                smtp_password=university.smtp_password,
                smtp_from_email=university.email
            )
        # Fall back to global settings
        return cls()
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None
    ) -> bool:
        """Send email using SMTP"""
        if not self.enabled:
            logger.warning(f"SMTP not configured. Email to {to_email} not sent.")
            return False

        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.smtp_from_email
            msg['To'] = to_email

            # Add plain text
            msg.attach(MIMEText(body, 'plain'))

            # Add HTML if provided
            if html_body:
                msg.attach(MIMEText(html_body, 'html'))

            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            logger.info(f"Email sent successfully to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {str(e)}")
            return False
    
    def send_welcome_email(
        self,
        to_email: str,
        user_name: str,
        password: str,
        university_name: Optional[str] = None,
        login_url: Optional[str] = None
    ) -> bool:
        """Send welcome email to newly created user"""
        login_url = login_url or "https://alumni-portal-hazel-tau.vercel.app/login"
        
        subject = f"Welcome to {university_name or 'Alumni Portal'}!"
        
        body = f"""
Dear {user_name},

Welcome to the Alumni Portal!

Your account has been created successfully. Here are your login credentials:

Email: {to_email}
Password: {password}

Please log in at: {login_url}

We recommend changing your password after your first login for security purposes.

If you have any questions, please contact your university administrator.

Best regards,
Alumni Portal Team
"""
        
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4F46E5; color: white; padding: 20px; text-align: center; }}
        .content {{ background-color: #f9f9f9; padding: 20px; }}
        .credentials {{ background-color: #fff; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {university_name or 'Alumni Portal'}!</h1>
        </div>
        <div class="content">
            <p>Dear {user_name},</p>
            <p>Your account has been created successfully. Here are your login credentials:</p>
            
            <div class="credentials">
                <p><strong>Email:</strong> {to_email}</p>
                <p><strong>Password:</strong> {password}</p>
            </div>
            
            <p>Please log in using the button below:</p>
            <a href="{login_url}" class="button">Log In</a>
            
            <p><strong>Important:</strong> We recommend changing your password after your first login for security purposes.</p>
            
            <p>If you have any questions, please contact your university administrator.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>Alumni Portal Team</p>
        </div>
    </div>
</body>
</html>
"""
        
        return self.send_email(to_email, subject, body, html_body)


# Create singleton instance
email_service = EmailService()

