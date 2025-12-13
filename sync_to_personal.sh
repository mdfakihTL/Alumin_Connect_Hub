#!/bin/bash
# Sync company repo to personal GitHub for Render deployment
# Usage: ./sync_to_personal.sh [branch]

BRANCH=${1:-dev}

echo "🔄 Syncing to personal GitHub for deployment..."
echo "Branch: $BRANCH"
echo ""

# Check if personal remote exists
if ! git remote | grep -q "personal"; then
    echo "❌ Error: 'personal' remote not found!"
    echo ""
    echo "To add it, run:"
    echo "  git remote add personal https://github.com/YOUR_USERNAME/alumni-portal.git"
    echo ""
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo "⚠️  Warning: You're on branch '$CURRENT_BRANCH', but syncing '$BRANCH'"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Push to company repo (CodeCommit)
echo "📤 Pushing to company repo (origin)..."
if git push origin "$BRANCH"; then
    echo "✅ Pushed to company repo"
else
    echo "❌ Failed to push to company repo"
    exit 1
fi

echo ""

# Push to personal GitHub
echo "📤 Pushing to personal GitHub (personal)..."
if git push personal "$BRANCH"; then
    echo "✅ Pushed to personal GitHub"
    echo ""
    echo "🚀 Render will auto-deploy from personal GitHub!"
else
    echo "❌ Failed to push to personal GitHub"
    echo ""
    echo "Check:"
    echo "  1. Personal repo exists and is public"
    echo "  2. You have write access"
    echo "  3. Remote URL is correct: git remote -v"
    exit 1
fi

echo ""
echo "✅ Successfully synced to both repositories!"
echo "   - Company repo (private): ✅"
echo "   - Personal GitHub (public): ✅"
echo "   - Render will auto-deploy: ✅"

