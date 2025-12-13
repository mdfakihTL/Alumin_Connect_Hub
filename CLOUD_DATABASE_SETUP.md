# Cloud Database Setup Guide

This guide helps you set up a free cloud-hosted PostgreSQL database for the Alumni Portal.

## 🏆 Recommended: Neon.tech (Best Free Option)

**Why Neon?**
- ✅ **10GB free storage** (most generous)
- ✅ Serverless PostgreSQL (auto-scales)
- ✅ Database branching (great for dev/staging)
- ✅ Fast and reliable
- ✅ Easy setup
- ✅ Supports connection pooling

### Setup Steps for Neon

1. **Sign up at [neon.tech](https://neon.tech)**
   - Go to https://neon.tech
   - Sign up with GitHub/Google/Email
   - Free tier is automatically enabled

2. **Create a Project**
   - Click "Create Project"
   - Choose a name (e.g., "alumni-portal")
   - Select PostgreSQL version (15+ recommended)
   - Choose a region close to you

3. **Get Connection String**
   - After project creation, you'll see connection details
   - Copy the connection string (looks like):
     ```
     postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
     ```

4. **Update .env file**
   ```bash
   # For async (FastAPI)
   DATABASE_URL=postgresql+asyncpg://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   
   # For sync (Alembic migrations)
   DATABASE_URL_SYNC=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

5. **Test Connection**
   ```bash
   # Run migrations
   alembic upgrade head
   
   # Initialize database
   python -m app.db.init_db
   ```

## Alternative Options

### 1. Supabase (Great for Full-Stack)

**Free Tier:**
- 500MB database storage
- 2GB bandwidth
- Unlimited API requests
- Built-in authentication (optional)

**Setup:**
1. Go to https://supabase.com
2. Create new project
3. Get connection string from Settings → Database
4. Use connection string in `.env`

**Connection String Format:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 2. Railway (Simple & Fast)

**Free Tier:**
- $5 credit monthly (enough for small projects)
- 500MB storage
- Easy deployment

**Setup:**
1. Go to https://railway.app
2. Create new project
3. Add PostgreSQL service
4. Copy connection string from Variables tab

### 3. Render (Good for Production)

**Free Tier:**
- 1GB storage
- 90 days free (then $7/month)
- Automatic backups

**Setup:**
1. Go to https://render.com
2. Create new PostgreSQL database
3. Copy connection string from dashboard

### 4. Aiven (Developer Friendly)

**Free Tier:**
- 1GB storage
- 1 CPU, 1GB RAM
- Good for prototyping

**Setup:**
1. Go to https://aiven.io
2. Create free account
3. Create PostgreSQL service
4. Get connection string

### 5. ElephantSQL (Simple)

**Free Tier:**
- 20MB storage (very limited)
- 5 concurrent connections
- Good for testing only

**Setup:**
1. Go to https://www.elephantsql.com
2. Create free instance
3. Copy connection string

## Comparison Table

| Service | Free Storage | Best For | Notes |
|---------|-------------|----------|-------|
| **Neon** | 10GB | Production & Dev | ⭐ Best overall |
| **Supabase** | 500MB | Full-stack apps | Includes auth & storage |
| **Railway** | 500MB | Quick setup | $5 credit/month |
| **Render** | 1GB | Production | 90 days free |
| **Aiven** | 1GB | Prototyping | Developer-friendly |
| **ElephantSQL** | 20MB | Testing only | Very limited |

## Configuration

### Update .env File

```bash
# Cloud Database (Neon example)
DATABASE_URL=postgresql+asyncpg://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
DATABASE_URL_SYNC=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require

# If using local Redis (or use cloud Redis too)
REDIS_URL=redis://localhost:6379/0
```

### SSL Connection

Most cloud databases require SSL. Make sure your connection string includes:
- `?sslmode=require` for Neon
- `?sslmode=require` for Supabase
- Check provider docs for SSL requirements

## Docker Compose (Optional PostgreSQL)

If using cloud database, you can remove PostgreSQL from docker-compose:

```yaml
# Comment out or remove postgres service
# postgres:
#   image: postgres:15-alpine
#   ...

# Update api service to not depend on postgres
api:
  # ...
  depends_on:
    # postgres:  # Remove this
    redis:
      condition: service_healthy
```

Or use the provided `docker-compose.cloud.yml` (see below).

## Migration from Local to Cloud

1. **Export local data** (if you have any):
   ```bash
   pg_dump -U postgres alumni_portal > backup.sql
   ```

2. **Set up cloud database** (follow steps above)

3. **Run migrations on cloud**:
   ```bash
   alembic upgrade head
   ```

4. **Import data** (if needed):
   ```bash
   psql -h cloud-host -U user -d dbname < backup.sql
   ```

5. **Update .env** with cloud connection string

6. **Test connection**:
   ```bash
   python -m app.db.init_db
   ```

## Troubleshooting

### Connection Timeout
- Check firewall settings
- Verify connection string format
- Ensure SSL is enabled if required

### SSL Errors
- Add `?sslmode=require` to connection string
- For development, some providers allow `?sslmode=prefer`

### Connection Pooling
- Neon provides built-in connection pooling
- Use connection pooler URL if provided
- Adjust pool size in SQLAlchemy if needed

### Migration Issues
- Ensure `DATABASE_URL_SYNC` uses `postgresql://` (not `postgresql+asyncpg://`)
- Check database user has CREATE/DROP permissions
- Verify database exists before running migrations

## Best Practices

1. **Use Environment Variables**: Never commit connection strings
2. **Use SSL**: Always use SSL for cloud databases
3. **Connection Pooling**: Use provider's connection pooler if available
4. **Backups**: Enable automatic backups (most providers do this)
5. **Monitoring**: Monitor database usage and connections
6. **Secrets Management**: Use secret management in production

## Production Considerations

- **Upgrade Plan**: Free tiers have limits, plan for growth
- **Backups**: Ensure automatic backups are enabled
- **Monitoring**: Set up alerts for database issues
- **Connection Limits**: Monitor concurrent connections
- **Storage**: Monitor storage usage and plan upgrades

## Quick Start (Neon)

```bash
# 1. Sign up at neon.tech
# 2. Create project
# 3. Copy connection string
# 4. Update .env:
DATABASE_URL=postgresql+asyncpg://[your-neon-connection-string]
DATABASE_URL_SYNC=postgresql://[your-neon-connection-string]

# 5. Run migrations
alembic upgrade head

# 6. Initialize database
python -m app.db.init_db

# 7. Start server
uvicorn app.main:app --reload
```

## Support

- **Neon Docs**: https://neon.tech/docs
- **Supabase Docs**: https://supabase.com/docs
- **Railway Docs**: https://docs.railway.app

