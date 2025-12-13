# .env File Setup Guide

## Current Issues Found

Your `.env` file has the following issues that need to be fixed:

1. ❌ **Duplicate entries** - Variables are defined twice
2. ❌ **SECRET_KEY is a placeholder** - Needs to be a real secure key
3. ❌ **DATABASE_URL has incorrect value** - Contains `npx neonctl@latest init` instead of actual connection string
4. ❌ **Placeholder database URLs** - Need real Neon connection strings

## Quick Fix

### Option 1: Use the Fix Script (Recommended)

```bash
cd /home/bhanushri123/almuni-portal
./fix_env.sh
```

This will:
- Generate a secure SECRET_KEY
- Remove duplicates
- Create a clean .env file structure
- You'll still need to add your Neon connection string

### Option 2: Manual Fix

1. **Generate SECRET_KEY:**
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Get Neon Connection String:**
   - Go to https://neon.tech
   - Open your project
   - Go to "Connection Details"
   - Copy the connection string

3. **Update .env file:**
   ```bash
   nano .env  # or use your preferred editor
   ```

   Replace:
   ```bash
   SECRET_KEY=your-generated-secret-key-here
   DATABASE_URL=postgresql+asyncpg://YOUR_ACTUAL_NEON_CONNECTION_STRING?sslmode=require
   DATABASE_URL_SYNC=postgresql://YOUR_ACTUAL_NEON_CONNECTION_STRING?sslmode=require
   ```

## Required Variables

Your `.env` file must have these variables:

```bash
# Security (REQUIRED)
SECRET_KEY=<32+ character secure key>

# Database (REQUIRED - from Neon)
DATABASE_URL=postgresql+asyncpg://user:pass@host/db?sslmode=require
DATABASE_URL_SYNC=postgresql://user:pass@host/db?sslmode=require

# Redis (REQUIRED)
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
```

## Getting Your Neon Connection String

1. **Sign in to Neon**: https://neon.tech
2. **Select your project**
3. **Click "Connection Details"** (or "Connection string")
4. **Copy the connection string** - it looks like:
   ```
   postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
5. **For DATABASE_URL**: Add `+asyncpg` after `postgresql`:
   ```
   postgresql+asyncpg://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
6. **For DATABASE_URL_SYNC**: Use as-is:
   ```
   postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

## Verify Your .env File

After fixing, verify it works:

```bash
# Check for duplicates
cat .env | grep -E "^[A-Z_]+=" | sort | uniq -d

# Should return nothing (no duplicates)

# Test loading (if python-dotenv is installed)
python3 -c "from dotenv import load_dotenv; import os; load_dotenv(); print('DATABASE_URL:', 'SET' if os.getenv('DATABASE_URL') else 'NOT SET')"
```

## Example Correct .env

```bash
SECRET_KEY=abc123xyz789...your-actual-32-char-key
DATABASE_URL=postgresql+asyncpg://neondb_owner:password123@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_SYNC=postgresql://neondb_owner:password123@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
```

## Next Steps

After fixing `.env`:

1. **Test database connection:**
   ```bash
   alembic upgrade head
   ```

2. **Initialize database:**
   ```bash
   python -m app.db.init_db
   ```

3. **Start server:**
   ```bash
   uvicorn app.main:app --reload
   ```

## Need Help?

- See `NEON_QUICK_SETUP.md` for Neon setup
- See `CLOUD_DATABASE_SETUP.md` for detailed database setup
- Check Neon dashboard for connection string

