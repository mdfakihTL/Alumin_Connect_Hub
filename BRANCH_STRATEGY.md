# Branch Strategy

This document outlines the branch strategy for the Alumni Portal Backend project.

## Branch Structure

### 🌿 master
- **Purpose**: Production-ready, stable code
- **Status**: Currently minimal (README only)
- **Protection**: Should be protected, only merged via pull requests
- **Deployment**: Deploys to production environment

### 🔧 dev
- **Purpose**: Active development branch
- **Status**: Contains all current development work
- **Workflow**: All feature development happens here
- **Deployment**: Deploys to development environment

### 🧪 uat
- **Purpose**: User Acceptance Testing branch
- **Status**: Based on dev, used for pre-production testing
- **Workflow**: Merged from dev when features are ready for UAT
- **Deployment**: Deploys to UAT/staging environment

## Workflow

### Development Workflow

1. **Start Development**
   ```bash
   git checkout dev
   git pull origin dev
   ```

2. **Create Feature Branch** (optional, for larger features)
   ```bash
   git checkout -b feature/your-feature-name
   # Make changes
   git commit -m "Add feature"
   git push origin feature/your-feature-name
   # Create PR to dev
   ```

3. **Direct Development on dev** (for smaller changes)
   ```bash
   git checkout dev
   # Make changes
   git add .
   git commit -m "Description of changes"
   git push origin dev
   ```

### UAT Workflow

1. **Merge dev to uat** (when ready for testing)
   ```bash
   git checkout uat
   git pull origin uat
   git merge dev
   git push origin uat
   ```

2. **UAT Testing** happens on uat branch
3. **Bug Fixes** during UAT can be made directly on uat or merged from dev

### Production Release Workflow

1. **Merge uat to master** (after UAT approval)
   ```bash
   git checkout master
   git pull origin master
   git merge uat
   git push origin master
   ```

2. **Tag Release**
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

## Branch Protection Rules (Recommended)

### master
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- No direct pushes (except for hotfixes)

### dev
- Allow direct pushes for developers
- Require status checks for CI/CD

### uat
- Require pull request reviews
- Allow direct pushes for urgent fixes

## Current Branch Status

- ✅ **master**: Initialized with minimal README
- ✅ **dev**: Contains complete codebase (71 files, 6542+ lines)
- ✅ **uat**: Created from dev, ready for testing

## Quick Commands

```bash
# Switch to dev branch
git checkout dev

# Switch to uat branch
git checkout uat

# Switch to master
git checkout master

# View all branches
git branch -a

# View branch structure
git log --oneline --all --graph --decorate
```

## Best Practices

1. **Always work on dev** for new features
2. **Never commit directly to master** (use PRs)
3. **Keep dev up to date** with regular pulls
4. **Test on uat** before merging to master
5. **Use meaningful commit messages**
6. **Create feature branches** for larger features
7. **Tag releases** on master branch

