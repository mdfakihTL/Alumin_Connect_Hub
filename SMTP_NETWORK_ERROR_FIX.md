# SMTP Network Error Fix

## Error
```
Error sending email: [Errno 101] Network is unreachable
```

## Problem
Render's network cannot reach the SMTP server. This could be due to:
1. **Firewall blocking**: Render might block outbound SMTP connections
2. **SMTP server unreachable**: The SMTP host might not be accessible from Render
3. **Port blocked**: Port 587 might be blocked by Render's firewall

## Solutions

### Option 1: Use SendGrid (Recommended for Production)

SendGrid works well with cloud platforms like Render:

1. **Sign up**: https://sendgrid.com
2. **Get API Key**: Dashboard → Settings → API Keys → Create API Key
3. **Add to Render**:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=SG.your-api-key-here
   SMTP_FROM_EMAIL=noreply@yourdomain.com
   ```

### Option 2: Use Mailgun

1. **Sign up**: https://mailgun.com
2. **Get SMTP credentials**: Dashboard → Sending → SMTP credentials
3. **Add to Render**:
   ```env
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_USER=postmaster@yourdomain.mailgun.org
   SMTP_PASSWORD=your-mailgun-password
   SMTP_FROM_EMAIL=noreply@yourdomain.com
   ```

### Option 3: Check Gmail SMTP Settings

If using Gmail, try:
1. **Verify SMTP settings are correct**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   SMTP_FROM_EMAIL=your-email@gmail.com
   ```

2. **Try port 465 with SSL** (if 587 is blocked):
   ```env
   SMTP_PORT=465
   ```
   (Note: Code might need update for SSL instead of STARTTLS)

### Option 4: Use University Email (If Available)

When onboarding universities, they can provide their own SMTP:
- University SMTP servers are usually more reliable
- Configured when super admin creates university

## Current Status

- ✅ Email service code: Fixed
- ✅ Error handling: Improved
- ⚠️ Network connectivity: Issue from Render to SMTP server
- 💡 Solution: Use SendGrid/Mailgun or check firewall settings

## Quick Fix (SendGrid)

1. Sign up for SendGrid (free tier available)
2. Get API key
3. Add to Render environment variables
4. Redeploy
5. Test again

## Test After Fix

After updating SMTP settings:
1. Wait for Render to deploy
2. Create a new user
3. Check Render logs for "Email sent successfully"
4. Check user's inbox

## Why This Happens

Render (and many cloud platforms) sometimes block outbound SMTP connections to prevent spam. Using a professional email service like SendGrid or Mailgun:
- ✅ Works reliably with cloud platforms
- ✅ Better deliverability
- ✅ Professional email service
- ✅ Free tier available

