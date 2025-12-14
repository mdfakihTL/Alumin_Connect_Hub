# 🚀 Vercel Frontend Deployment Guide

## Step-by-Step Deployment

### 1. Go to Vercel Dashboard
Visit: https://vercel.com and sign in with GitHub

### 2. Import Your Repository
1. Click **"Add New"** → **"Project"**
2. Click **"Import Git Repository"**
3. Search for: `bhanushrichinta-coder/alumni-portal`
4. Click **"Import"**

### 3. Configure Project Settings

**Framework Preset**: Select **"Vite"** (or it should auto-detect)

**Root Directory**: Leave as `.` (root) or set to `.`

**Build and Output Settings**:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Add Environment Variable

**Before deploying**, click **"Environment Variables"** and add:

```
VITE_API_BASE_URL=https://alumni-portal-yw7q.onrender.com/api/v1
```

**Important**: Use your actual Render backend URL!

### 5. Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-3 minutes)
3. Copy your Vercel URL (e.g., `https://alumni-portal.vercel.app`)

### 6. Update CORS in Render

1. Go back to Render dashboard
2. Open your backend service
3. Go to **"Environment"** tab
4. Update `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://your-vercel-url.vercel.app
   ```
   (Replace with your actual Vercel URL)

5. Click **"Save Changes"** - Render will auto-redeploy

### 7. Test Integration

1. Open your Vercel URL
2. Try logging in:
   - Email: `john.doe@alumni.mit.edu`
   - Password: `password123`
3. Test features:
   - Create post with image
   - Admin delete post
   - Document requests

## 🔧 Troubleshooting

### Build Fails
- Check build logs in Vercel
- Ensure `package.json` has all dependencies
- Try: `npm install` locally first

### API Connection Errors
- Verify `VITE_API_BASE_URL` in Vercel matches Render URL
- Check CORS settings in Render
- Check browser console (F12) for errors

### Signin Not Working
- Check Render logs for backend errors
- Verify environment variables are set
- Clear browser cache and try again

## ✅ After Deployment

Your app will be live at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://alumni-portal-yw7q.onrender.com`

Both services will auto-deploy on every push to your GitHub repo!

