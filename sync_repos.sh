#!/bin/bash
# Sync repository to both CodeCommit and GitHub
# Usage: ./sync_repos.sh [branch]
# Example: ./sync_repos.sh dev

set -e

BRANCH=${1:-dev}

echo "🔄 Syncing repository to both CodeCommit and GitHub..."
echo ""

# Check if GitHub remote exists
if ! git remote | grep -q "^github$"; then
    echo "⚠️  GitHub remote not found!"
    echo ""
    echo "To add GitHub remote, run:"
    echo "  git remote add github https://github.com/YOUR_USERNAME/almuni-portal.git"
    echo ""
    read -p "Do you want to add it now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your GitHub username: " GITHUB_USER
        git remote add github "https://github.com/${GITHUB_USER}/almuni-portal.git"
        echo "✅ GitHub remote added"
    else
        echo "❌ Cannot sync without GitHub remote"
        exit 1
    fi
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo "⚠️  Currently on branch: $CURRENT_BRANCH"
    echo "   Syncing branch: $BRANCH"
    echo ""
fi

# Push to CodeCommit
echo "📤 Pushing to CodeCommit (origin)..."
if git push origin "$BRANCH"; then
    echo "   ✅ CodeCommit updated"
else
    echo "   ❌ Failed to push to CodeCommit"
    exit 1
fi

echo ""

# Push to GitHub
echo "📤 Pushing to GitHub..."
if git push github "$BRANCH"; then
    echo "   ✅ GitHub updated"
    echo ""
    echo "🚀 Render will auto-deploy from GitHub!"
else
    echo "   ❌ Failed to push to GitHub"
    echo "   ⚠️  CodeCommit was updated, but GitHub sync failed"
    exit 1
fi

echo ""
echo "✅ Successfully synced to both repositories!"
echo ""
echo "📊 Remotes:"
git remote -v

