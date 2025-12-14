# 📋 Deployment Checklist

## ✅ Pre-Deployment (Completed)

- [x] Code pushed to GitHub (`bhanushrichinta-coder/alumni-portal`)
- [x] Backend deployed to Render (`https://alumni-portal-yw7q.onrender.com`)
- [x] Build tested locally (`npm run build` succeeds)
- [x] All features implemented:
  - [x] S3 media uploads
  - [x] Admin post deletion
  - [x] Document requests
  - [x] Lead intelligence

## 🚀 Vercel Deployment (Do Now)

### 1. Import Project
- [ ] Go to https://vercel.com
- [ ] Sign in with GitHub
- [ ] Click "Add New" → "Project"
- [ ] Import `bhanushrichinta-coder/alumni-portal`

### 2. Configure Settings
- [ ] Framework: Vite (auto-detected)
- [ ] Root Directory: `.`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`

### 3. Environment Variables
- [ ] Add: `VITE_API_BASE_URL=https://alumni-portal-yw7q.onrender.com/api/v1`

### 4. Deploy
- [ ] Click "Deploy"
- [ ] Wait for build (2-3 minutes)
- [ ] Copy Vercel URL

### 5. Update CORS
- [ ] Go to Render dashboard
- [ ] Update `CORS_ORIGINS` with Vercel URL
- [ ] Save and redeploy

## 🧪 Testing

### Basic Functionality
- [ ] Frontend loads at Vercel URL
- [ ] Login works (`john.doe@alumni.mit.edu` / `password123`)
- [ ] Dashboard loads
- [ ] No console errors

### Features
- [ ] Create text post
- [ ] Create post with image (S3 upload)
- [ ] Create post with video (S3 upload)
- [ ] Admin can delete posts
- [ ] Document requests work
- [ ] Admin can approve/reject documents
- [ ] Lead intelligence displays (super admin)

### Integration
- [ ] API calls succeed (check Network tab)
- [ ] No CORS errors
- [ ] Images/videos upload to S3
- [ ] Backend responds correctly

## 📝 URLs to Save

- **Frontend**: `https://________________.vercel.app`
- **Backend**: `https://alumni-portal-yw7q.onrender.com`
- **API**: `https://alumni-portal-yw7q.onrender.com/api/v1`

## ✅ Completion

Once all items are checked:
- [ ] App is fully functional
- [ ] All features working
- [ ] Ready for production use

