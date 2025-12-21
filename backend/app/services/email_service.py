"""
Email service for sending emails via multiple providers:
1. Gmail SMTP (free, easy to set up)
2. Brevo HTTP API (for cloud deployment where SMTP is blocked)
"""
import os
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Brevo API endpoint
BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


class EmailService:
    """Service for sending emails via Gmail SMTP or Brevo API"""
    
    def __init__(self, api_key=None, from_email=None, from_name=None):
        """
        Initialize email service.
        Tries Gmail SMTP first, falls back to Brevo API.
        """
        try:
            # Gmail SMTP settings
            self.gmail_user = os.getenv('GMAIL_USER') or getattr(settings, 'GMAIL_USER', None)
            self.gmail_app_password = os.getenv('GMAIL_APP_PASSWORD') or getattr(settings, 'GMAIL_APP_PASSWORD', None)
            self.gmail_enabled = bool(self.gmail_user and self.gmail_app_password)
            
            # Brevo API settings (fallback)
            self.brevo_api_key = api_key or os.getenv('BREVO_API_KEY') or getattr(settings, 'BREVO_API_KEY', None)
            self.brevo_enabled = bool(self.brevo_api_key)
            
            # From email/name
            self.from_email = from_email or self.gmail_user or os.getenv('SMTP_FROM_EMAIL') or os.getenv('BREVO_FROM_EMAIL') or getattr(settings, 'SMTP_FROM_EMAIL', None) or 'noreply@alumni-portal.com'
            self.from_name = from_name or os.getenv('SMTP_FROM_NAME') or os.getenv('BREVO_FROM_NAME') or getattr(settings, 'BREVO_FROM_NAME', None) or 'Alumni Portal'
            
            # Overall enabled status
            self.enabled = self.gmail_enabled or self.brevo_enabled
            
            # Log status
            if self.gmail_enabled:
                print(f"✅ EmailService: Gmail SMTP configured (from: {self.gmail_user})")
                logger.info(f"EmailService initialized with Gmail SMTP (from: {self.gmail_user})")
            elif self.brevo_enabled:
                print(f"✅ EmailService: Brevo API configured (from: {self.from_email})")
                logger.info(f"EmailService initialized with Brevo API (from: {self.from_email})")
            else:
                print(f"⚠️ EmailService: No email provider configured! Emails disabled.")
                print(f"   To enable Gmail: Set GMAIL_USER and GMAIL_APP_PASSWORD in .env")
                print(f"   To enable Brevo: Set BREVO_API_KEY in .env")
                logger.warning("EmailService: No email provider configured. Emails will not be sent.")
                
        except Exception as e:
            print(f"❌ EmailService init error: {str(e)}")
            logger.error(f"Error initializing EmailService: {str(e)}")
            self.enabled = False
            self.gmail_enabled = False
            self.brevo_enabled = False
    
    @classmethod
    def from_university(cls, university):
        """
        Create EmailService instance from University model.
        Falls back to global settings if university doesn't have email configured.
        """
        if university and university.email:
            return cls(from_email=university.email, from_name=university.name)
        return cls()
    
    def _send_via_gmail(self, to_email: str, subject: str, body: str, html_body: Optional[str] = None) -> bool:
        """Send email via Gmail SMTP"""
        try:
            print(f"📤 Sending email via Gmail SMTP to {to_email}...")
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.gmail_user}>"
            msg['To'] = to_email
            
            # Attach text and HTML parts
            part1 = MIMEText(body, 'plain')
            msg.attach(part1)
            
            if html_body:
                part2 = MIMEText(html_body, 'html')
                msg.attach(part2)
            
            # Connect and send
            with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
                server.login(self.gmail_user, self.gmail_app_password)
                server.sendmail(self.gmail_user, to_email, msg.as_string())
            
            print(f"✅ Email sent successfully to {to_email} via Gmail")
            logger.info(f"Email sent successfully to {to_email} via Gmail SMTP")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            print(f"❌ Gmail authentication failed. Check your App Password.")
            logger.error(f"Gmail authentication error: {str(e)}")
            return False
        except Exception as e:
            print(f"❌ Gmail SMTP error: {str(e)}")
            logger.error(f"Gmail SMTP error sending to {to_email}: {str(e)}")
            return False
    
    def _send_via_brevo(self, to_email: str, subject: str, body: str, html_body: Optional[str] = None) -> bool:
        """Send email via Brevo HTTP API"""
        try:
            print(f"📤 Sending email via Brevo API to {to_email}...")
            
            headers = {
                "accept": "application/json",
                "api-key": self.brevo_api_key,
                "content-type": "application/json"
            }
            
            payload = {
                "sender": {
                    "name": self.from_name,
                    "email": self.from_email
                },
                "to": [{"email": to_email}],
                "subject": subject,
                "textContent": body
            }
            
            if html_body:
                payload["htmlContent"] = html_body

            response = requests.post(BREVO_API_URL, headers=headers, json=payload, timeout=30)
            
            if response.status_code in [200, 201]:
                print(f"✅ Email sent successfully to {to_email} via Brevo")
                logger.info(f"Email sent successfully to {to_email} via Brevo API")
                return True
            else:
                print(f"❌ Brevo API error: {response.status_code} - {response.text}")
                logger.error(f"Brevo API error: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Brevo API error: {str(e)}")
            logger.error(f"Brevo API error sending to {to_email}: {str(e)}")
            return False
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None
    ) -> bool:
        """Send email using available provider (Gmail first, then Brevo)"""
        print(f"📧 EmailService.send_email called for: {to_email}")
        
        if not self.enabled:
            print(f"⚠️ Email NOT sent to {to_email} - No email provider configured")
            logger.warning(f"No email provider configured. Email to {to_email} not sent.")
            return False
        
        # Try Gmail first
        if self.gmail_enabled:
            result = self._send_via_gmail(to_email, subject, body, html_body)
            if result:
                return True
            # If Gmail fails, try Brevo as fallback
            if self.brevo_enabled:
                print("📧 Gmail failed, trying Brevo as fallback...")
                return self._send_via_brevo(to_email, subject, body, html_body)
            return False
        
        # Try Brevo
        if self.brevo_enabled:
            return self._send_via_brevo(to_email, subject, body, html_body)
        
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
        .header {{ background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .credentials {{ background-color: #fff; padding: 20px; border-left: 4px solid #4F46E5; margin: 20px 0; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .button {{ display: inline-block; padding: 14px 28px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Welcome to {university_name or 'Alumni Portal'}!</h1>
        </div>
        <div class="content">
            <p>Dear <strong>{user_name}</strong>,</p>
            <p>Your account has been created successfully. Here are your login credentials:</p>
            
            <div class="credentials">
                <p><strong>📧 Email:</strong> {to_email}</p>
                <p><strong>🔑 Password:</strong> <code style="background: #e5e7eb; padding: 2px 8px; border-radius: 4px;">{password}</code></p>
            </div>
            
            <center>
                <a href="{login_url}" class="button">🚀 Log In Now</a>
            </center>
            
            <p><strong>⚠️ Important:</strong> We recommend changing your password after your first login.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br><strong>Alumni Portal Team</strong></p>
        </div>
    </div>
</body>
</html>
"""
        
        return self.send_email(to_email, subject, body, html_body)
    
    def send_password_reset_email(
        self,
        to_email: str,
        user_name: str,
        new_password: str,
        reset_by: str = "administrator",
        login_url: Optional[str] = None
    ) -> bool:
        """Send password reset notification email"""
        login_url = login_url or "https://alumni-portal-hazel-tau.vercel.app/login"
        
        subject = "Your Password Has Been Reset"
        
        body = f"""
Dear {user_name},

Your password has been reset by the {reset_by}.

Your new login credentials are:

Email: {to_email}
New Password: {new_password}

Please log in at: {login_url}

We recommend changing your password after logging in for security purposes.

If you did not request this password reset, please contact your administrator immediately.

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
        .header {{ background-color: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .credentials {{ background-color: #fff; padding: 20px; border-left: 4px solid #EF4444; margin: 20px 0; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .button {{ display: inline-block; padding: 14px 28px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }}
        .warning {{ background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔑 Password Reset</h1>
        </div>
        <div class="content">
            <p>Dear <strong>{user_name}</strong>,</p>
            <p>Your password has been reset by the <strong>{reset_by}</strong>.</p>
            
            <div class="credentials">
                <p><strong>📧 Email:</strong> {to_email}</p>
                <p><strong>🔑 New Password:</strong> <code style="background: #e5e7eb; padding: 2px 8px; border-radius: 4px;">{new_password}</code></p>
            </div>
            
            <center>
                <a href="{login_url}" class="button">🚀 Log In Now</a>
            </center>
            
            <div class="warning">
                <p><strong>⚠️ Security Tip:</strong> We recommend changing your password after logging in.</p>
            </div>
            
            <p>If you did not request this password reset, please contact your administrator immediately.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br><strong>Alumni Portal Team</strong></p>
        </div>
    </div>
</body>
</html>
"""
        
        return self.send_email(to_email, subject, body, html_body)


# Create singleton instance
email_service = EmailService()
