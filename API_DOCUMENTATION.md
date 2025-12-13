# API Documentation

Complete API reference for the Alumni Portal Backend.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "full_name": "Full Name"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "full_name": "Full Name",
    "is_active": true,
    "is_verified": false,
    "role": "alumni",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  },
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "username",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <token>
```

### Documents

#### Upload Document
```http
POST /documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <file>
title: "Document Title"
description: "Document description"
is_public: false
```

**Response:**
```json
{
  "document": {
    "id": 1,
    "title": "Document Title",
    "file_name": "document.pdf",
    "file_size": 1024,
    "file_type": "pdf",
    "status": "uploaded",
    "created_at": "2024-01-01T00:00:00"
  },
  "message": "Document uploaded successfully"
}
```

#### Search Documents (Vector Search)
```http
POST /documents/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "What is machine learning?",
  "limit": 10,
  "filter_metadata": {
    "document_id": "1"
  }
}
```

**Response:**
```json
[
  {
    "document_id": 1,
    "document_title": "ML Guide",
    "chunk_text": "Machine learning is...",
    "chunk_index": 0,
    "similarity_score": 0.95,
    "metadata": {
      "document_id": "1",
      "chunk_index": 0
    }
  }
]
```

#### List Documents
```http
GET /documents?skip=0&limit=100
Authorization: Bearer <token>
```

#### Get Document
```http
GET /documents/{document_id}
Authorization: Bearer <token>
```

#### Update Document
```http
PUT /documents/{document_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  "is_public": true
}
```

#### Delete Document
```http
DELETE /documents/{document_id}
Authorization: Bearer <token>
```

### Chat (AI Q&A)

#### Send Message
```http
POST /chat/message
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "What is the alumni network?",
  "session_id": 1  // Optional, creates new session if not provided
}
```

**Response:**
```json
{
  "message": {
    "id": 1,
    "session_id": 1,
    "role": "assistant",
    "content": "The alumni network is...",
    "created_at": "2024-01-01T00:00:00"
  },
  "session": {
    "id": 1,
    "user_id": 1,
    "title": "Chat 2024-01-01 12:00",
    "is_active": true
  },
  "sources": [
    {
      "document_id": "1",
      "chunk_index": 0,
      "title": "Alumni Guide"
    }
  ]
}
```

#### List Chat Sessions
```http
GET /chat/sessions?skip=0&limit=50
Authorization: Bearer <token>
```

#### Get Chat Session
```http
GET /chat/sessions/{session_id}
Authorization: Bearer <token>
```

### Events

#### Create Event
```http
POST /events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Alumni Networking Event",
  "description": "Annual networking event",
  "event_type": "networking",
  "start_date": "2024-06-01T18:00:00",
  "end_date": "2024-06-01T22:00:00",
  "location": "Main Campus",
  "max_attendees": 100
}
```

#### List Events
```http
GET /events?skip=0&limit=100
```

#### Get Event
```http
GET /events/{event_id}
```

#### Register for Event
```http
POST /events/{event_id}/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Looking forward to attending"
}
```

### Jobs

#### Create Job Posting
```http
POST /jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Software Engineer",
  "company": "Tech Corp",
  "description": "We are looking for...",
  "job_type": "full_time",
  "location": "Remote",
  "salary_min": 80000,
  "salary_max": 120000
}
```

#### List Jobs
```http
GET /jobs?skip=0&limit=100
```

#### Get Job
```http
GET /jobs/{job_id}
```

#### Apply for Job
```http
POST /jobs/{job_id}/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "cover_letter": "I am interested in...",
  "resume_url": "https://..."
}
```

### Alumni Profiles

#### Create Alumni Profile
```http
POST /alumni
Authorization: Bearer <token>
Content-Type: application/json

{
  "graduation_year": 2020,
  "degree": "Bachelor of Science",
  "major": "Computer Science",
  "current_position": "Software Engineer",
  "company": "Tech Corp",
  "location": "San Francisco, CA",
  "bio": "I am a software engineer...",
  "skills": ["Python", "JavaScript", "React"],
  "interests": ["AI", "Web Development"]
}
```

#### List Alumni Profiles
```http
GET /alumni?skip=0&limit=100
```

#### Get My Profile
```http
GET /alumni/me
Authorization: Bearer <token>
```

#### Update My Profile
```http
PUT /alumni/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_position": "Senior Software Engineer",
  "company": "New Company"
}
```

#### Get Alumni Profile
```http
GET /alumni/{profile_id}
```

### Users

#### Get Current User
```http
GET /users/me
Authorization: Bearer <token>
```

#### Update Current User
```http
PUT /users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "Updated Name",
  "email": "newemail@example.com"
}
```

#### List Users (Admin Only)
```http
GET /users?skip=0&limit=100
Authorization: Bearer <admin_token>
```

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Example cURL Commands

### Register
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "user",
    "password": "password123",
    "full_name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user",
    "password": "password123"
  }'
```

### Upload Document
```bash
curl -X POST http://localhost:8000/api/v1/documents/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  -F "title=My Document" \
  -F "description=Document description" \
  -F "is_public=false"
```

### Search Documents
```bash
curl -X POST http://localhost:8000/api/v1/documents/search \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is machine learning?",
    "limit": 10
  }'
```

### Send Chat Message
```bash
curl -X POST http://localhost:8000/api/v1/chat/message \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What is the alumni network?",
    "session_id": 1
  }'
```


