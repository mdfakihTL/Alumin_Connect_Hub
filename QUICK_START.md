# Quick Start Guide

Get the Alumni Portal Backend up and running in 5 minutes!

## Prerequisites

- Python 3.11+
- PostgreSQL 15+ (or use free cloud hosting like Neon.tech)
- Redis 7+ (or use Docker)
- Docker & Docker Compose (optional but recommended)

> 💡 **Tip**: For free database hosting, use [Neon.tech](https://neon.tech) (10GB free) or see `CLOUD_DATABASE_SETUP.md` for other options.

## Option 1: Docker Compose (Easiest)

### Step 1: Clone and Setup
```bash
cd almuni-portal
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY (optional but needed for AI features)
```

### Step 2: Start Services
```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- Redis cache
- FastAPI application
- Celery worker
- Flower (Celery monitoring)

### Step 3: Initialize Database

**Option A: Using Cloud Database (Recommended - Free)**
```bash
# 1. Set up free database at neon.tech (see CLOUD_DATABASE_SETUP.md)
# 2. Update .env with your cloud database URL
# 3. Run migrations
docker-compose exec api alembic upgrade head

# 4. Seed initial data
docker-compose exec api python -m app.db.init_db
```

**Option B: Using Local PostgreSQL (from docker-compose)**
```bash
# Run migrations
docker-compose exec api alembic upgrade head

# Seed initial data
docker-compose exec api python -m app.db.init_db
```

### Step 4: Access the API
- **API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Flower (Celery)**: http://localhost:5555

### Default Credentials
After running `init_db`:
- **Super Admin**: `superadmin@alumni-portal.com` / `superadmin123`
- **University Admin**: `university@alumni-portal.com` / `university123`
- **Alumni**: `alumni@example.com` / `alumni123`

## Option 2: Manual Setup

### Step 1: Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Setup Database
```bash
# Create database
createdb alumni_portal

# Or using PostgreSQL client
psql -U postgres
CREATE DATABASE alumni_portal;
```

### Step 4: Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings:
# - DATABASE_URL
# - REDIS_URL
# - OPENAI_API_KEY (optional)
# - SECRET_KEY (generate a strong key)
```

### Step 5: Run Migrations
```bash
alembic upgrade head
```

### Step 6: Initialize Database
```bash
python -m app.db.init_db
```

### Step 7: Start Redis
```bash
redis-server
```

### Step 8: Start the Server
```bash
uvicorn app.main:app --reload
```

### Step 9: (Optional) Start Celery Worker
```bash
celery -A app.workers.celery_app worker --loglevel=info
```

## Test the API

### 1. Register a User
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "testpass123",
    "full_name": "Test User"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

Save the `access_token` from the response.

### 3. Get Current User
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Upload a Document
```bash
curl -X POST http://localhost:8000/api/v1/documents/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@document.pdf" \
  -F "title=My Document" \
  -F "description=Test document" \
  -F "is_public=false"
```

### 5. Search Documents (Vector Search)
```bash
curl -X POST http://localhost:8000/api/v1/documents/search \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is machine learning?",
    "limit": 10
  }'
```

### 6. Chat with AI (RAG)
```bash
curl -X POST http://localhost:8000/api/v1/chat/message \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What is the alumni network?"
  }'
```

## Using Swagger UI

1. Open http://localhost:8000/docs
2. Click "Authorize" button
3. Enter: `Bearer YOUR_ACCESS_TOKEN`
4. Try any endpoint!

## Common Issues

### Database Connection Error
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in .env
- Check database exists: `psql -l | grep alumni_portal`

### Redis Connection Error
- Check Redis is running: `redis-cli ping`
- Verify REDIS_URL in .env

### OpenAI API Errors
- Add OPENAI_API_KEY to .env
- AI features (chat, embeddings) won't work without it
- Other features work fine without OpenAI

### Port Already in Use
- Change PORT in .env
- Or stop the service using port 8000

## Next Steps

1. **Read the Documentation**:
   - `README.md` - Overview
   - `API_DOCUMENTATION.md` - Complete API reference
   - `ARCHITECTURE.md` - System architecture
   - `DEPLOYMENT.md` - Production deployment

2. **Customize**:
   - Update models for your needs
   - Add custom business logic
   - Configure email settings
   - Set up monitoring

3. **Deploy**:
   - Follow `DEPLOYMENT.md` for production setup
   - Configure environment variables
   - Set up SSL/TLS
   - Enable monitoring

## Need Help?

- Check the documentation files
- Review code comments
- Check logs: `docker-compose logs api`
- Test endpoints using Swagger UI

Happy coding! 🚀

