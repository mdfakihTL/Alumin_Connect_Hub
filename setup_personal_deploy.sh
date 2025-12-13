#!/bin/bash
# Setup script for deploying from personal GitHub repo

echo "🚀 Personal GitHub Deployment Setup"
echo "===================================="
echo ""

# Check if personal remote already exists
if git remote | grep -q "personal"; then
    echo "⚠️  'personal' remote already exists!"
    git remote -v | grep personal
    echo ""
    read -p "Do you want to remove and recreate it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote remove personal
        echo "✅ Removed existing 'personal' remote"
    else
        echo "Keeping existing remote. Exiting."
        exit 0
    fi
fi

# Get personal GitHub username
echo ""
read -p "Enter your personal GitHub username: " GITHUB_USER

if [ -z "$GITHUB_USER" ]; then
    echo "❌ Error: GitHub username is required"
    exit 1
fi

# Get repository name
read -p "Enter repository name (default: almuni-portal): " REPO_NAME
REPO_NAME=${REPO_NAME:-almuni-portal}

# Get branch name
read -p "Enter branch to deploy (default: dev): " BRANCH
BRANCH=${BRANCH:-dev}

# Add personal remote
echo ""
echo "📝 Adding personal remote..."
git remote add personal "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

if [ $? -eq 0 ]; then
    echo "✅ Added personal remote successfully!"
else
    echo "❌ Failed to add remote"
    exit 1
fi

# Show current remotes
echo ""
echo "📋 Current remotes:"
git remote -v

echo ""
echo "===================================="
echo "✅ Setup Complete!"
echo "===================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Create repository on GitHub:"
echo "   👉 https://github.com/new"
echo "   - Name: ${REPO_NAME}"
echo "   - Make it PUBLIC (required for Render free tier)"
echo "   - Don't initialize with README"
echo ""
echo "2. Push your code:"
echo "   git push personal ${BRANCH}"
echo ""
echo "3. Or use the sync script:"
echo "   ./sync_to_personal.sh ${BRANCH}"
echo ""
echo "4. Deploy on Render:"
echo "   - Go to https://render.com"
echo "   - Sign in with your personal GitHub"
echo "   - Create Web Service"
echo "   - Connect to: ${GITHUB_USER}/${REPO_NAME}"
echo "   - Branch: ${BRANCH}"
echo ""
echo "📖 See DEPLOY_FROM_PERSONAL_REPO.md for full guide"
echo ""

