# Alumni Portal Backend

A production-ready FastAPI backend for an Alumni Portal with AI-powered features including vector search, document Q&A, and intelligent networking.

## Architecture Overview

### System Architecture

```
┌─────────────┐
│   Frontend  │
│  (React/Vue)│
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────────────────────┐
│         API Gateway                 │
│      (FastAPI Router)               │
└──────┬──────────────────┬───────────┘
       │                  │
       ▼                  ▼
┌─────────────┐   ┌──────────────┐
│   Auth      │   │   Business   │
│   Service   │   │   Services   │
└─────────────┘   └──────┬───────┘
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│ PostgreSQL  │  │   Vector DB  │  │    Redis    │
│  (Primary)  │  │   (Chroma)   │  │   (Cache)   │
└─────────────┘  └──────────────┘  └─────────────┘
       │
       ▼
┌─────────────┐
│   Celery    │
│  (Workers)  │
└─────────────┘

```

### Request-Response Flow

1. **Client Request** → API Gateway (FastAPI)
2. **Authentication** → JWT validation middleware
3. **Authorization** → Role-based access control
4. **Business Logic** → Service layer
5. **Data Access** → Repository layer
6. **Database** → PostgreSQL / Vector DB
7. **Response** → JSON with proper status codes

### Authentication & Authorization Flow

```
User Login → Credentials Validation → JWT Token Generation
    ↓
Token stored in HTTP-only cookie / Authorization header
    ↓
Protected Routes → JWT Validation → Role Check → Access Granted/Denied

```

**Roles:**

* `super_admin`: Full system access (platform administrators)
* `university_admin`: University-level administration
* `alumni`: Standard alumni user
* `guest`: Limited read-only access (unauthenticated)

## Tech Stack

* **Framework**: FastAPI 0.104+
* **Database**: PostgreSQL 15+
* **Vector DB**: Chroma (local) / Pinecone (cloud option)
* **Cache**: Redis 7+
* **Task Queue**: Celery with Redis broker
* **ORM**: SQLAlchemy 2.0+
* **Migrations**: Alembic
* **Authentication**: JWT (python-jose)
* **Validation**: Pydantic v2
* **AI**: OpenAI API / Google Gemini

## Project Structure

```
/app
├── api/                    # API routes and endpoints
│   ├── v1/
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── alumni.py
│   │   ├── events.py
│   │   ├── jobs.py
│   │   ├── documents.py
│   │   ├── chat.py
│   │   └── search.py
│   └── dependencies.py
├── core/                   # Core configuration
│   ├── config.py
│   ├── security.py
│   └── logging.py
├── db/                     # Database setup
│   ├── base.py
│   ├── session.py
│   └── init_db.py
├── models/                 # SQLAlchemy models
│   ├── user.py
│   ├── alumni.py
│   ├── event.py
│   ├── job.py
│   ├── document.py
│   └── chat.py
├── schemas/                # Pydantic schemas
│   ├── user.py
│   ├── alumni.py
│   ├── event.py
│   ├── job.py
│   ├── document.py
│   └── chat.py
├── services/               # Business logic
│   ├── auth_service.py
│   ├── user_service.py
│   ├── alumni_service.py
│   ├── event_service.py
│   ├── job_service.py
│   ├── document_service.py
│   ├── chat_service.py
│   └── vector_service.py
├── repositories/           # Data access layer
│   ├── user_repository.py
│   ├── alumni_repository.py
│   ├── event_repository.py
│   ├── job_repository.py
│   └── document_repository.py
├── utils/                  # Utilities
│   ├── embeddings.py
│   ├── file_upload.py
│   └── email.py
├── workers/                # Celery tasks
│   ├── celery_app.py
│   └── tasks.py
├── tests/                  # Test suite
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── alembic/                # Database migrations
│   └── versions/
├── main.py                 # FastAPI application entry
├── requirements.txt
├── .env.example
├── Dockerfile
└── docker-compose.yml

```

## Quick Start

### Prerequisites

* Python 3.11+
* PostgreSQL 15+ (or use free cloud hosting - see below)
* Redis 7+
* Docker & Docker Compose (optional)

> 💡 **Free Database Hosting**: Use Neon.tech for 10GB free PostgreSQL hosting. See `CLOUD_DATABASE_SETUP.md` for setup instructions.

### Installation

1. **Clone and setup:**

cd almuni-portal
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

1. **Environment setup:**

cp .env.example .env
# Edit .env with your configuration

1. **Database setup:**

**Option A: Free Cloud Database (Recommended)**

# 1. Sign up at neon.tech (free 10GB PostgreSQL)
# 2. Create project and get connection string
# 3. Update .env with your cloud database URL:
#    DATABASE_URL=postgresql+asyncpg://user:pass@host/db?sslmode=require
#    DATABASE_URL_SYNC=postgresql://user:pass@host/db?sslmode=require
# 4. Run migrations
alembic upgrade head
# 5. Seed initial data
python -m app.db.init_db

**Option B: Local PostgreSQL**

# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run migrations
alembic upgrade head

# Seed initial data
python -m app.db.init_db

See `CLOUD_DATABASE_SETUP.md` for detailed cloud database setup.

1. **Start the server:**

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

1. **Start Celery worker (optional):**

celery -A app.workers.celery_app worker --loglevel=info

## API Documentation

Once the server is running:

* **Swagger UI**: <http://localhost:8000/docs>
* **ReDoc**: <http://localhost:8000/redoc>

## Testing

# Run all tests
pytest

# With coverage
pytest --cov=app --cov-report=html

## Deployment

See `DEPLOYMENT.md` for detailed deployment instructions.

## License

MIT
