# 📧 Email Service Setup Guide

## Quick Setup (For Now - Using Your Personal Email)

### Step 1: Choose Your Email Provider

You can use any of these:
- **Gmail** (Recommended for testing)
- **Outlook/Hotmail**
- **SendGrid** (Professional)
- **Mailgun** (Professional)
- **Your University Email** (if you have SMTP access)

### Step 2: Get SMTP Credentials

#### For Gmail:
1. Go to your Google Account: https://myaccount.google.com/
2. Enable **2-Step Verification** (required)
3. Go to **Security** → **2-Step Verification** → **App Passwords**
4. Generate an app password for "Mail"
5. Copy the 16-character password (you'll use this, not your regular password)

#### For Outlook:
- Use your regular email and password
- SMTP: `smtp-mail.outlook.com`
- Port: `587`

#### For SendGrid:
1. Sign up at https://sendgrid.com
2. Create an API key
3. Use SMTP settings from SendGrid dashboard

### Step 3: Add Environment Variables in Render

1. Go to **Render Dashboard** → Your backend service → **Environment**
2. Add these variables:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password-here
SMTP_FROM_EMAIL=your-email@gmail.com
```

**Example for Gmail:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourname@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
SMTP_FROM_EMAIL=yourname@gmail.com
```

**Example for Outlook:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=yourname@outlook.com
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=yourname@outlook.com
```

### Step 4: Save and Redeploy

1. Click **Save Changes**
2. Render will automatically redeploy
3. Wait 2-3 minutes for deployment

### Step 5: Test Email

1. Login as admin: `admin@mit.edu` / `password123`
2. Go to User Management
3. Create a new user
4. Check the user's email inbox for welcome email

---

## Future Setup (University-Specific Emails)

When onboarding universities through Super Admin:

### Step 1: Super Admin Creates University

When creating a university, provide:
- **Email**: `noreply@university.edu`
- **SMTP Host**: `smtp.university.edu` (or their SMTP server)
- **SMTP Port**: Usually `587`
- **SMTP User**: `noreply@university.edu`
- **SMTP Password**: University's SMTP password

### Step 2: System Automatically Uses University Email

- When admin creates users, emails are sent using university's SMTP
- If university doesn't have email configured, falls back to your global settings

---

## Configuration Examples

### Gmail Setup (Most Common)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourname@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_FROM_EMAIL=yourname@gmail.com
```

**Important for Gmail:**
- ✅ Must enable 2-Step Verification
- ✅ Must use App Password (not regular password)
- ✅ App Password is 16 characters with spaces

### Outlook Setup

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=yourname@outlook.com
SMTP_PASSWORD=your-regular-password
SMTP_FROM_EMAIL=yourname@outlook.com
```

### SendGrid Setup

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

### Mailgun Setup

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.mailgun.org
SMTP_PASSWORD=your-mailgun-smtp-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

---

## Troubleshooting

### Email Not Sending?

1. **Check Render Logs**:
   - Go to Render Dashboard → Your service → **Logs**
   - Look for email-related errors

2. **Verify Environment Variables**:
   - Make sure all SMTP variables are set
   - Check for typos in email/password

3. **Gmail Specific Issues**:
   - Ensure 2-Step Verification is enabled
   - Use App Password, not regular password
   - Remove spaces from app password if needed

4. **Test SMTP Connection**:
   ```python
   # You can test in Python:
   import smtplib
   server = smtplib.SMTP('smtp.gmail.com', 587)
   server.starttls()
   server.login('your-email@gmail.com', 'your-app-password')
   print("✅ SMTP connection successful!")
   ```

### Common Errors

**"SMTP not configured"**
- Add all SMTP environment variables in Render

**"Authentication failed"**
- Check username/password
- For Gmail: Use App Password, not regular password

**"Connection refused"**
- Check SMTP_HOST and SMTP_PORT
- Verify firewall/network allows SMTP

---

## What Emails Are Sent?

Currently implemented:
- ✅ **Welcome Email**: Sent when admin creates a new user
  - Contains login credentials
  - Includes university name
  - HTML formatted

Future (can be added):
- Password reset emails
- Document request notifications
- Event reminders
- Support ticket responses

---

## Security Notes

⚠️ **Important**:
- SMTP passwords are stored in environment variables (secure)
- For production, consider using encrypted secrets
- Welcome emails contain plain text passwords (users should change after first login)
- University SMTP passwords stored in database (consider encryption for production)

---

## Summary

**For Now:**
1. Add SMTP environment variables in Render
2. Use your personal email (Gmail recommended)
3. Test by creating a new user

**For Future:**
1. Super Admin adds email when creating universities
2. System automatically uses university email
3. Falls back to global settings if not configured

**All code is ready - just need to configure SMTP in Render!** 🚀

