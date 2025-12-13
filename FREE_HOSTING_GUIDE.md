# Free Hosting Guide for Alumni Portal

This guide covers the best **free hosting options** for your FastAPI Alumni Portal backend.

## 🏆 Top Free Hosting Options

### 1. **Render** (⭐ Recommended - Easiest)

**Why Render?**
- ✅ Free PostgreSQL database
- ✅ Free Redis (optional)
- ✅ Free web service
- ✅ Automatic SSL
- ✅ Easy deployment from GitHub
- ✅ Auto-deploy on git push

**Free Tier Limits:**
- Web service: Spins down after 15 min inactivity (wakes on request)
- PostgreSQL: 90 days free, then $7/month
- Redis: Free tier available

**Deployment Steps:**

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin dev
   ```

2. **Create Render Account:**
   - Go to https://render.com
   - Sign up with GitHub

3. **Create PostgreSQL Database:**
   - Click "New +" → "PostgreSQL"
   - Name: `alumni-portal-db`
   - Database: `alumni_portal`
   - Region: Choose closest
   - Plan: Free
   - Click "Create Database"
   - **Copy the Internal Database URL** (for use in web service)

4. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Select repository and branch (`dev`)
   - Configure:
     - **Name**: `alumni-portal-api`
     - **Environment**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     - **Plan**: Free

5. **Add Environment Variables:**
   In Render dashboard → Environment:
   ```
   DATABASE_URL=<from PostgreSQL service>
   DATABASE_URL_SYNC=<same as DATABASE_URL but replace +asyncpg with nothing>
   SECRET_KEY=<generate-strong-32-char-key>
   DEBUG=False
   ENVIRONMENT=production
   CORS_ORIGINS=https://your-frontend.com,http://localhost:3000
   OPENAI_API_KEY=<your-key-if-needed>
   REDIS_URL=<optional-redis-url>
   ```

6. **Deploy:**
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - Your API will be at: `https://alumni-portal-api.onrender.com`

7. **Run Migrations:**
   ```bash
   # In Render Shell (or locally with DATABASE_URL)
   alembic upgrade head
   python -m app.db.init_db
   ```

**Render Configuration File** (Optional - `render.yaml`):
```yaml
services:
  - type: web
    name: alumni-portal-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: alumni-portal-db
          property: connectionString
      - key: DATABASE_URL_SYNC
        fromDatabase:
          name: alumni-portal-db
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: DEBUG
        value: False
```

---

### 2. **Railway** (⭐ Great Alternative)

**Why Railway?**
- ✅ $5 free credit monthly
- ✅ Free PostgreSQL
- ✅ Free Redis
- ✅ Easy deployment
- ✅ No credit card required initially

**Deployment Steps:**

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Deploy:**
   ```bash
   railway init
   railway up
   ```

3. **Add PostgreSQL:**
   - In Railway dashboard → "New" → "Database" → "PostgreSQL"
   - Railway auto-sets `DATABASE_URL`

4. **Set Environment Variables:**
   - In Railway dashboard → Variables
   - Add all required env vars

5. **Run Migrations:**
   ```bash
   railway run alembic upgrade head
   railway run python -m app.db.init_db
   ```

**Railway Configuration** (`railway.json`):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

### 3. **Fly.io** (⭐ Best for Docker)

**Why Fly.io?**
- ✅ Free tier: 3 shared VMs
- ✅ 3GB persistent volumes
- ✅ 160GB outbound data/month
- ✅ Great for Docker deployments

**Deployment Steps:**

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   fly auth login
   ```

2. **Initialize Fly App:**
   ```bash
   fly launch
   # Follow prompts
   ```

3. **Create `fly.toml`:**
   ```toml
   app = "alumni-portal-api"
   primary_region = "iad"

   [build]
     dockerfile = "Dockerfile"

   [env]
     PORT = "8000"

   [[services]]
     internal_port = 8000
     protocol = "tcp"

     [[services.ports]]
       port = 80
       handlers = ["http"]
       force_https = true

     [[services.ports]]
       port = 443
       handlers = ["tls", "http"]
   ```

4. **Add PostgreSQL:**
   ```bash
   fly postgres create --name alumni-portal-db
   fly postgres attach alumni-portal-db
   ```

5. **Set Secrets:**
   ```bash
   fly secrets set SECRET_KEY="your-secret-key"
   fly secrets set OPENAI_API_KEY="your-key"
   ```

6. **Deploy:**
   ```bash
   fly deploy
   ```

---

### 4. **PythonAnywhere** (⭐ Simple Python Hosting)

**Why PythonAnywhere?**
- ✅ Free tier available
- ✅ Easy Python setup
- ✅ Good for beginners

**Limitations:**
- ❌ No PostgreSQL (use external like Neon)
- ❌ Limited to 1 web app on free tier
- ❌ Must use their domain

**Deployment Steps:**

1. **Sign up:** https://www.pythonanywhere.com

2. **Upload code:**
   - Use Files tab to upload or clone from GitHub
   - Or use Bash console: `git clone <your-repo>`

3. **Set up virtual environment:**
   ```bash
   python3.11 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Create Web App:**
   - Go to Web tab
   - Click "Add a new web app"
   - Choose "Manual configuration"
   - Python 3.11
   - Click Next

5. **Configure WSGI:**
   Edit `/var/www/yourusername_pythonanywhere_com_wsgi.py`:
   ```python
   import sys
   path = '/home/yourusername/almuni-portal'
   if path not in sys.path:
       sys.path.append(path)

   from app.main import app
   application = app
   ```

6. **Set Environment Variables:**
   - In Web tab → Environment variables
   - Add all required vars

7. **Reload:**
   - Click "Reload" button

---

### 5. **Google Cloud Run** (⭐ Serverless)

**Why Cloud Run?**
- ✅ Generous free tier
- ✅ Pay only for usage
- ✅ Auto-scaling
- ✅ Serverless

**Free Tier:**
- 2 million requests/month
- 360,000 GB-seconds
- 180,000 vCPU-seconds

**Deployment Steps:**

1. **Install gcloud CLI:**
   ```bash
   # Follow: https://cloud.google.com/sdk/docs/install
   gcloud init
   ```

2. **Create project:**
   ```bash
   gcloud projects create alumni-portal --name="Alumni Portal"
   gcloud config set project alumni-portal
   ```

3. **Enable APIs:**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable sqladmin.googleapis.com
   ```

4. **Create Cloud SQL (PostgreSQL):**
   ```bash
   gcloud sql instances create alumni-db \
     --database-version=POSTGRES_15 \
     --tier=db-f1-micro \
     --region=us-central1
   ```

5. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy alumni-portal-api \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars DATABASE_URL="your-db-url",SECRET_KEY="your-key"
   ```

---

### 6. **Heroku** (Limited Free Tier)

**Note:** Heroku removed free tier in 2022, but has low-cost options.

**Alternative:** Use **Render** (similar to old Heroku, but free)

---

## 📊 Comparison Table

| Platform | Free Tier | PostgreSQL | Redis | Ease | Best For |
|----------|-----------|------------|-------|------|----------|
| **Render** | ✅ Yes | ✅ Free | ✅ Free | ⭐⭐⭐⭐⭐ | Beginners |
| **Railway** | ✅ $5/mo | ✅ Free | ✅ Free | ⭐⭐⭐⭐⭐ | Quick deploy |
| **Fly.io** | ✅ 3 VMs | ✅ Add-on | ✅ Add-on | ⭐⭐⭐⭐ | Docker apps |
| **PythonAnywhere** | ✅ Limited | ❌ External | ❌ External | ⭐⭐⭐ | Simple apps |
| **Cloud Run** | ✅ Generous | ✅ Cloud SQL | ❌ External | ⭐⭐⭐ | Serverless |

---

## 🚀 Quick Start: Render (Recommended)

**Fastest way to get your app live:**

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Render deployment"
   git push origin dev
   ```

2. **Go to Render:**
   - https://render.com
   - Sign up with GitHub
   - Click "New +" → "PostgreSQL" (create database)
   - Click "New +" → "Web Service" (connect repo)

3. **Configure:**
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Add environment variables

4. **Deploy:**
   - Click "Create"
   - Wait 5-10 minutes
   - Your API is live! 🎉

---

## 🔧 Required Environment Variables

For all platforms, set these:

```bash
# Required
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
DATABASE_URL_SYNC=postgresql://user:pass@host:5432/db
SECRET_KEY=<generate-32-char-key>

# Recommended
DEBUG=False
ENVIRONMENT=production
CORS_ORIGINS=https://your-frontend.com

# Optional
OPENAI_API_KEY=<your-key>
REDIS_URL=redis://host:6379/0
```

**Generate SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 📝 Post-Deployment Checklist

After deploying:

- [ ] Run migrations: `alembic upgrade head`
- [ ] Initialize database: `python -m app.db.init_db`
- [ ] Test health endpoint: `https://your-app.com/health`
- [ ] Test API docs: `https://your-app.com/docs`
- [ ] Test login: Use default users
- [ ] Update CORS_ORIGINS with your frontend URL
- [ ] Set up custom domain (optional)
- [ ] Enable monitoring (optional)

---

## 🆘 Troubleshooting

### App won't start
- Check logs in platform dashboard
- Verify all environment variables are set
- Ensure `PORT` is set correctly (Render uses `$PORT`)

### Database connection fails
- Verify `DATABASE_URL` is correct
- Check if database allows external connections
- For Neon: Ensure `?sslmode=require` is in URL

### Migrations fail
- Run migrations manually via platform shell/console
- Check database permissions
- Verify `DATABASE_URL_SYNC` is set

### Slow cold starts (Render)
- Render free tier spins down after 15 min
- First request takes ~30 seconds
- Consider upgrading to paid tier for always-on

---

## 💡 Pro Tips

1. **Use Neon for Database:**
   - Keep using Neon (already set up)
   - Works with all hosting platforms
   - Free tier is generous

2. **Use Upstash for Redis:**
   - Free Redis in cloud
   - https://upstash.com
   - Perfect for free hosting

3. **Monitor Your App:**
   - Use platform's built-in monitoring
   - Or add Sentry (free tier available)

4. **Custom Domain:**
   - Most platforms support custom domains
   - Use Cloudflare for free DNS

5. **CI/CD:**
   - Connect GitHub for auto-deploy
   - Push to `dev` branch → auto-deploys

---

## 🎯 Recommended Setup

**For Beginners:**
1. **Render** for hosting
2. **Neon** for database (already set up)
3. **Upstash** for Redis (optional)

**For Advanced:**
1. **Fly.io** for hosting (Docker)
2. **Neon** for database
3. **Upstash** for Redis

---

## 📚 Additional Resources

- **Render Docs:** https://render.com/docs
- **Railway Docs:** https://docs.railway.app
- **Fly.io Docs:** https://fly.io/docs
- **Neon Docs:** https://neon.tech/docs
- **Upstash Redis:** https://upstash.com/docs

---

**Ready to deploy? Start with Render - it's the easiest!** 🚀

