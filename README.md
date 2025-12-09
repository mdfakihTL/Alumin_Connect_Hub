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
- `admin`: Full system access
- `alumni`: Standard alumni user
- `moderator`: Content moderation access
- `guest`: Limited read-only access

## Tech Stack

- **Framework**: FastAPI 0.104+
- **Database**: PostgreSQL 15+
- **Vector DB**: Chroma (local) / Pinecone (cloud option)
- **Cache**: Redis 7+
- **Task Queue**: Celery with Redis broker
- **ORM**: SQLAlchemy 2.0+
- **Migrations**: Alembic
- **Authentication**: JWT (python-jose)
- **Validation**: Pydantic v2
- **AI**: OpenAI API / Google Gemini

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

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

1. **Clone and setup:**
```bash
cd almuni-portal
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Environment setup:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database setup:**
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run migrations
alembic upgrade head

# Seed initial data
python -m app.db.init_db
```

4. **Start the server:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

5. **Start Celery worker (optional):**
```bash
celery -A app.workers.celery_app worker --loglevel=info
```

## API Documentation

Once the server is running:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Testing

```bash
# Run all tests
pytest

# With coverage
pytest --cov=app --cov-report=html
```

## Deployment

See `DEPLOYMENT.md` for detailed deployment instructions.

## License

MIT


