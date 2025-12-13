"""
Email utility functions
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings
from app.core.logging import logger


async def send_email(
    to_email: str,
    subject: str,
    body: str,
    html_body: Optional[str] = None
) -> bool:
    """Send email using SMTP"""
    if not all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASSWORD]):
        logger.warning("SMTP not configured. Email not sent.")
        return False

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
        msg['To'] = to_email

        # Add plain text
        msg.attach(MIMEText(body, 'plain'))

        # Add HTML if provided
        if html_body:
            msg.attach(MIMEText(html_body, 'html'))

        # Send email
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

        logger.info(f"Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        return False


async def send_verification_email(to_email: str, verification_token: str) -> bool:
    """Send email verification link"""
    verification_url = f"https://your-domain.com/verify-email?token={verification_token}"
    subject = "Verify your email address"
    body = f"Please verify your email by clicking this link: {verification_url}"
    html_body = f"""
    <html>
      <body>
        <h2>Verify your email address</h2>
        <p>Please click the link below to verify your email:</p>
        <a href="{verification_url}">Verify Email</a>
      </body>
    </html>
    """
    return await send_email(to_email, subject, body, html_body)


