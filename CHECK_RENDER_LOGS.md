# How to Check Render Logs for Email Service Errors

## Quick Steps

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click on your backend service** (alumni-portal-backend)
3. **Click "Logs" tab** at the top
4. **Look for recent errors** around the time you tested

## What to Look For

### Error Messages to Search For:
- `"Error creating user"`
- `"Failed to send welcome email"`
- `"EmailService"`
- `"SMTP"`
- `"Traceback"`
- `"Exception"`

### Common Errors:

**1. SMTP Not Configured:**
```
SMTP not configured. Email to ... not sent.
```
**Fix**: Add SMTP environment variables in Render

**2. Authentication Failed:**
```
Error sending email: (535, '5.7.8 Username and Password not accepted')
```
**Fix**: Check SMTP_USER and SMTP_PASSWORD are correct

**3. Connection Error:**
```
Error sending email: [Errno 111] Connection refused
```
**Fix**: Check SMTP_HOST and SMTP_PORT are correct

**4. Import Error:**
```
ModuleNotFoundError: No module named 'app.services.email_service'
```
**Fix**: Code not deployed yet, wait for Render to deploy

## How to Share Logs

1. Copy the error message from Render logs
2. Include the timestamp
3. Share the full error traceback if available

## Test Again After Checking Logs

Once you identify the error:
1. Fix the issue (usually SMTP configuration)
2. Wait 2-3 minutes for deployment
3. Test again with: `python3 test_email_service.py`

## Current Test

We're testing with: **kaveri.chinta@gmail.com**

After fixing the issue, you should receive a welcome email at this address!

