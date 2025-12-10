# 🚀 Deploy to Render - START HERE

**Quick deployment guide with your specific details.**

## ⚡ 5-Minute Quick Deploy

### 1. Push Your Code (if not already)
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin dev
```

### 2. Go to Render
- Visit: **https://render.com**
- Sign up with GitHub (or email)
- Click **"New +"** → **"Web Service"**

### 3. Connect Repository
- **Option A (GitHub - Recommended):**
  - Click "Connect GitHub"
  - Select repository: `almuni-portal`
  - Branch: `dev`

- **Option B (CodeCommit):**
  - Use "Public Git repository"
  - URL: `https://git-codecommit.ap-south-1.amazonaws.com/v1/repos/almuni-portal`
  - Branch: `dev`

### 4. Configure Service

**Basic Settings:**
- **Name**: `alumni-portal-api`
- **Region**: Choose closest (e.g., `Oregon`, `Frankfurt`)
- **Branch**: `dev`
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Plan**: **Free**

**Advanced Settings:**
- Click **"Advanced"**
- **Health Check Path**: `/health`
- **Auto-Deploy**: `Yes`

### 5. Add Environment Variables

Click **"Add Environment Variable"** and add these:

#### Copy-Paste These (Required):

```bash
DATABASE_URL=postgresql+asyncpg://neondb_owner:npg_Z7NihdH2AXGF@ep-solitary-grass-aheq8iv7-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

DATABASE_URL_SYNC=postgresql://neondb_owner:npg_Z7NihdH2AXGF@ep-solitary-grass-aheq8iv7-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

SECRET_KEY=krkjPsyovqWDpHi1Epqx3Cg7zbJE0Zuh58pQYx9s-Vg

DEBUG=False

ENVIRONMENT=production

PORT=8000
```

#### Optional (Add if needed):

```bash
# CORS (add your frontend URL)
CORS_ORIGINS=https://your-frontend.com,http://localhost:3000

# OpenAI (if using AI features)
OPENAI_API_KEY=sk-your-openai-key
```

### 6. Deploy!

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for build
3. Watch the logs in real-time

### 7. Run Migrations

After deployment completes:

1. Go to your service → **"Shell"** tab
2. Run:
   ```bash
   alembic upgrade head
   python -m app.db.init_db
   ```

### 8. Test Your API

Your API will be at:
- **Base URL**: `https://alumni-portal-api.onrender.com`
- **Docs**: `https://alumni-portal-api.onrender.com/docs`
- **Health**: `https://alumni-portal-api.onrender.com/health`

Test it:
```bash
curl https://alumni-portal-api.onrender.com/health
```

Should return:
```json
{"status":"healthy","service":"Alumni Portal"}
```

## ✅ That's It!

Your API is now live! 🎉

## 📚 More Details

- **Full Guide**: See `DEPLOY_TO_RENDER.md`
- **Checklist**: See `RENDER_CHECKLIST.md`
- **Quick Start**: See `RENDER_QUICK_START.md`

## ⚠️ Important Notes

1. **Free Tier Spins Down:**
   - After 15 min inactivity, service sleeps
   - First request after sleep takes ~30 seconds
   - Upgrade to Starter ($7/month) for always-on

2. **Auto-Deploy:**
   - Push to `dev` branch → Auto-deploys
   - You'll get email when done

3. **Database:**
   - Using Neon (already configured ✅)
   - Connection strings are set above ✅

## 🆘 Troubleshooting

**Build fails?**
- Check logs in Render dashboard
- Verify `requirements.txt` is correct
- Check Python version (should be 3.11)

**App won't start?**
- Verify all environment variables are set
- Check `DATABASE_URL` is correct
- Ensure `SECRET_KEY` is set

**Database connection fails?**
- Verify connection strings include `?sslmode=require`
- Check Neon dashboard for connection status

---

**Ready? Go to https://render.com and follow steps above!** 🚀

