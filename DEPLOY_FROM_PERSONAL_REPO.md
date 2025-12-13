# 🚀 Deploy from Personal GitHub Repo (Company Policy Solution)

Since your company repo must stay private and Render's free tier requires public repos, here's how to deploy using your **personal GitHub account**.

## ✅ Solution Overview

**Strategy:** Mirror your company repo to your personal GitHub (public) for deployment, while keeping company repo private.

```
Company Repo (Private) → Personal GitHub (Public) → Render (Auto-deploy)
```

---

## 🎯 Option 1: Personal GitHub Mirror (Recommended)

### Step 1: Create Personal GitHub Repository

1. Go to **https://github.com/new** (your personal account)
2. Repository name: `alumni-portal` (or any name)
3. Make it **Public** (required for Render free tier)
4. **Don't** initialize with README
5. Click **"Create repository"**

### Step 2: Add Personal GitHub as Remote

```bash
# Add your personal GitHub as a new remote
git remote add personal https://github.com/YOUR_PERSONAL_USERNAME/alumni-portal.git

# Verify remotes
git remote -v
```

You should see:
```
origin       https://git-codecommit.ap-south-1.amazonaws.com/v1/repos/almuni-portal (fetch)
origin       https://git-codecommit.ap-south-1.amazonaws.com/v1/repos/almuni-portal (push)
personal     https://github.com/YOUR_PERSONAL_USERNAME/alumni-portal.git (fetch)
personal     https://github.com/YOUR_PERSONAL_USERNAME/alumni-portal.git (push)
```

### Step 3: Push to Personal GitHub

```bash
# Push your dev branch to personal GitHub
git push personal dev

# Or push main/master
git push personal main
```

### Step 4: Deploy on Render

1. Go to **https://render.com**
2. Sign in with your **personal GitHub account**
3. Click **"New +"** → **"Web Service"**
4. Click **"Connect GitHub"** (authorize if needed)
5. Select your **personal repository**: `alumni-portal`
6. Select branch: `dev`
7. Follow the deployment configuration from `START_HERE_RENDER.md`

### Step 5: Keep Repos in Sync

**Create a sync script** (`sync_to_personal.sh`):

```bash
#!/bin/bash
# Sync company repo to personal GitHub for deployment

echo "🔄 Syncing to personal GitHub..."

# Push to company repo (CodeCommit)
git push origin dev

# Push to personal GitHub (triggers Render deploy)
git push personal dev

echo "✅ Synced to both repositories!"
echo "🚀 Render will auto-deploy from personal GitHub"
```

Make it executable:
```bash
chmod +x sync_to_personal.sh
```

Use it:
```bash
./sync_to_personal.sh
```

---

## 🎯 Option 2: Manual Deployment (No Public Repo Needed)

If you prefer not to use a public repo, you can deploy manually:

### Step 1: Create Render Service Manually

1. Go to **https://render.com**
2. Click **"New +"** → **"Web Service"**
3. Choose **"Public Git repository"**
4. Enter a dummy URL (we'll deploy manually)
5. Configure service settings
6. Create the service

### Step 2: Use Render CLI for Deployment

```bash
# Install Render CLI
npm install -g render-cli

# Login to Render
render login

# Deploy from local directory
cd /home/bhanushri123/almuni-portal
render deploy --service alumni-portal-api
```

**Note:** This requires manual deployment each time you make changes.

---

## 🎯 Option 3: Use Alternative Hosting (Supports Private Repos)

### Railway (Supports Private Repos - Free Tier)

1. Go to **https://railway.app**
2. Sign up with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your **private company repo** (Railway supports private repos)
6. Railway auto-detects FastAPI
7. Add environment variables
8. Deploy!

**Railway Free Tier:**
- $5 credit/month (usually enough for small apps)
- Supports private repos
- Auto-deploy on push
- Free PostgreSQL available

### Fly.io (Supports Private Repos - Free Tier)

1. Go to **https://fly.io**
2. Sign up with GitHub
3. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
4. Login: `fly auth login`
5. Deploy: `fly launch` (in your project directory)
6. Connect to your private GitHub repo

**Fly.io Free Tier:**
- 3 shared-cpu VMs free
- Supports private repos
- Auto-deploy on push

---

## 🎯 Option 4: GitHub Actions + Self-Hosted (Advanced)

If you want to keep everything private and self-host:

1. Use GitHub Actions to build Docker image
2. Push to Docker Hub (private)
3. Deploy to your own server/VPS
4. Or use services like DigitalOcean App Platform (supports private repos)

---

## 📋 Recommended Workflow

### Daily Development Flow

```bash
# 1. Make changes locally
git add .
git commit -m "Your changes"

# 2. Push to company repo (private)
git push origin dev

# 3. Push to personal GitHub (public, for Render)
git push personal dev

# 4. Render auto-deploys from personal GitHub
```

### Using the Sync Script

```bash
# One command to sync both
./sync_to_personal.sh
```

---

## 🔒 Security Considerations

### What to Exclude from Personal Repo

Make sure your `.gitignore` excludes sensitive files:
- `.env` (already ignored)
- `*.key`
- `*.pem`
- Company-specific secrets

### Environment Variables

**Never commit secrets!** Use Render's environment variables:
- `SECRET_KEY`
- `DATABASE_URL`
- `OPENAI_API_KEY`
- etc.

### Code Review

Before pushing to personal repo:
1. Review what you're pushing
2. Ensure no company secrets are included
3. Check `.gitignore` is working

---

## 🛠️ Quick Setup Script

Create `setup_personal_deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Setting up personal GitHub deployment..."

# Get personal GitHub username
read -p "Enter your personal GitHub username: " GITHUB_USER
read -p "Enter repository name (default: almuni-portal): " REPO_NAME
REPO_NAME=${REPO_NAME:-almuni-portal}

# Add personal remote
git remote add personal https://github.com/${GITHUB_USER}/${REPO_NAME}.git

echo "✅ Added personal remote: personal"
echo ""
echo "Next steps:"
echo "1. Create repository at: https://github.com/new"
echo "   Name: ${REPO_NAME}"
echo "   Make it PUBLIC"
echo "2. Run: git push personal dev"
echo "3. Deploy on Render using your personal GitHub"
```

Make it executable:
```bash
chmod +x setup_personal_deploy.sh
./setup_personal_deploy.sh
```

---

## 📊 Comparison Table

| Option | Public Repo Needed? | Auto-Deploy | Free Tier | Ease of Setup |
|--------|---------------------|-------------|-----------|---------------|
| **Personal GitHub → Render** | ✅ Yes | ✅ Yes | ✅ Free | ⭐⭐⭐⭐⭐ Easy |
| **Render CLI Manual** | ❌ No | ❌ No | ✅ Free | ⭐⭐⭐ Medium |
| **Railway** | ❌ No (private OK) | ✅ Yes | ✅ $5/month credit | ⭐⭐⭐⭐ Easy |
| **Fly.io** | ❌ No (private OK) | ✅ Yes | ✅ 3 VMs free | ⭐⭐⭐ Medium |

---

## ✅ Recommended Solution

**Use Option 1 (Personal GitHub Mirror)** because:
- ✅ Free
- ✅ Auto-deploys on push
- ✅ Easy to set up
- ✅ Keeps company repo private
- ✅ No IT approval needed

**Workflow:**
1. Develop in company repo (private)
2. Sync to personal GitHub (public)
3. Render auto-deploys from personal GitHub

---

## 🆘 Troubleshooting

### "Repository not found" on Render
- Make sure personal repo is **public**
- Make sure you're signed into Render with the same GitHub account

### "Permission denied" when pushing
- Check you have write access to personal repo
- Verify remote URL is correct: `git remote -v`

### Company policy concerns
- Personal repo only contains code (no secrets)
- Secrets are in Render environment variables
- Company repo stays completely private
- You're just mirroring for deployment

---

## 📝 Summary

**Best approach for your situation:**
1. ✅ Create public repo on your personal GitHub
2. ✅ Add it as `personal` remote
3. ✅ Push code to personal repo
4. ✅ Deploy on Render using personal GitHub
5. ✅ Use sync script to keep both in sync

**This way:**
- Company repo stays private ✅
- No IT approval needed ✅
- Free deployment ✅
- Auto-deploy works ✅

---

**Ready to set up?** Run the setup script or follow Option 1 step-by-step! 🚀

