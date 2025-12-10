# 🚀 Quick Guide: Deploy from CodeCommit to Render

## The Problem
Render works best with GitHub, but you're using AWS CodeCommit.

## The Solution
**Mirror your repo to GitHub** - Keep CodeCommit as primary, use GitHub for Render.

---

## ⚡ 5-Minute Setup

### Step 1: Create GitHub Repository

1. Go to **https://github.com/new**
2. Repository name: `almuni-portal`
3. Make it **Private** (recommended)
4. **Don't** initialize with README
5. Click **"Create repository"**

### Step 2: Add GitHub Remote

```bash
# Add GitHub as a remote (keep CodeCommit as origin)
git remote add github https://github.com/YOUR_USERNAME/almuni-portal.git

# Verify
git remote -v
```

You should see:
```
origin    https://git-codecommit.ap-south-1.amazonaws.com/v1/repos/almuni-portal (fetch)
origin    https://git-codecommit.ap-south-1.amazonaws.com/v1/repos/almuni-portal (push)
github    https://github.com/YOUR_USERNAME/almuni-portal.git (fetch)
github    https://github.com/YOUR_USERNAME/almuni-portal.git (push)
```

### Step 3: Push to GitHub

```bash
# Push your dev branch to GitHub
git push github dev
```

### Step 4: Deploy on Render

1. Go to **https://render.com**
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect GitHub"**
4. Select: `almuni-portal`
5. Branch: `dev`
6. Follow `START_HERE_RENDER.md` for configuration

---

## 🔄 Keeping Repos in Sync

### Option A: Use the Sync Script

```bash
# After making changes
./sync_repos.sh dev
```

This pushes to both CodeCommit and GitHub automatically.

### Option B: Manual Sync

```bash
# Push to CodeCommit (your primary repo)
git push origin dev

# Push to GitHub (triggers Render deploy)
git push github dev
```

---

## 📋 Workflow

1. **Develop locally** → Commit changes
2. **Push to CodeCommit** → `git push origin dev`
3. **Push to GitHub** → `git push github dev`
4. **Render auto-deploys** → From GitHub

---

## ✅ Benefits

- ✅ Keep using CodeCommit as primary
- ✅ GitHub is just for Render deployment
- ✅ Automatic deployments on Render
- ✅ Easy to maintain

---

## 🎯 That's It!

Your CodeCommit repo stays as your main repository, and GitHub is just a mirror for Render deployment.

**Next:** Follow `START_HERE_RENDER.md` to deploy on Render! 🚀

