# Brevo SMTP Configuration

## Quick Setup for Render

Add these environment variables in your Render dashboard:

### Environment Variables

Go to **Render Dashboard** → **Your Service** → **Environment** → **Add Environment Variable**

Add these variables:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=9e08ea001@smtp-brevo.com
SMTP_PASSWORD=8EDP4SJvRWCL5glx
SMTP_FROM_EMAIL=noreply@alumni-portal.com
```

### Steps

1. **Go to Render Dashboard**
   - Navigate to your backend service
   - Click on **Environment** tab

2. **Add Each Variable**
   - Click **Add Environment Variable**
   - Add each variable one by one:
     - `SMTP_HOST` = `smtp-relay.brevo.com`
     - `SMTP_PORT` = `587`
     - `SMTP_USER` = `9e08ea001@smtp-brevo.com`
     - `SMTP_PASSWORD` = `8EDP4SJvRWCL5glx`
     - `SMTP_FROM_EMAIL` = `noreply@alumni-portal.com` (or your preferred email)

3. **Save and Redeploy**
   - Click **Save Changes**
   - Render will automatically redeploy
   - Wait for deployment to complete

4. **Test Email Sending**
   - Create a new user as admin
   - Check Render logs for "Email sent successfully"
   - Check the user's inbox for welcome email

## Testing

After configuration, test by:
1. Log in as admin
2. Go to User Management
3. Create a new user
4. Check Render logs for email status
5. Check the new user's email inbox

## Troubleshooting

### Issue: "Network is unreachable"
- ✅ **Fixed!** Brevo works reliably with cloud platforms
- No firewall issues like with Gmail

### Issue: "Authentication failed"
- Double-check `SMTP_USER` and `SMTP_PASSWORD`
- Make sure there are no extra spaces
- Verify credentials in Brevo dashboard

### Issue: "Email not received"
- Check Render logs for error messages
- Verify `SMTP_FROM_EMAIL` is set
- Check spam folder
- Verify Brevo account is active

## Brevo Dashboard

- **SMTP Settings**: Configuration → SMTP settings
- **API Settings**: Configuration → API Settings (for future API integration)
- **Email Logs**: Check sent emails in Brevo dashboard

## Next Steps

Once configured:
1. ✅ Emails will be sent when admins create new users
2. ✅ Welcome emails with login credentials
3. ✅ University-specific email support (when configured)

## Security Note

⚠️ **Important**: These credentials are sensitive. Never commit them to Git. Always use environment variables.

