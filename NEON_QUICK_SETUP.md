# Neon.tech Quick Setup (5 Minutes)

The fastest way to get a free PostgreSQL database for the Alumni Portal.

## Step 1: Sign Up (1 minute)

1. Go to https://neon.tech
2. Click "Sign Up"
3. Sign up with GitHub, Google, or Email
4. Verify your email if needed

## Step 2: Create Project (1 minute)

1. Click "Create Project"
2. Enter project name: `alumni-portal`
3. Select PostgreSQL version: **15** (recommended)
4. Choose region closest to you
5. Click "Create Project"

## Step 3: Get Connection String (1 minute)

After project creation, you'll see:

1. **Connection Details** section
2. Copy the connection string (looks like):
   ```
   postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

**Important**: Copy the full connection string including `?sslmode=require`

## Step 4: Update .env File (1 minute)

1. Open `.env` file in your project
2. Update these lines:

```bash
# For async connections (FastAPI)
DATABASE_URL=postgresql+asyncpg://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require

# For sync connections (Alembic migrations)
DATABASE_URL_SYNC=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

**Note**: 
- Replace `postgresql://` with `postgresql+asyncpg://` for `DATABASE_URL`
- Keep `postgresql://` for `DATABASE_URL_SYNC` (Alembic needs sync driver)

## Step 5: Test Connection (1 minute)

```bash
# Run migrations
alembic upgrade head

# Initialize database
python -m app.db.init_db
```

If successful, you'll see:
```
Created super admin user: superadmin@alumni-portal.com / superadmin123
Created university admin user: university@alumni-portal.com / university123
Created test alumni user: alumni@example.com / alumni123
Database initialization completed
```

## Step 6: Start Your Server

```bash
uvicorn app.main:app --reload
```

Visit http://localhost:8000/docs - you're ready! 🎉

## Troubleshooting

### Connection Error
- Check connection string format
- Ensure `?sslmode=require` is included
- Verify credentials are correct

### SSL Error
- Make sure `sslmode=require` is in connection string
- Some regions may need different SSL settings

### Migration Error
- Ensure `DATABASE_URL_SYNC` uses `postgresql://` (not `postgresql+asyncpg://`)
- Check database user has CREATE permissions

## Neon Features You Get

- ✅ **10GB free storage** (most generous free tier)
- ✅ **Automatic backups** (point-in-time recovery)
- ✅ **Connection pooling** (built-in)
- ✅ **Database branching** (dev/staging branches)
- ✅ **Auto-scaling** (serverless)
- ✅ **99.9% uptime SLA**

## Next Steps

- Monitor usage in Neon dashboard
- Set up database branching for dev/staging
- Enable automatic backups
- Review connection pooling settings

## Support

- Neon Docs: https://neon.tech/docs
- Neon Discord: https://discord.gg/neondatabase
- Issues: Check `CLOUD_DATABASE_SETUP.md` for detailed troubleshooting

