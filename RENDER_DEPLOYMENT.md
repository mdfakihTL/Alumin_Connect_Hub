# Render Deployment Guide - Step by Step

This guide will walk you through deploying your Alumni Portal to Render.

## 📋 Prerequisites

- ✅ GitHub account (or Git repository)
- ✅ Render account (free)
- ✅ Neon database already set up (or use Render's PostgreSQL)

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Code

1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Ready for Render deployment"
   ```

2. **Push to your repository:**
   ```bash
   git push origin dev
   ```

   **Note:** If using GitHub, make sure your code is pushed to GitHub. Render works best with GitHub.

### Step 2: Create Render Account

1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with **GitHub** (recommended) or email
4. Verify your email if needed

### Step 3: Create PostgreSQL Database (Optional - if not using Neon)

**If you want to use Render's PostgreSQL instead of Neon:**

1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `alumni-portal-db`
   - **Database**: `alumni_portal`
   - **User**: `alumni_user` (or leave default)
   - **Region**: Choose closest to you
   - **PostgreSQL Version**: 15
   - **Plan**: **Free** (or Starter for production)
3. Click **"Create Database"**
4. **Copy the Internal Database URL** (you'll need this)

**OR continue using Neon** (recommended - already set up)

### Step 4: Create Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**

2. **Connect Repository:**
   - If using GitHub: Click "Connect GitHub" and authorize
   - Select your repository: `almuni-portal`
   - Select branch: `dev` (or `main`/`master`)

3. **Configure Service:**
   - **Name**: `alumni-portal-api`
   - **Region**: Choose closest to you
   - **Branch**: `dev` (or your main branch)
   - **Root Directory**: Leave empty (or `.` if needed)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: **Free**

4. Click **"Advanced"** and set:
   - **Health Check Path**: `/health`

### Step 5: Configure Environment Variables

In the Web Service → **Environment** tab, add these variables:

#### Required Variables:

```bash
# Database (use your Neon connection string)
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db?sslmode=require
DATABASE_URL_SYNC=postgresql://user:pass@host:5432/db?sslmode=require

# Security
SECRET_KEY=<generate-strong-32-char-key>
DEBUG=False
ENVIRONMENT=production

# Server
PORT=8000
```

#### Optional Variables:

```bash
# CORS (add your frontend URL)
CORS_ORIGINS=https://your-frontend.com,http://localhost:3000

# OpenAI (if using AI features)
OPENAI_API_KEY=your-openai-api-key

# Redis (if using Upstash or other cloud Redis)
REDIS_URL=redis://your-redis-url:6379/0
CELERY_BROKER_URL=redis://your-redis-url:6379/1
CELERY_RESULT_BACKEND=redis://your-redis-url:6379/2
```

**Generate SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 6: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Install dependencies
   - Build your application
   - Start the service

3. **Wait 5-10 minutes** for the first deployment

4. Your API will be available at:
   ```
   https://alumni-portal-api.onrender.com
   ```

### Step 7: Run Database Migrations

After deployment, you need to run migrations:

**Option A: Using Render Shell (Recommended)**

1. In Render dashboard → Your Web Service
2. Click **"Shell"** tab
3. Run:
   ```bash
   alembic upgrade head
   python -m app.db.init_db
   ```

**Option B: Using Render CLI**

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

### Step 8: Verify Deployment

1. **Health Check:**
   ```bash
   curl https://alumni-portal-api.onrender.com/health
   ```
   Should return: `{"status":"healthy","service":"Alumni Portal"}`

2. **API Docs:**
   Visit: `https://alumni-portal-api.onrender.com/docs`

3. **Test Login:**
   ```bash
   curl -X POST https://alumni-portal-api.onrender.com/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "superadmin", "password": "superadmin123"}'
   ```

## 🔧 Configuration Files

### Using render.yaml (Infrastructure as Code)

If you want to use the `render.yaml` file:

1. In Render dashboard → **"New +"** → **"Blueprint"**
2. Connect your repository
3. Render will automatically detect `render.yaml`
4. Review and create services

**Note:** You'll still need to manually add:
- `DATABASE_URL` and `DATABASE_URL_SYNC` (from Neon)
- `SECRET_KEY`
- `OPENAI_API_KEY` (optional)
- `CORS_ORIGINS`

### Using Procfile

Render will automatically use `Procfile` if present. Our Procfile:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## ⚠️ Important Notes

### Free Tier Limitations:

1. **Spins Down After 15 Minutes:**
   - Free tier services spin down after 15 minutes of inactivity
   - First request after spin-down takes ~30 seconds
   - Consider upgrading to **Starter** ($7/month) for always-on

2. **Database:**
   - Render PostgreSQL free tier: 90 days, then $7/month
   - **Recommendation:** Continue using Neon (free tier is better)

3. **Build Time:**
   - Free tier: ~5-10 minutes for first build
   - Subsequent builds: ~3-5 minutes

### Environment Variables Best Practices:

1. **Never commit `.env` file** (already in `.gitignore`)
2. **Use Render's Environment Variables** for all secrets
3. **Use different SECRET_KEY** for production
4. **Set DEBUG=False** in production

### Database Connection:

- **Neon:** Already configured, just use the connection string
- **Render PostgreSQL:** Use the Internal Database URL from Render dashboard

## 🐛 Troubleshooting

### Build Fails

**Error: "Module not found"**
- Check `requirements.txt` includes all dependencies
- Verify Python version (3.11)

**Error: "Port already in use"**
- Make sure you're using `$PORT` in start command
- Render sets `$PORT` automatically

### Application Won't Start

**Check Logs:**
1. Go to Render dashboard → Your service → **"Logs"** tab
2. Look for error messages

**Common Issues:**
- Missing environment variables
- Database connection failed
- Wrong start command

### Database Connection Issues

**For Neon:**
- Ensure `?sslmode=require` is in the URL
- Check Neon dashboard for connection status
- Verify IP allowlist (if enabled)

**For Render PostgreSQL:**
- Use Internal Database URL (not External)
- Check database is running

### Migrations Fail

**Run manually in Shell:**
```bash
alembic upgrade head
```

**Check database permissions:**
- Verify user has CREATE TABLE permissions
- Check if database exists

## 📊 Monitoring

### View Logs:
- Render dashboard → Your service → **"Logs"** tab
- Real-time logs available
- Download logs for analysis

### Metrics:
- Free tier: Basic metrics
- Paid tier: Advanced metrics and alerts

## 🔄 Auto-Deploy

Render automatically deploys when you push to your connected branch:

1. Push to `dev` branch:
   ```bash
   git push origin dev
   ```

2. Render detects the push
3. Automatically builds and deploys
4. You'll get email notification when done

## 🎯 Next Steps After Deployment

1. ✅ Test all endpoints
2. ✅ Set up custom domain (optional)
3. ✅ Configure CORS for your frontend
4. ✅ Set up monitoring/alerts
5. ✅ Consider upgrading to Starter plan for production

## 🔗 Useful Links

- **Render Dashboard:** https://dashboard.render.com
- **Render Docs:** https://render.com/docs
- **Your API:** `https://alumni-portal-api.onrender.com`
- **API Docs:** `https://alumni-portal-api.onrender.com/docs`

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub/Git repository
- [ ] Render account created
- [ ] Web service created
- [ ] Environment variables configured
- [ ] Database connected (Neon or Render)
- [ ] Service deployed successfully
- [ ] Migrations run
- [ ] Database initialized
- [ ] Health check passes
- [ ] API docs accessible
- [ ] Test login works

---

**Ready to deploy? Follow the steps above!** 🚀

