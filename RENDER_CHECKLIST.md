# ✅ Render Deployment Checklist

Use this checklist to ensure everything is ready for deployment.

## 🔑 Generated SECRET_KEY

**Your production SECRET_KEY:**
```
krkjPsyovqWDpHi1Epqx3Cg7zbJE0Zuh58pQYx9s-Vg
```

**⚠️ Save this!** You'll need it when setting environment variables in Render.

## 📋 Pre-Deployment Checklist

### Code Preparation
- [ ] All code changes committed
- [ ] Code pushed to repository
- [ ] `Procfile` is correct (✅ already fixed)
- [ ] `requirements.txt` is up to date
- [ ] `runtime.txt` specifies Python 3.11 (✅ already set)

### Database
- [ ] Neon database is set up (✅ already done)
- [ ] Have Neon connection string ready
- [ ] Connection string includes `?sslmode=require`

### Render Account
- [ ] Render account created
- [ ] GitHub/CodeCommit connected to Render

## 🚀 Deployment Steps

### Step 1: Push Code
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin dev
```

### Step 2: Create Web Service
- [ ] Go to https://render.com
- [ ] Click "New +" → "Web Service"
- [ ] Connect repository (CodeCommit or GitHub)
- [ ] Select branch: `dev`

### Step 3: Configure Service
- [ ] Name: `alumni-portal-api`
- [ ] Build Command: `pip install -r requirements.txt`
- [ ] Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Plan: Free
- [ ] Health Check Path: `/health`

### Step 4: Environment Variables
Add these in Render dashboard:

**Required:**
- [ ] `DATABASE_URL` = (your Neon async connection string)
- [ ] `DATABASE_URL_SYNC` = (your Neon sync connection string)
- [ ] `SECRET_KEY` = `krkjPsyovqWDpHi1Epqx3Cg7zbJE0Zuh58pQYx9s-Vg`
- [ ] `DEBUG` = `False`
- [ ] `ENVIRONMENT` = `production`
- [ ] `PORT` = `8000`

**Optional:**
- [ ] `CORS_ORIGINS` = (your frontend URL)
- [ ] `OPENAI_API_KEY` = (if using AI features)
- [ ] `REDIS_URL` = (if using Redis)

### Step 5: Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete (5-10 minutes)
- [ ] Check build logs for errors

### Step 6: Run Migrations
After deployment, in Render Shell:
- [ ] Run: `alembic upgrade head`
- [ ] Run: `python -m app.db.init_db`

### Step 7: Verify
- [ ] Health check: `https://alumni-portal-api.onrender.com/health`
- [ ] API docs: `https://alumni-portal-api.onrender.com/docs`
- [ ] Test login endpoint

## 📝 Notes

**Your Repository:**
- Type: AWS CodeCommit
- URL: `https://git-codecommit.ap-south-1.amazonaws.com/v1/repos/almuni-portal`
- Branch: `dev`

**Note:** Render works best with GitHub. If you have issues with CodeCommit, consider:
1. Pushing to GitHub as well
2. Using GitHub as the primary repository for Render

## 🎯 Quick Commands

**Generate new SECRET_KEY:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Test locally before deploying:**
```bash
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Check if server is running:**
```bash
curl http://localhost:8000/health
```

---

**Ready to deploy? Follow `DEPLOY_TO_RENDER.md` for detailed steps!** 🚀

