# Gmail App Password - Step by Step Guide

## ✅ You're Almost There!

I can see you have 2-Step Verification set up (Google prompt shows "1 device"). Now you need to generate an App Password.

## Steps to Generate App Password

### Step 1: Go to App Passwords
1. In the same Google Account page, look for **"App passwords"** in the left sidebar
2. Or go directly to: https://myaccount.google.com/apppasswords
3. You might need to sign in again

### Step 2: Generate App Password
1. At the top, click **"Select app"** dropdown
2. Choose **"Mail"**
3. Click **"Select device"** dropdown
4. Choose **"Other (Custom name)"**
5. Type: **"Alumni Portal"** or **"Render"**
6. Click **"Generate"**

### Step 3: Copy the Password
1. Google will show you a **16-character password**
2. It will look like: `abcd efgh ijkl mnop` (with spaces)
3. **Copy this password** - you won't see it again!
4. Click **"Done"**

### Step 4: Use in Render
1. Go to **Render Dashboard** → Your service → **Environment**
2. Add these variables:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
SMTP_FROM_EMAIL=your-gmail-address@gmail.com
```

**Important:**
- Use the **16-character app password** (not your regular Gmail password)
- You can remove spaces or keep them - both work
- Replace `your-gmail-address@gmail.com` with your actual Gmail

### Step 5: Save and Deploy
1. Click **"Save Changes"** in Render
2. Wait 2-3 minutes for auto-deployment
3. Test by creating a new user!

---

## Alternative: If You Can't Find App Passwords

If you don't see "App passwords" option:

1. Make sure **2-Step Verification is fully enabled**
   - Your screenshot shows Google prompt is active ✅
   - You might need to verify it's fully set up

2. Try this direct link:
   - https://myaccount.google.com/apppasswords

3. If still not visible:
   - Go to **Security** → **2-Step Verification**
   - Make sure it says "On" or "Active"
   - Scroll down to find "App passwords"

---

## Quick Test

After adding to Render, test by:
1. Login as admin: `admin@mit.edu` / `password123`
2. Create a new user
3. Check the user's email inbox
4. You should see a welcome email! 📧

---

## Troubleshooting

**"App passwords" option not showing?**
- Make sure 2-Step Verification is fully enabled
- Try using the direct link: https://myaccount.google.com/apppasswords
- Some Google Workspace accounts might have restrictions

**Password not working?**
- Make sure you copied the entire 16-character password
- Remove spaces if needed: `abcdefghijklmnop`
- Double-check the email address matches

**Still having issues?**
- Check Render logs for specific error messages
- Try using a different email provider (Outlook, SendGrid)
- See `EMAIL_SERVICE_SETUP_COMPLETE.md` for alternatives

---

## What You'll See

When you generate the app password, Google will show:
```
Your app password is:
abcd efgh ijkl mnop

Use this password in your app instead of your regular password.
```

Copy this exactly as shown (spaces optional).

---

## Security Note

⚠️ **Important**: 
- App passwords are different from your regular Gmail password
- They're safer because they're app-specific
- You can revoke them anytime from Google Account settings
- Never share your app password publicly

---

Good luck! Once you add the app password to Render, emails will start working! 🚀

