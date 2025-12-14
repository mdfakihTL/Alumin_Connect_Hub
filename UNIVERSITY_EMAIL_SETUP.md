# University-Specific Email Configuration

## Overview

The email system now supports **university-specific SMTP settings**. When a super admin creates a university, they can configure email settings that will be used for all emails sent to users of that university.

## How It Works

### 1. **For Now (Current Setup)**
- Use your personal email in Render environment variables:
  ```env
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your-email@gmail.com
  SMTP_PASSWORD=your-app-password
  ```
- This will be used as a **fallback** if a university doesn't have email configured

### 2. **When Adding a University (Super Admin)**
When a super admin creates a university, they can provide:
- **Email**: The email address to send from (e.g., `noreply@university.edu`)
- **SMTP Host**: SMTP server (e.g., `smtp.gmail.com`, `smtp.university.edu`)
- **SMTP Port**: Usually 587 for TLS
- **SMTP User**: SMTP username/email
- **SMTP Password**: SMTP password or app password

### 3. **Email Sending Priority**
When an admin creates a new user:
1. **First**: Check if the university has email/SMTP configured
2. **If yes**: Use university's SMTP settings to send welcome email
3. **If no**: Fall back to global SMTP settings (your personal email)

## API Endpoints

### Create University (Super Admin)
```json
POST /api/v1/superadmin/universities
{
  "id": "mit",
  "name": "Massachusetts Institute of Technology",
  "logo": "https://...",
  "colors": "{...}",
  "email": "noreply@mit.edu",
  "smtp_host": "smtp.mit.edu",
  "smtp_port": 587,
  "smtp_user": "noreply@mit.edu",
  "smtp_password": "mit-smtp-password"
}
```

### Update University Email Settings
```json
PUT /api/v1/superadmin/universities/{university_id}
{
  "email": "newemail@university.edu",
  "smtp_host": "smtp.university.edu",
  "smtp_port": 587,
  "smtp_user": "newemail@university.edu",
  "smtp_password": "new-password"
}
```

## Database Schema

The `University` model includes:
- `email`: University email address
- `smtp_host`: SMTP server hostname
- `smtp_port`: SMTP port (default: 587)
- `smtp_user`: SMTP username
- `smtp_password`: SMTP password (stored in database)

## Email Service Logic

```python
# EmailService automatically chooses:
1. University SMTP settings (if configured)
2. Global SMTP settings (fallback)

# Usage in admin.py:
uni_email_service = EmailService.from_university(university)
uni_email_service.send_welcome_email(...)
```

## Benefits

✅ **Multi-tenant**: Each university can use their own email  
✅ **Fallback**: Works even if university email not configured  
✅ **Flexible**: Can update email settings per university  
✅ **Secure**: SMTP passwords stored per university  

## Example Flow

1. **Super Admin** creates MIT university with email settings
2. **MIT Admin** creates a new alumni user
3. **System** sends welcome email using MIT's SMTP settings
4. **Email** appears to come from `noreply@mit.edu`

## Current Status

- ✅ University model has email/SMTP fields
- ✅ Super admin can add email when creating university
- ✅ Email service uses university settings with fallback
- ✅ Admin user creation sends email using university settings
- ✅ All changes pushed to repository

## Next Steps

1. **For now**: Keep your personal email in Render environment variables (fallback)
2. **When onboarding universities**: Super admin adds email/SMTP settings during university creation
3. **Result**: Each university's emails sent from their own email address

