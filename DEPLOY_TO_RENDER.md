# 🚀 Deploy to Render - Step by Step Guide

Follow these steps to deploy your Alumni Portal to Render.

## ✅ Pre-Deployment Checklist

Before starting, make sure:
- [x] Code is working locally
- [ ] Code is pushed to GitHub
- [ ] Neon database is set up (already done ✅)
- [ ] You have your Neon connection strings

## 📋 Step 1: Prepare Your Code

### 1.1 Check Git Status
```bash
git status
```

### 1.2 Commit All Changes
```bash
git add .
git commit -m "Ready for Render deployment"
```

### 1.3 Push to GitHub
```bash
# If you haven't set up GitHub remote yet:
# git remote add origin https://github.com/YOUR_USERNAME/almuni-portal.git

git push origin dev
```

**Important:** Make sure your code is on GitHub. Render needs access to your repository.

## 🔑 Step 2: Generate Production SECRET_KEY

Run this command to generate a secure SECRET_KEY:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Save this key** - you'll need it in Step 5.

## 🌐 Step 3: Create Render Account

1. Go to **https://render.com**
2. Click **"Get Started for Free"**
3. **Sign up with GitHub** (recommended - easiest way)
4. Authorize Render to access your GitHub repositories
5. Verify your email if prompted

## 🗄️ Step 4: Database Setup

**You're already using Neon!** That's perfect. You just need your connection strings:

1. Go to your **Neon Dashboard**: https://console.neon.tech
2. Select your project
3. Go to **"Connection Details"**
4. Copy:
   - **Connection string** (for `DATABASE_URL`)
   - **Connection string** (for `DATABASE_URL_SYNC` - same but without `+asyncpg`)

**Note:** Make sure the connection string includes `?sslmode=require`

## 🚀 Step 5: Create Web Service on Render

### 5.1 Create New Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**

2. **Connect Repository:**
   - Click **"Connect GitHub"** (if not already connected)
   - Select your repository: `almuni-portal`
   - Click **"Connect"**

3. **Select Repository:**
   - Repository: `almuni-portal`
   - Branch: `dev` (or `main` if that's your main branch)
   - Click **"Continue"**

### 5.2 Configure Service

Fill in these settings:

- **Name**: `alumni-portal-api`
- **Region**: Choose closest to you (e.g., `Oregon`, `Frankfurt`)
- **Branch**: `dev`
- **Root Directory**: (leave empty)
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Plan**: **Free** (or Starter for always-on)

### 5.3 Advanced Settings

Click **"Advanced"** and set:

- **Health Check Path**: `/health`
- **Auto-Deploy**: `Yes` (deploys on git push)

### 5.4 Add Environment Variables

Click **"Add Environment Variable"** and add these one by one:

#### Required Variables:

```bash
# Database (from Neon)
DATABASE_URL=postgresql+asyncpg://user:pass@host.neon.tech:5432/dbname?sslmode=require
DATABASE_URL_SYNC=postgresql://user:pass@host.neon.tech:5432/dbname?sslmode=require

# Security (generate with command above)
SECRET_KEY=your-generated-secret-key-here

# Environment
DEBUG=False
ENVIRONMENT=production
PORT=8000
```

#### Optional Variables (add if needed):

```bash
# CORS (add your frontend URL)
CORS_ORIGINS=https://your-frontend.com,http://localhost:3000

# OpenAI (if using AI features)
OPENAI_API_KEY=sk-your-openai-key

# Redis (if using cloud Redis like Upstash)
REDIS_URL=redis://your-redis-url:6379/0
CELERY_BROKER_URL=redis://your-redis-url:6379/1
CELERY_RESULT_BACKEND=redis://your-redis-url:6379/2
```

**Important Notes:**
- Replace `DATABASE_URL` with your actual Neon connection string
- Replace `SECRET_KEY` with the key you generated
- Use `?sslmode=require` in database URLs for Neon

### 5.5 Deploy

1. Click **"Create Web Service"**
2. Render will start building your application
3. **Wait 5-10 minutes** for the first deployment
4. You can watch the build logs in real-time

## 🗃️ Step 6: Run Database Migrations

After deployment completes:

### Option A: Using Render Shell (Easiest)

1. In Render dashboard → Your service (`alumni-portal-api`)
2. Click **"Shell"** tab
3. Run these commands one by one:

```bash
alembic upgrade head
python -m app.db.init_db
```

### Option B: Using Render CLI

1. Install Render CLI:
   ```bash
   npm install -g render-cli
   ```

2. Login:
   ```bash
   render login
   ```

3. Run migrations:
   ```bash
   render exec alumni-portal-api -- alembic upgrade head
   render exec alumni-portal-api -- python -m app.db.init_db
   ```

## ✅ Step 7: Verify Deployment

### 7.1 Check Health Endpoint

Your API will be at: `https://alumni-portal-api.onrender.com`

Test health:
```bash
curl https://alumni-portal-api.onrender.com/health
```

Should return:
```json
{"status":"healthy","service":"Alumni Portal"}
```

### 7.2 Check API Documentation

Visit in browser:
```
https://alumni-portal-api.onrender.com/docs
```

### 7.3 Test Login

```bash
curl -X POST https://alumni-portal-api.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "superadmin123"
  }'
```

Should return access token and refresh token.

## 🎉 Success!

Your API is now live on Render! 🚀

**Your API URL:**
- Base: `https://alumni-portal-api.onrender.com`
- Docs: `https://alumni-portal-api.onrender.com/docs`
- Health: `https://alumni-portal-api.onrender.com/health`

## ⚠️ Important Notes

### Free Tier Limitations:

1. **Spins Down After 15 Minutes:**
   - Free tier services spin down after 15 minutes of inactivity
   - First request after spin-down takes ~30 seconds to wake up
   - **Solution:** Upgrade to Starter plan ($7/month) for always-on

2. **Build Time:**
   - First build: 5-10 minutes
   - Subsequent builds: 3-5 minutes

3. **Database:**
   - Continue using Neon (free tier is generous)
   - Render PostgreSQL free tier: 90 days only

### Auto-Deploy:

Render automatically deploys when you push to your connected branch:

```bash
git push origin dev
```

Render will detect the push and deploy automatically!

## 🔧 Troubleshooting

### Build Fails

**Check logs:**
- Go to Render dashboard → Your service → "Logs" tab
- Look for error messages

**Common issues:**
- Missing dependencies in `requirements.txt`
- Wrong Python version (should be 3.11)
- Build command error

### Application Won't Start

**Check:**
- Environment variables are set correctly
- `DATABASE_URL` is correct
- `SECRET_KEY` is set
- Start command uses `$PORT`

### Database Connection Fails

**For Neon:**
- Ensure `?sslmode=require` is in URL
- Check Neon dashboard for connection status
- Verify connection string is correct

### Migrations Fail

**Run manually in Shell:**
```bash
alembic upgrade head
```

**Check:**
- Database user has CREATE TABLE permissions
- Database exists
- Connection string is correct

## 📊 Monitoring

### View Logs:
- Render dashboard → Your service → **"Logs"** tab
- Real-time logs available
- Download logs for analysis

### Metrics:
- Free tier: Basic metrics
- Paid tier: Advanced metrics and alerts

## 🔄 Next Steps

1. ✅ Test all endpoints
2. ✅ Set up custom domain (optional)
3. ✅ Configure CORS for your frontend
4. ✅ Set up monitoring/alerts
5. ✅ Consider upgrading to Starter plan for production

## 🔗 Useful Links

- **Render Dashboard:** https://dashboard.render.com
- **Render Docs:** https://render.com/docs
- **Neon Dashboard:** https://console.neon.tech
- **Your API:** `https://alumni-portal-api.onrender.com`
- **API Docs:** `https://alumni-portal-api.onrender.com/docs`

---

## 📝 Quick Reference

**Your Render Service:**
- Name: `alumni-portal-api`
- URL: `https://alumni-portal-api.onrender.com`
- Branch: `dev`

**Environment Variables Needed:**
- `DATABASE_URL` (from Neon)
- `DATABASE_URL_SYNC` (from Neon)
- `SECRET_KEY` (generate with Python)
- `DEBUG=False`
- `ENVIRONMENT=production`

**Commands to Run After Deploy:**
```bash
alembic upgrade head
python -m app.db.init_db
```

---

**Ready? Let's deploy!** 🚀

Follow the steps above, and your API will be live in about 10 minutes!

