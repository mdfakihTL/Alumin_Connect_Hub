# Database Schema Documentation

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                    │
├─────────────────────────────────────────────────────────────────┤
│ PK  id                    INTEGER                                │
│     email                 VARCHAR(255) UNIQUE                   │
│     username              VARCHAR(100) UNIQUE                     │
│     hashed_password       VARCHAR(255)                           │
│     full_name             VARCHAR(255)                           │
│     is_active             BOOLEAN                                │
│     is_verified           BOOLEAN                               │
│     role                  ENUM(admin,alumni,moderator,guest)    │
│     last_login            VARCHAR(255)                           │
│     refresh_token         VARCHAR(512)                            │
│     created_at            TIMESTAMP                              │
│     updated_at            TIMESTAMP                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:1
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ALUMNI_PROFILES                               │
├─────────────────────────────────────────────────────────────────┤
│ PK  id                    INTEGER                                │
│ FK  user_id               INTEGER → users.id                     │
│     graduation_year       INTEGER                                │
│     degree                VARCHAR(255)                            │
│     major                 VARCHAR(255)                            │
│     current_position      VARCHAR(255)                           │
│     company               VARCHAR(255)                            │
│     location              VARCHAR(255)                           │
│     bio                   TEXT                                   │
│     linkedin_url          VARCHAR(512)                            │
│     github_url            VARCHAR(512)                           │
│     website_url           VARCHAR(512)                           │
│     profile_picture_url   VARCHAR(512)                           │
│     skills                TEXT (JSON)                            │
│     interests             TEXT (JSON)                            │
│     created_at            TIMESTAMP                              │
│     updated_at            TIMESTAMP                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         EVENTS                                   │
├─────────────────────────────────────────────────────────────────┤
│ PK  id                    INTEGER                                │
│ FK  creator_id            INTEGER → users.id                     │
│     title                 VARCHAR(255)                           │
│     description           TEXT                                   │
│     event_type            ENUM(networking,workshop,...)          │
│     status                ENUM(draft,published,cancelled,...)    │
│     start_date            TIMESTAMP                              │
│     end_date              TIMESTAMP                              │
│     location              VARCHAR(255)                           │
│     venue                 VARCHAR(255)                           │
│     max_attendees         INTEGER                                │
│     registration_deadline  TIMESTAMP                              │
│     image_url             VARCHAR(512)                           │
│     registration_url       VARCHAR(512)                           │
│     is_online             BOOLEAN                                │
│     online_link           VARCHAR(512)                           │
│     created_at            TIMESTAMP                              │
│     updated_at            TIMESTAMP                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EVENT_REGISTRATIONS                            │
├─────────────────────────────────────────────────────────────────┤
│ PK  id                    INTEGER                                │
│ FK  event_id              INTEGER → events.id                    │
│ FK  user_id               INTEGER → users.id                      │
│     registration_date      TIMESTAMP                              │
│     status                VARCHAR(50)                            │
│     notes                 TEXT                                   │
│     created_at            TIMESTAMP                              │
│     updated_at            TIMESTAMP                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      JOB_POSTINGS                                │
├─────────────────────────────────────────────────────────────────┤
│ PK  id                    INTEGER                                │
│ FK  poster_id             INTEGER → users.id                      │
│     title                 VARCHAR(255)                           │
│     company               VARCHAR(255)                           │
│     description           TEXT                                   │
│     requirements          TEXT                                   │
│     location              VARCHAR(255)                           │
│     job_type              ENUM(full_time,part_time,...)          │
│     status                ENUM(draft,active,closed,expired)      │
│     salary_min            NUMERIC(10,2)                          │
│     salary_max            NUMERIC(10,2)                          │
│     currency              VARCHAR(10)                             │
│     application_deadline   TIMESTAMP                              │
│     application_url       VARCHAR(512)                           │
│     contact_email         VARCHAR(255)                           │
│     is_featured           BOOLEAN                                │
│     created_at            TIMESTAMP                              │
│     updated_at            TIMESTAMP                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     JOB_APPLICATIONS                             │
├─────────────────────────────────────────────────────────────────┤
│ PK  id                    INTEGER                                │
│ FK  job_posting_id        INTEGER → job_postings.id              │
│ FK  applicant_id          INTEGER → users.id                      │
│     cover_letter          TEXT                                   │
│     resume_url            VARCHAR(512)                           │
│     status                ENUM(pending,reviewing,shortlisted,...)│
│     applied_date          TIMESTAMP                              │
│     notes                 TEXT                                   │
│     created_at            TIMESTAMP                              │
│     updated_at            TIMESTAMP                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       DOCUMENTS                                  │
├─────────────────────────────────────────────────────────────────┤
│ PK  id                    INTEGER                                │
│ FK  uploader_id           INTEGER → users.id                      │
│     title                 VARCHAR(255)                           │
│     description           TEXT                                   │
│     file_path             VARCHAR(512)                           │
│     file_name             VARCHAR(255)                           │
│     file_size             INTEGER                                │
│     file_type             ENUM(pdf,doc,docx,txt,md,other)        │
│     mime_type             VARCHAR(100)                           │
│     status                ENUM(uploaded,processing,processed,...) │
│     is_public             BOOLEAN                               │
│     chroma_id             VARCHAR(255)                           │
│     metadata              TEXT (JSON)                            │
│     created_at            TIMESTAMP                              │
│     updated_at            TIMESTAMP                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DOCUMENT_EMBEDDINGS                             │
├─────────────────────────────────────────────────────────────────┤
│ PK  id                    INTEGER                                │
│ FK  document_id           INTEGER → documents.id                 │
│     chunk_index           INTEGER                                │
│     chunk_text            TEXT                                   │
│     chunk_start           INTEGER                                │
│     chunk_end             INTEGER                                │
│     embedding_vector_id   VARCHAR(255)                           │
│     metadata              TEXT (JSON)                           │
│     created_at            TIMESTAMP                              │
│     updated_at            TIMESTAMP                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     CHAT_SESSIONS                                │
├─────────────────────────────────────────────────────────────────┤
│ PK  id                    INTEGER                                │
│ FK  user_id               INTEGER → users.id                      │
│     title                 VARCHAR(255)                           │
│     is_active             BOOLEAN                               │
│     last_message_at        TIMESTAMP                             │
│     created_at            TIMESTAMP                              │
│     updated_at            TIMESTAMP                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CHAT_MESSAGES                               │
├─────────────────────────────────────────────────────────────────┤
│ PK  id                    INTEGER                                │
│ FK  session_id            INTEGER → chat_sessions.id              │
│     role                  VARCHAR(20)                            │
│     content               TEXT                                   │
│     metadata              TEXT (JSON)                            │
│     tokens_used           INTEGER                                │
│     created_at            TIMESTAMP                              │
│     updated_at            TIMESTAMP                              │
└─────────────────────────────────────────────────────────────────┘
```

## Table Descriptions

### users
Core user authentication and authorization table. Stores user credentials, roles, and authentication tokens.

**Indexes:**
- `email` (unique)
- `username` (unique)

### alumni_profiles
Extended profile information for alumni users. Linked 1:1 with users table.

**Indexes:**
- `user_id` (unique, foreign key)

### events
Alumni events and networking opportunities. Created by users (alumni or admins).

**Indexes:**
- `creator_id` (foreign key)
- `start_date`
- `status`

### event_registrations
Tracks user registrations for events. Many-to-many relationship between users and events.

**Indexes:**
- `event_id` (foreign key)
- `user_id` (foreign key)

### job_postings
Job opportunities posted by alumni or admins.

**Indexes:**
- `poster_id` (foreign key)
- `status`
- `company`

### job_applications
Tracks job applications submitted by users.

**Indexes:**
- `job_posting_id` (foreign key)
- `applicant_id` (foreign key)
- `status`

### documents
Uploaded documents for vector search and AI features.

**Indexes:**
- `uploader_id` (foreign key)
- `chroma_id` (for vector DB reference)
- `status`

### document_embeddings
Metadata for document chunks stored in vector database.

**Indexes:**
- `document_id` (foreign key)
- `chunk_index`

### chat_sessions
AI chat sessions for Q&A functionality.

**Indexes:**
- `user_id` (foreign key)
- `last_message_at`

### chat_messages
Individual messages in chat sessions.

**Indexes:**
- `session_id` (foreign key)
- `created_at`

## Relationships Summary

1. **Users → Alumni Profiles**: 1:1 (optional)
2. **Users → Events**: 1:N (creator)
3. **Users → Job Postings**: 1:N (poster)
4. **Users → Documents**: 1:N (uploader)
5. **Users → Chat Sessions**: 1:N
6. **Events → Event Registrations**: 1:N
7. **Users → Event Registrations**: 1:N
8. **Job Postings → Job Applications**: 1:N
9. **Users → Job Applications**: 1:N
10. **Documents → Document Embeddings**: 1:N
11. **Chat Sessions → Chat Messages**: 1:N

## Constraints

- **Cascade Deletes**: 
  - Deleting a user cascades to alumni_profile, event_registrations, job_applications, chat_sessions
  - Deleting an event cascades to event_registrations
  - Deleting a job_posting cascades to job_applications
  - Deleting a document cascades to document_embeddings
  - Deleting a chat_session cascades to chat_messages

- **Set Null on Delete**:
  - Deleting a user sets creator_id to NULL in events
  - Deleting a user sets poster_id to NULL in job_postings
  - Deleting a user sets uploader_id to NULL in documents

## Migration Notes

When creating migrations:
1. Create tables in dependency order
2. Add foreign key constraints after table creation
3. Create indexes for frequently queried fields
4. Add check constraints for enum-like fields


