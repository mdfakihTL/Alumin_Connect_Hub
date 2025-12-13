# 🚀 Render Deployment Steps - Quick Guide

## Step 1: Prepare Your Code

1. **Add deployment files to git:**
   ```bash
   git add render.yaml Procfile runtime.txt
   git commit -m "Add Render deployment configuration"
   git push origin dev
   ```

## Step 2: Create Render Account

1. Go to: https://render.com
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (recommended)
4. Authorize Render to access your repositories

## Step 3: Create PostgreSQL Database

1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `alumni-portal-db`
   - **Database**: `alumni_portal` (or leave default)
   - **User**: Leave default
   - **Region**: Choose closest to you (e.g., `Oregon (US West)`)
   - **PostgreSQL Version**: `15` or latest
   - **Plan**: **Free**
3. Click **"Create Database"**
4. **IMPORTANT**: Copy the **Internal Database URL** (starts with `postgresql://`)
   - You'll see it in the database dashboard
   - It looks like: `postgresql://user:password@dpg-xxxxx-a/alumni_portal`

## Step 4: Create Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub account if not already
3. Select your repository: `alumni-portal`
4. Select branch: `dev` (or `main` if you prefer)
5. Configure the service:

   **Basic Settings:**
   - **Name**: `alumni-portal-api`
   - **Region**: Same as database
   - **Branch**: `dev` (or your main branch)
   - **Root Directory**: (leave empty)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## Step 5: Configure Environment Variables

In the **Environment** section, click **"Add Environment Variable"** and add:

### Required Variables:

```env
DATABASE_URL=<Internal Database URL from Step 3>
DATABASE_URL_SYNC=<Same as DATABASE_URL but remove +asyncpg>
SECRET_KEY=<Generate using: python -c "import secrets; print(secrets.token_urlsafe(32))">
DEBUG=False
ENVIRONMENT=production
PORT=8000
```

### Optional Variables (add if needed):

```env
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
OPENAI_API_KEY=<your-openai-key-if-needed>
CORS_ORIGINS=*
```

**Important Notes:**
- For `DATABASE_URL_SYNC`: If your `DATABASE_URL` is `postgresql+asyncpg://...`, change it to `postgresql://...` (remove `+asyncpg`)
- Generate `SECRET_KEY` by running: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- Copy the generated key and paste it as `SECRET_KEY` value

## Step 6: Deploy

1. Click **"Create Web Service"**
2. Render will start building your application
3. Wait 5-10 minutes for first deployment
4. Watch the build logs for any errors

## Step 7: Initialize Database

After successful deployment:

1. Go to your web service dashboard
2. Click on **"Shell"** tab (or use the terminal icon)
3. Run these commands:

```bash
# Run migrations
alembic upgrade head

# Initialize seed data
python -m app.db.init_db
```

## Step 8: Test Your API

Your API will be live at:
- **URL**: `https://alumni-portal-api.onrender.com` (or your custom name)
- **Health Check**: `https://alumni-portal-api.onrender.com/health`
- **API Docs**: `https://alumni-portal-api.onrender.com/docs`

## ✅ Verification Checklist

- [ ] Database created successfully
- [ ] Web service deployed
- [ ] Environment variables configured
- [ ] Migrations run successfully
- [ ] Seed data initialized
- [ ] Health endpoint working
- [ ] API docs accessible

## 🔧 Troubleshooting

### Build Fails
- Check build logs for errors
- Ensure `requirements.txt` is correct
- Verify Python version compatibility

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Check if using Internal Database URL (not External)
- Ensure database is in same region as web service

### Application Crashes
- Check runtime logs
- Verify all environment variables are set
- Check if `SECRET_KEY` is at least 32 characters

### Slow First Request
- This is normal on free tier (cold start)
- Subsequent requests will be faster
- Consider upgrading to paid plan for better performance

## 📝 Next Steps

1. **Set up custom domain** (optional):
   - Go to Settings → Custom Domain
   - Add your domain

2. **Enable auto-deploy** (already enabled by default):
   - Every push to your branch will trigger deployment

3. **Monitor your app**:
   - Check logs regularly
   - Monitor metrics in dashboard

4. **Set up Redis** (optional):
   - Use Upstash (free Redis): https://upstash.com
   - Or Redis Cloud free tier

## 🎉 Success!

Your FastAPI backend is now live on Render! 🚀

