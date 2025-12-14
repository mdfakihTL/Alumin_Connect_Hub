# Email Setup Guide

## Overview

The email service has been integrated into the admin user management system. When an admin creates a new user, a welcome email is automatically sent with login credentials.

## Configuration

To enable email sending, you need to configure SMTP settings in your environment variables or `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com          # Your SMTP server hostname
SMTP_PORT=587                     # SMTP port (usually 587 for TLS)
SMTP_USER=your-email@gmail.com    # Your SMTP username/email
SMTP_PASSWORD=your-app-password   # Your SMTP password or app password
SMTP_FROM_EMAIL=noreply@yourdomain.com  # Optional: From email address
```

## Popular SMTP Providers

### Brevo (Recommended)
Brevo (formerly Sendinblue) is a reliable email service that works well with cloud platforms like Render.

**Configuration:**
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-login@smtp-brevo.com
SMTP_PASSWORD=your-brevo-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

**Steps to get Brevo credentials:**
1. Sign up at https://www.brevo.com
2. Go to **Configuration** → **SMTP settings**
3. Copy the SMTP server, port, login, and password
4. Add them to Render environment variables

**Advantages:**
- ✅ Works reliably with cloud platforms (no network issues)
- ✅ Better deliverability
- ✅ Free tier available (300 emails/day)
- ✅ Professional email service

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Generate from Google Account settings
```

**Note**: For Gmail, you need to:
1. Enable 2-Step Verification
2. Generate an "App Password" from your Google Account settings
3. Use the app password (not your regular password)

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-smtp-username
SMTP_PASSWORD=your-mailgun-smtp-password
```

## Render Deployment

Add these environment variables in your Render dashboard:

1. Go to **Render Dashboard** → Your service → **Environment**
2. Add the following variables:
   - `SMTP_HOST`
   - `SMTP_PORT` (default: 587)
   - `SMTP_USER`
   - `SMTP_PASSWORD`
   - `SMTP_FROM_EMAIL` (optional)

## Email Content

When a new user is created, they receive a welcome email containing:
- Welcome message
- Login credentials (email and password)
- Login URL
- Security reminder to change password

The email is sent in both plain text and HTML format.

## Testing

### Test Email Configuration

You can test if email is working by:
1. Creating a new user through the admin panel
2. Checking the user's email inbox
3. Verifying the welcome email was received

### Troubleshooting

**Email not sending?**
- Check that all SMTP environment variables are set
- Verify SMTP credentials are correct
- Check Render logs for email errors
- Ensure SMTP port is not blocked by firewall

**Email service fails silently?**
- Email sending failures are logged but don't prevent user creation
- Check application logs for email error messages
- The user will still be created even if email fails

## Security Notes

⚠️ **Important**: The welcome email contains the user's password in plain text. This is intentional for initial account setup, but users should be encouraged to change their password after first login.

## Code Location

- **Email Service**: `backend/app/services/email_service.py`
- **Integration**: `backend/app/api/routes/admin.py` (create_user endpoint)
- **Configuration**: `backend/app/core/config.py`

## Next Steps

1. Configure SMTP settings in Render environment variables
2. Test by creating a new user
3. Verify email is received
4. Monitor logs for any email sending issues

