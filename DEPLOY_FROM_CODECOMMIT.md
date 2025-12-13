# 🚀 Deploy to Render from AWS CodeCommit

Since Render works best with GitHub, but you're using AWS CodeCommit, here are **3 options** to deploy:

## 🎯 Option 1: Mirror to GitHub (Recommended - Easiest)

**Best for:** Automatic deployments, easiest setup

### Step 1: Create GitHub Repository

1. Go to **https://github.com**
2. Click **"New repository"**
3. Name: `almuni-portal`
4. Make it **Private** (or Public)
5. **Don't** initialize with README
6. Click **"Create repository"**

### Step 2: Add GitHub as Second Remote

```bash
# Add GitHub as a new remote (keep CodeCommit as origin)
git remote add github https://github.com/YOUR_USERNAME/almuni-portal.git

# Verify remotes
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
# Push current branch to GitHub
git push github dev

# Or push main/master
git push github main
```

### Step 4: Deploy on Render

1. Go to **https://render.com**
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect GitHub"**
4. Select your GitHub repository: `almuni-portal`
5. Follow the normal deployment steps

### Step 5: Keep Both Repos in Sync

**Option A: Manual Sync (when needed)**
```bash
# After making changes, push to both
git push origin dev      # CodeCommit
git push github dev      # GitHub
```

**Option B: Auto-Sync Script**

Create `sync_to_github.sh`:
```bash
#!/bin/bash
# Sync CodeCommit to GitHub

echo "🔄 Syncing to GitHub..."

# Push to CodeCommit
git push origin dev

# Push to GitHub
git push github dev

echo "✅ Synced to both repositories!"
```

Make it executable:
```bash
chmod +x sync_to_github.sh
```

Use it:
```bash
./sync_to_github.sh
```

---

## 🎯 Option 2: Use Render CLI (No GitHub Needed)

**Best for:** Direct deployment without GitHub

### Step 1: Install Render CLI

```bash
npm install -g render-cli
```

### Step 2: Login to Render

```bash
render login
```

This will open a browser to authenticate.

### Step 3: Create Service via CLI

```bash
# Create a new web service
render services:create \
  --name alumni-portal-api \
  --type web \
  --env python \
  --build-command "pip install -r requirements.txt" \
  --start-command "uvicorn app.main:app --host 0.0.0.0 --port $PORT" \
  --plan free
```

### Step 4: Connect CodeCommit (Manual)

Since Render CLI doesn't directly support CodeCommit, you'll need to:

1. **Create service manually in Render dashboard:**
   - Go to Render dashboard
   - Click "New +" → "Web Service"
   - Choose "Public Git repository"
   - Enter CodeCommit URL (but this might not work)

**OR**

2. **Use manual deployment:**
   - Create service without connecting repo
   - Deploy manually using Render CLI

### Step 5: Manual Deployment

```bash
# Build and deploy
render deploy --service alumni-portal-api
```

**Note:** This requires manual deployments each time.

---

## 🎯 Option 3: GitHub Actions Auto-Sync (Advanced)

**Best for:** Automatic syncing from CodeCommit to GitHub

### Step 1: Create GitHub Repository

Same as Option 1, Step 1.

### Step 2: Add GitHub Actions Secret

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add secret: `AWS_ACCESS_KEY_ID` (your AWS access key)
3. Add secret: `AWS_SECRET_ACCESS_KEY` (your AWS secret key)
4. Add secret: `AWS_REGION` = `ap-south-1`

### Step 3: Create GitHub Actions Workflow

Create `.github/workflows/sync-from-codecommit.yml`:

```yaml
name: Sync from CodeCommit

on:
  schedule:
    # Run every hour
    - cron: '0 * * * *'
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout GitHub repo
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Fetch from CodeCommit
        run: |
          git remote add codecommit https://git-codecommit.${{ secrets.AWS_REGION }}.amazonaws.com/v1/repos/almuni-portal
          git fetch codecommit
          git merge codecommit/dev --allow-unrelated-histories || true
          git push origin HEAD:dev
```

### Step 4: Deploy on Render

1. Connect GitHub repo to Render (as in Option 1)
2. Render will auto-deploy when GitHub Actions syncs

---

## 📋 Quick Comparison

| Option | Difficulty | Auto-Deploy | Best For |
|--------|-----------|-------------|----------|
| **Option 1: Mirror to GitHub** | ⭐ Easy | ✅ Yes | Most users |
| **Option 2: Render CLI** | ⭐⭐ Medium | ❌ No | CLI users |
| **Option 3: GitHub Actions** | ⭐⭐⭐ Advanced | ✅ Yes | Advanced users |

---

## 🚀 Recommended: Option 1 (Mirror to GitHub)

**Why?**
- ✅ Easiest to set up
- ✅ Automatic deployments
- ✅ Works with Render's UI
- ✅ No manual steps after initial setup

**Steps:**

1. **Create GitHub repo:**
   ```bash
   # Go to https://github.com/new
   # Create: almuni-portal
   ```

2. **Add GitHub remote:**
   ```bash
   git remote add github https://github.com/YOUR_USERNAME/almuni-portal.git
   ```

3. **Push to GitHub:**
   ```bash
   git push github dev
   ```

4. **Deploy on Render:**
   - Connect GitHub repo
   - Follow `START_HERE_RENDER.md`

5. **Keep in sync:**
   ```bash
   # After changes
   git push origin dev    # CodeCommit
   git push github dev    # GitHub (triggers Render deploy)
   ```

---

## 🔧 Helper Script: Auto-Sync

Create `sync_repos.sh`:

```bash
#!/bin/bash
# Sync to both CodeCommit and GitHub

BRANCH=${1:-dev}

echo "🔄 Syncing to CodeCommit and GitHub..."

# Push to CodeCommit
echo "📤 Pushing to CodeCommit..."
git push origin $BRANCH

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push github $BRANCH

echo "✅ Synced to both repositories!"
echo "🚀 Render will auto-deploy from GitHub!"
```

Make executable:
```bash
chmod +x sync_repos.sh
```

Use:
```bash
./sync_repos.sh dev
```

---

## ⚠️ Important Notes

### CodeCommit vs GitHub

- **CodeCommit:** Your primary repo (keep using this)
- **GitHub:** Mirror for Render (only for deployment)

### Security

- Keep `.env` out of both repos (already in `.gitignore`)
- Use Render's environment variables for secrets
- GitHub repo can be private

### Workflow

1. **Develop locally**
2. **Commit to CodeCommit** (your main repo)
3. **Push to GitHub** (triggers Render deploy)
4. **Render auto-deploys** from GitHub

---

## 🎯 Next Steps

1. **Choose an option** (recommend Option 1)
2. **Set up GitHub repo**
3. **Add GitHub remote**
4. **Push to GitHub**
5. **Deploy on Render** (follow `START_HERE_RENDER.md`)

---

## 📝 Quick Start (Option 1)

```bash
# 1. Create GitHub repo at https://github.com/new

# 2. Add GitHub remote
git remote add github https://github.com/YOUR_USERNAME/almuni-portal.git

# 3. Push to GitHub
git push github dev

# 4. Go to Render and connect GitHub repo
# 5. Follow START_HERE_RENDER.md for deployment
```

**That's it!** Your CodeCommit repo stays as primary, GitHub is just for Render deployment. 🚀

