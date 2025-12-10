-- =====================================================
-- Alumni Portal Database Schema
-- PostgreSQL 15+
-- =====================================================

-- =====================================================
-- 1. CREATE ENUM TYPES
-- =====================================================

-- User Role Enum
DO $$ BEGIN
    CREATE TYPE userrole AS ENUM ('admin', 'alumni', 'moderator', 'guest');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Event Type Enum
DO $$ BEGIN
    CREATE TYPE eventtype AS ENUM ('networking', 'workshop', 'conference', 'social', 'webinar', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Event Status Enum
DO $$ BEGIN
    CREATE TYPE eventstatus AS ENUM ('draft', 'published', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Job Type Enum
DO $$ BEGIN
    CREATE TYPE jobtype AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'freelance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Job Status Enum
DO $$ BEGIN
    CREATE TYPE jobstatus AS ENUM ('draft', 'active', 'closed', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Application Status Enum
DO $$ BEGIN
    CREATE TYPE applicationstatus AS ENUM ('pending', 'reviewing', 'shortlisted', 'rejected', 'accepted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Document Type Enum
DO $$ BEGIN
    CREATE TYPE documenttype AS ENUM ('pdf', 'doc', 'docx', 'txt', 'md', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Document Status Enum
DO $$ BEGIN
    CREATE TYPE documentstatus AS ENUM ('uploaded', 'processing', 'processed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. CREATE TABLES
-- =====================================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    role userrole NOT NULL DEFAULT 'guest',
    last_login VARCHAR(255),
    refresh_token VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Alumni Profiles Table
CREATE TABLE IF NOT EXISTS alumni_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    graduation_year INTEGER,
    degree VARCHAR(255),
    major VARCHAR(255),
    current_position VARCHAR(255),
    company VARCHAR(255),
    location VARCHAR(255),
    bio TEXT,
    linkedin_url VARCHAR(512),
    github_url VARCHAR(512),
    website_url VARCHAR(512),
    profile_picture_url VARCHAR(512),
    skills TEXT,
    interests TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alumni_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type eventtype NOT NULL,
    status eventstatus NOT NULL DEFAULT 'draft',
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    location VARCHAR(255),
    venue VARCHAR(255),
    max_attendees INTEGER,
    registration_deadline TIMESTAMP,
    image_url VARCHAR(512),
    registration_url VARCHAR(512),
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    online_link VARCHAR(512),
    creator_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_creator FOREIGN KEY (creator_id) 
        REFERENCES users(id) ON DELETE SET NULL
);

-- Event Registrations Table
CREATE TABLE IF NOT EXISTS event_registrations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    registration_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'registered',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_registration_event FOREIGN KEY (event_id) 
        REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_registration_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- Job Postings Table
CREATE TABLE IF NOT EXISTS job_postings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    location VARCHAR(255),
    job_type jobtype NOT NULL,
    status jobstatus NOT NULL DEFAULT 'draft',
    salary_min NUMERIC(10, 2),
    salary_max NUMERIC(10, 2),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    application_deadline TIMESTAMP,
    application_url VARCHAR(512),
    contact_email VARCHAR(255),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    poster_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_job_poster FOREIGN KEY (poster_id) 
        REFERENCES users(id) ON DELETE SET NULL
);

-- Job Applications Table
CREATE TABLE IF NOT EXISTS job_applications (
    id SERIAL PRIMARY KEY,
    job_posting_id INTEGER NOT NULL,
    applicant_id INTEGER NOT NULL,
    cover_letter TEXT,
    resume_url VARCHAR(512),
    status applicationstatus NOT NULL DEFAULT 'pending',
    applied_date TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_application_job FOREIGN KEY (job_posting_id) 
        REFERENCES job_postings(id) ON DELETE CASCADE,
    CONSTRAINT fk_application_applicant FOREIGN KEY (applicant_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(512) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type documenttype NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    status documentstatus NOT NULL DEFAULT 'uploaded',
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    uploader_id INTEGER NOT NULL,
    chroma_id VARCHAR(255),
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_document_uploader FOREIGN KEY (uploader_id) 
        REFERENCES users(id) ON DELETE SET NULL
);

-- Document Embeddings Table
CREATE TABLE IF NOT EXISTS document_embeddings (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_start INTEGER,
    chunk_end INTEGER,
    embedding_vector_id VARCHAR(255),
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_embedding_document FOREIGN KEY (document_id) 
        REFERENCES documents(id) ON DELETE CASCADE
);

-- Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_session_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,
    tokens_used INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_message_session FOREIGN KEY (session_id) 
        REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS ix_users_id ON users(id);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
CREATE INDEX IF NOT EXISTS ix_users_username ON users(username);

-- Alumni Profiles indexes
CREATE INDEX IF NOT EXISTS ix_alumni_profiles_id ON alumni_profiles(id);
CREATE INDEX IF NOT EXISTS ix_alumni_profiles_user_id ON alumni_profiles(user_id);

-- Events indexes
CREATE INDEX IF NOT EXISTS ix_events_id ON events(id);
CREATE INDEX IF NOT EXISTS ix_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS ix_events_status ON events(status);
CREATE INDEX IF NOT EXISTS ix_events_creator_id ON events(creator_id);

-- Event Registrations indexes
CREATE INDEX IF NOT EXISTS ix_event_registrations_id ON event_registrations(id);
CREATE INDEX IF NOT EXISTS ix_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS ix_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS ix_event_registrations_status ON event_registrations(status);

-- Job Postings indexes
CREATE INDEX IF NOT EXISTS ix_job_postings_id ON job_postings(id);
CREATE INDEX IF NOT EXISTS ix_job_postings_title ON job_postings(title);
CREATE INDEX IF NOT EXISTS ix_job_postings_company ON job_postings(company);
CREATE INDEX IF NOT EXISTS ix_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS ix_job_postings_poster_id ON job_postings(poster_id);

-- Job Applications indexes
CREATE INDEX IF NOT EXISTS ix_job_applications_id ON job_applications(id);
CREATE INDEX IF NOT EXISTS ix_job_applications_job_posting_id ON job_applications(job_posting_id);
CREATE INDEX IF NOT EXISTS ix_job_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS ix_job_applications_status ON job_applications(status);

-- Documents indexes
CREATE INDEX IF NOT EXISTS ix_documents_id ON documents(id);
CREATE INDEX IF NOT EXISTS ix_documents_title ON documents(title);
CREATE INDEX IF NOT EXISTS ix_documents_chroma_id ON documents(chroma_id);
CREATE INDEX IF NOT EXISTS ix_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS ix_documents_uploader_id ON documents(uploader_id);

-- Document Embeddings indexes
CREATE INDEX IF NOT EXISTS ix_document_embeddings_id ON document_embeddings(id);
CREATE INDEX IF NOT EXISTS ix_document_embeddings_document_id ON document_embeddings(document_id);
CREATE INDEX IF NOT EXISTS ix_document_embeddings_chunk_index ON document_embeddings(chunk_index);

-- Chat Sessions indexes
CREATE INDEX IF NOT EXISTS ix_chat_sessions_id ON chat_sessions(id);
CREATE INDEX IF NOT EXISTS ix_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS ix_chat_sessions_last_message_at ON chat_sessions(last_message_at);

-- Chat Messages indexes
CREATE INDEX IF NOT EXISTS ix_chat_messages_id ON chat_messages(id);
CREATE INDEX IF NOT EXISTS ix_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS ix_chat_messages_created_at ON chat_messages(created_at);

-- =====================================================
-- 4. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alumni_profiles_updated_at BEFORE UPDATE ON alumni_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON event_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON job_postings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_embeddings_updated_at BEFORE UPDATE ON document_embeddings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();