# Neon MCP Server Setup Guide

You've set up a Neon MCP (Model Context Protocol) server! This allows AI assistants to interact with your Neon database, but your application still needs a direct connection string.

## Understanding MCP vs Direct Connection

### MCP Server (mcp.json)
- **Purpose**: Allows AI assistants (like Cursor AI) to interact with Neon
- **Location**: `mcp.json` file
- **Use**: For AI-powered database operations, queries, and management
- **Does NOT replace**: Direct database connection for your FastAPI app

### Direct Connection (.env)
- **Purpose**: Your FastAPI application connects directly to Neon
- **Location**: `.env` file (`DATABASE_URL` and `DATABASE_URL_SYNC`)
- **Use**: For your application to read/write data
- **Required**: Yes, your app needs this to work

## Current Status

Your `.env` file currently has:
```bash
DATABASE_URL=npx neonctl@latest init
DATABASE_URL_SYNC=npx neonctl@latest init
```

These are placeholders and need to be replaced with your actual Neon connection string.

## Getting Your Connection String

### Option 1: From Neon Dashboard (Easiest)

1. Go to https://neon.tech
2. Sign in to your account
3. Select your project
4. Click "Connection Details" or "Connection string"
5. Copy the connection string (looks like):
   ```
   postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### Option 2: Using neonctl CLI

If you have `neonctl` installed:

```bash
# Install neonctl (if not installed)
npm install -g neonctl

# Login
neonctl auth

# List projects
neonctl projects list

# Get connection string for a project
neonctl connection-string --project-id <your-project-id>
```

### Option 3: Using the Helper Script

```bash
./get_neon_connection.sh
```

This script will try to get your connection string automatically.

## Updating .env File

Once you have your connection string:

### Method 1: Use the Update Script

```bash
./update_env.sh "postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

### Method 2: Manual Update

1. Open `.env` file:
   ```bash
   nano .env
   ```

2. Replace the database URLs:
   ```bash
   # For async connections (FastAPI)
   DATABASE_URL=postgresql+asyncpg://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   
   # For sync connections (Alembic migrations)
   DATABASE_URL_SYNC=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

**Important Notes:**
- For `DATABASE_URL`: Add `+asyncpg` after `postgresql` → `postgresql+asyncpg://`
- For `DATABASE_URL_SYNC`: Keep as `postgresql://` (no +asyncpg)
- Both should include `?sslmode=require` at the end

## Testing the Connection

After updating `.env`:

```bash
# Test connection
python3 test_db_connection.py

# If successful, run migrations
alembic upgrade head

# Initialize database
python -m app.db.init_db
```

## MCP Server Benefits

With the MCP server configured, you can:
- Ask AI assistants to query your database
- Get help with database operations
- Automate database tasks through AI
- Get insights about your database structure

But remember: Your FastAPI app still needs the direct connection string in `.env` to function!

## Troubleshooting

### Connection String Format

✅ **Correct:**
```
postgresql://user:pass@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

❌ **Incorrect:**
```
npx neonctl@latest init
postgresql://user:pass@host/db  (missing sslmode)
```

### SSL Errors

Make sure your connection string includes `?sslmode=require`:
```
postgresql://...?sslmode=require
```

### Connection Refused

- Verify your Neon project is active
- Check if your IP is allowed (Neon allows all by default)
- Ensure the connection string is correct

## Next Steps

1. ✅ Get your Neon connection string (from dashboard or CLI)
2. ✅ Update `.env` file with the connection string
3. ✅ Test connection: `python3 test_db_connection.py`
4. ✅ Run migrations: `alembic upgrade head`
5. ✅ Initialize database: `python -m app.db.init_db`
6. ✅ Start server: `uvicorn app.main:app --reload`

## Resources

- **Neon Dashboard**: https://neon.tech
- **Neon Docs**: https://neon.tech/docs
- **MCP Protocol**: https://modelcontextprotocol.io
- **Neon CLI**: https://neon.tech/docs/reference/neonctl

