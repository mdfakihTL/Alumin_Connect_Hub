# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                   (React/Vue/Angular)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS/REST API
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                         │
│                      FastAPI Router                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │  Users   │  │Documents │  │   Chat   │   │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Service    │  │  Repository  │  │   Utility    │
│   Layer      │  │    Layer     │  │    Layer     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────┬───────┴─────────┬───────┘
                 ▼                 ▼
    ┌─────────────────────────────────────┐
    │         Data Layer                  │
    │  ┌──────────┐  ┌──────────────┐    │
    │  │PostgreSQL│  │  ChromaDB    │    │
    │  │          │  │  (Vector DB)  │    │
    │  └──────────┘  └──────────────┘    │
    └─────────────────────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────────┐
    │      Background Tasks               │
    │         (Celery)                    │
    │  ┌──────────┐  ┌──────────────┐    │
    │  │  Redis   │  │   Workers    │    │
    │  │ (Broker) │  │              │    │
    │  └──────────┘  └──────────────┘    │
    └─────────────────────────────────────┘
```

## Request-Response Flow

### 1. Authentication Flow
```
Client → POST /api/v1/auth/login
  ↓
AuthService.login()
  ↓
UserRepository.get_by_username()
  ↓
verify_password()
  ↓
create_access_token()
  ↓
Response: {access_token, refresh_token}
```

### 2. Document Upload & Processing Flow
```
Client → POST /api/v1/documents/upload
  ↓
DocumentService.upload_document()
  ↓
save_upload_file() → File System
  ↓
DocumentRepository.create() → PostgreSQL
  ↓
_process_document() (async)
  ├─ extract_text_from_file()
  ├─ chunk_text()
  ├─ generate_embeddings_batch()
  ├─ vector_db_service.add_document() → ChromaDB
  └─ DocumentRepository.create_embedding() → PostgreSQL
  ↓
Response: Document object
```

### 3. Vector Search Flow
```
Client → POST /api/v1/documents/search
  ↓
DocumentService.search_documents()
  ↓
embedding_service.generate_embedding(query)
  ↓
vector_db_service.search() → ChromaDB
  ↓
DocumentRepository.get_by_id() → PostgreSQL
  ↓
Response: Search results with similarity scores
```

### 4. RAG Chat Flow
```
Client → POST /api/v1/chat/message
  ↓
ChatService.send_message()
  ↓
embedding_service.generate_embedding(user_message)
  ↓
vector_db_service.search() → ChromaDB (retrieve context)
  ↓
_generate_response() → OpenAI API
  ├─ Build context from search results
  ├─ Call OpenAI Chat API
  └─ Return AI response
  ↓
ChatMessageRepository.create() → PostgreSQL
  ↓
Response: {message, session, sources}
```

## Authentication & Authorization

### JWT Token Structure
```json
{
  "sub": "user_id",
  "username": "username",
  "role": "alumni|admin|moderator|guest",
  "exp": 1234567890,
  "type": "access|refresh"
}
```

### Role-Based Access Control

| Role      | Permissions                                    |
|-----------|------------------------------------------------|
| admin     | Full system access                             |
| alumni    | Standard user access, own content management   |
| moderator | Content moderation, user management           |
| guest     | Read-only access to public content             |

### Authorization Flow
```
Request → get_current_user() dependency
  ↓
Decode JWT token
  ↓
Validate token signature & expiration
  ↓
Load user from database
  ↓
Check user.is_active
  ↓
Role-based endpoint access (require_role)
  ↓
Execute endpoint handler
```

## Database Design

### Entity Relationship Diagram

```
Users (1) ──── (1) AlumniProfiles
  │
  │ (1:N)
  ├── Events (creator)
  ├── JobPostings (poster)
  ├── Documents (uploader)
  └── ChatSessions

Events (1) ──── (N) EventRegistrations (N) ──── (1) Users

JobPostings (1) ──── (N) JobApplications (N) ──── (1) Users

Documents (1) ──── (N) DocumentEmbeddings

ChatSessions (1) ──── (N) ChatMessages
```

### Key Tables

1. **users**: Core user authentication
2. **alumni_profiles**: Extended alumni information
3. **events**: Alumni events and networking
4. **event_registrations**: Event attendance tracking
5. **job_postings**: Job opportunities
6. **job_applications**: Job application tracking
7. **documents**: Uploaded documents
8. **document_embeddings**: Chunk metadata for vector search
9. **chat_sessions**: AI chat sessions
10. **chat_messages**: Chat message history

## Vector Database Integration

### ChromaDB Schema

**Collection**: `alumni_documents`

**Document Structure**:
```json
{
  "id": "document_id_chunk_index",
  "embedding": [0.123, -0.456, ...],
  "document": "chunk text content",
  "metadata": {
    "document_id": "1",
    "chunk_index": 0,
    "title": "Document Title",
    "file_type": "pdf"
  }
}
```

### Embedding Pipeline

1. **Document Upload** → File saved to disk
2. **Text Extraction** → Extract text from PDF/DOCX/TXT
3. **Chunking** → Split into 1000-char chunks with 200-char overlap
4. **Embedding Generation** → OpenAI `text-embedding-3-small` (1536 dims)
5. **Vector Storage** → Store in ChromaDB with metadata
6. **Metadata Storage** → Store chunk info in PostgreSQL

### Search Workflow

1. **Query** → User question/query
2. **Query Embedding** → Generate embedding for query
3. **Vector Search** → ChromaDB cosine similarity search
4. **Result Retrieval** → Get top N similar chunks
5. **Context Building** → Combine chunks for RAG
6. **Response Generation** → OpenAI Chat API with context

## Caching Strategy

### Redis Usage

1. **Session Cache**: User sessions, tokens
2. **Query Cache**: Frequently accessed data
3. **Rate Limiting**: API rate limit tracking
4. **Celery Broker**: Task queue

### Cache Keys

- `user:{user_id}`: User data cache
- `document:{document_id}`: Document metadata
- `search:{query_hash}`: Search result cache
- `rate_limit:{user_id}`: Rate limit tracking

## Background Tasks (Celery)

### Task Types

1. **Document Processing**
   - Text extraction
   - Chunking
   - Embedding generation
   - Vector DB storage

2. **Email Notifications**
   - Welcome emails
   - Event reminders
   - Job application confirmations

3. **Data Synchronization**
   - Sync with external systems
   - Periodic data updates

### Task Flow

```
API Request → Service Layer
  ↓
Celery Task Created
  ↓
Redis Broker
  ↓
Celery Worker
  ↓
Task Execution
  ↓
Result Storage (Redis)
```

## Logging & Monitoring

### Logging Levels

- **DEBUG**: Detailed diagnostic information
- **INFO**: General informational messages
- **WARNING**: Warning messages
- **ERROR**: Error messages
- **CRITICAL**: Critical errors

### Log Format

JSON format for structured logging:
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "INFO",
  "logger": "app.services.document_service",
  "message": "Document processed successfully",
  "document_id": 123
}
```

### Monitoring Points

1. **API Endpoints**: Response times, error rates
2. **Database**: Query performance, connection pool
3. **Vector DB**: Search latency, storage usage
4. **Celery**: Task queue length, worker status
5. **External APIs**: OpenAI API usage, rate limits

## Security Architecture

### Security Layers

1. **Network**: HTTPS/TLS encryption
2. **Authentication**: JWT tokens
3. **Authorization**: Role-based access control
4. **Input Validation**: Pydantic schemas
5. **SQL Injection**: SQLAlchemy ORM
6. **XSS**: Input sanitization
7. **CSRF**: Token validation
8. **Rate Limiting**: Redis-based throttling

### Secret Management

- Environment variables for sensitive data
- No secrets in code or version control
- Production secrets in secure vault (AWS Secrets Manager, etc.)

## Scalability Considerations

### Horizontal Scaling

- **API Servers**: Multiple FastAPI instances behind load balancer
- **Database**: Read replicas for read-heavy operations
- **Vector DB**: ChromaDB can be distributed
- **Celery Workers**: Scale workers based on queue length

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Upgrade database instance
- Increase Redis memory

### Performance Optimization

- Database indexing on frequently queried fields
- Connection pooling for database
- Async/await for I/O operations
- Caching frequently accessed data
- Batch processing for embeddings


