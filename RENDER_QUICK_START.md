# Render Quick Start - 5 Minute Deploy

## 🚀 Fastest Way to Deploy

### 1. Push to GitHub (if not already)
```bash
git add .
git commit -m "Ready for Render"
git push origin dev
```

### 2. Go to Render
- Visit: https://render.com
- Sign up with GitHub
- Click "New +" → "Web Service"

### 3. Connect Repository
- Select your GitHub repo: `almuni-portal`
- Branch: `dev`

### 4. Configure
- **Name**: `alumni-portal-api`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Plan**: Free

### 5. Add Environment Variables
Click "Advanced" → "Environment Variables", add:

```
DATABASE_URL=<your-neon-connection-string>
DATABASE_URL_SYNC=<your-neon-sync-connection-string>
SECRET_KEY=<generate-with: python -c "import secrets; print(secrets.token_urlsafe(32))">
DEBUG=False
ENVIRONMENT=production
```

### 6. Deploy
- Click "Create Web Service"
- Wait 5-10 minutes
- Done! 🎉

### 7. Run Migrations
After deployment, in Render dashboard:
- Go to your service → "Shell" tab
- Run:
  ```bash
  alembic upgrade head
  python -m app.db.init_db
  ```

### 8. Test
- Visit: `https://alumni-portal-api.onrender.com/docs`
- Test login with: `superadmin` / `superadmin123`

**That's it!** Your API is live! 🚀

For detailed guide, see `RENDER_DEPLOYMENT.md`

