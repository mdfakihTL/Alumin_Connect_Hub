"""
Email service for sending emails via Brevo HTTP API
Render blocks SMTP ports, so we use HTTP API instead
"""
import os
import requests
from typing import Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Brevo API endpoint
BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


class EmailService:
    """Service for sending emails via Brevo HTTP API (works on Render!)"""
    
    def __init__(self, api_key=None, from_email=None, from_name=None):
        """
        Initialize email service with Brevo API settings.
        If no settings provided, uses global settings from config/env.
        """
        try:
            self.api_key = api_key or os.getenv('BREVO_API_KEY') or getattr(settings, 'BREVO_API_KEY', None)
            self.from_email = from_email or os.getenv('SMTP_FROM_EMAIL') or os.getenv('BREVO_FROM_EMAIL') or getattr(settings, 'SMTP_FROM_EMAIL', None) or 'noreply@alumni-portal.com'
            self.from_name = from_name or os.getenv('SMTP_FROM_NAME') or os.getenv('BREVO_FROM_NAME') or getattr(settings, 'SMTP_FROM_NAME', None) or 'Alumni Portal'
            self.enabled = bool(self.api_key)
            
            # Use print for guaranteed visibility in Render logs
            if self.enabled:
                print(f"✅ EmailService: Brevo API configured (from: {self.from_email})")
                logger.info(f"EmailService initialized with Brevo API (from: {self.from_email})")
            else:
                print(f"⚠️ EmailService: BREVO_API_KEY not set! Emails disabled.")
                print(f"   BREVO_API_KEY env var: {'SET' if os.getenv('BREVO_API_KEY') else 'NOT SET'}")
                logger.warning("EmailService: BREVO_API_KEY not set. Emails will not be sent.")
        except Exception as e:
            print(f"❌ EmailService init error: {str(e)}")
            logger.error(f"Error initializing EmailService: {str(e)}")
            self.enabled = False
    
    @classmethod
    def from_university(cls, university):
        """
        Create EmailService instance from University model.
        Falls back to global settings if university doesn't have email configured.
        """
        # For now, all universities use the global Brevo API key
        # University-specific from_email can be supported later
        if university and university.email:
            return cls(from_email=university.email, from_name=university.name)
        # Fall back to global settings
        return cls()
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None
    ) -> bool:
        """Send email using Brevo HTTP API"""
        print(f"📧 EmailService.send_email called for: {to_email}")
        
        if not self.enabled:
            print(f"⚠️ Email NOT sent to {to_email} - Brevo API not configured")
            logger.warning(f"Brevo API not configured (BREVO_API_KEY missing). Email to {to_email} not sent.")
            return False

        try:
            print(f"📤 Sending email to {to_email} via Brevo API...")
            
            headers = {
                "accept": "application/json",
                "api-key": self.api_key,
                "content-type": "application/json"
            }
            
            payload = {
                "sender": {
                    "name": self.from_name,
                    "email": self.from_email
                },
                "to": [
                    {
                        "email": to_email
                    }
                ],
                "subject": subject,
                "textContent": body
            }
            
            # Add HTML content if provided
            if html_body:
                payload["htmlContent"] = html_body

            response = requests.post(
                BREVO_API_URL,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                print(f"✅ Email sent successfully to {to_email}")
                logger.info(f"Email sent successfully to {to_email} via Brevo API")
                return True
            else:
                print(f"❌ Brevo API error: {response.status_code} - {response.text}")
                logger.error(f"Brevo API error: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.Timeout:
            print(f"❌ Timeout sending email to {to_email}")
            logger.error(f"Timeout sending email to {to_email}")
            return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Request error sending email to {to_email}: {str(e)}")
            logger.error(f"Request error sending email to {to_email}: {str(e)}")
            return False
        except Exception as e:
            print(f"❌ Error sending email to {to_email}: {str(e)}")
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
        .header {{ background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
        .credentials {{ background-color: #fff; padding: 20px; border-left: 4px solid #4F46E5; margin: 20px 0; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .button {{ display: inline-block; padding: 14px 28px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }}
        .button:hover {{ background-color: #4338CA; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }}
        .highlight {{ color: #4F46E5; font-weight: bold; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Welcome to {university_name or 'Alumni Portal'}!</h1>
        </div>
        <div class="content">
            <p>Dear <span class="highlight">{user_name}</span>,</p>
            <p>Your account has been created successfully. Here are your login credentials:</p>
            
            <div class="credentials">
                <p><strong>📧 Email:</strong> {to_email}</p>
                <p><strong>🔑 Password:</strong> <code style="background: #e5e7eb; padding: 2px 8px; border-radius: 4px;">{password}</code></p>
            </div>
            
            <p>Please log in using the button below:</p>
            <center>
                <a href="{login_url}" class="button">🚀 Log In Now</a>
            </center>
            
            <p><strong>⚠️ Important:</strong> We recommend changing your password after your first login for security purposes.</p>
            
            <p>If you have any questions, please contact your university administrator.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br><strong>Alumni Portal Team</strong></p>
            <p style="font-size: 11px; color: #999;">This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
"""
        
        return self.send_email(to_email, subject, body, html_body)


# Create singleton instance
email_service = EmailService()
