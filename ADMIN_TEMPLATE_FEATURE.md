# University Website Template Selection Feature

## Overview

This feature allows university administrators to select and store a website template for their university. **All alumni of that university will receive the same template** when they log in. The template is stored at the university level, not the individual user level.

## How It Works

### 1. **University-Based Templates**

- Each **University** has a `website_template` field
- All users (admins and alumni) associated with a university share the same template
- When a university admin selects a template, it applies to **all alumni** of that university

### 2. **During Login**

When any user (admin or alumni) logs in, they receive their university's template:

```json
POST /api/v1/auth/login
{
  "username": "university",
  "password": "university123",
  "website_template": "modern-blue"  // Optional - only admins can set this
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "website_template": "modern-blue"  // From their university
}
```

### 3. **Template Storage**

- Templates are stored in the `universities.website_template` column
- If an **admin** provides a template during login, it's **saved to their university**
- If no template is provided, the system returns the **university's existing** template (if any)
- **Alumni** always receive their university's template (they cannot change it)

### 3. **Template Management Endpoints**

#### Get University Template
```http
GET /api/v1/auth/template
Authorization: Bearer <token>
```

**Response:**
```json
{
  "website_template": "modern-blue",
  "university_name": "Default University",
  "university_id": 1,
  "username": "university",
  "role": "UNIVERSITY_ADMIN"
}
```

#### Update University Template (Admin Only)
```http
PUT /api/v1/auth/template?template=classic-red
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "University template updated successfully",
  "website_template": "classic-red",
  "university_name": "Default University",
  "username": "university"
}
```

**Note:** When an admin updates the template, **all alumni** of that university will receive the new template on their next login.

## User Roles

- ✅ **Super Admin** - Can select and manage templates (if associated with a university)
- ✅ **University Admin** - Can select and manage templates for their university
- ✅ **Alumni** - Receive their university's template automatically (read-only)
- ❌ **Guest** - Cannot access template features

## Database Schema

### Universities Table
```sql
CREATE TABLE universities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    website_template VARCHAR(100) NULL,  -- Template for this university
    description TEXT,
    location VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Users Table
```sql
-- Users are associated with universities via foreign key
university_id INTEGER REFERENCES universities(id) ON DELETE SET NULL
```

## Example Usage

### Admin Login (Setting Template)
```bash
# Admin can set template during login - applies to entire university
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "university",
    "password": "university123",
    "website_template": "modern-blue"
  }'
```

### Alumni Login (Receiving Template)
```bash
# Alumni automatically receive their university's template
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alumni",
    "password": "alumni123"
  }'
# Response includes: "website_template": "modern-blue" (from their university)
```

### Update Template Later
```bash
curl -X PUT "http://localhost:8000/api/v1/auth/template?template=classic-red" \
  -H "Authorization: Bearer <access_token>"
```

## Migration

Run the migration to add the `website_template` column:

```bash
alembic upgrade head
```

## Notes

- **Template is shared across all users in a university** - when admin changes it, all alumni get the new template
- Template names are stored as strings (e.g., "modern-blue", "classic-red", "minimal-white")
- Template validation can be added in the future to restrict to predefined templates
- The template is returned in the login response for easy frontend integration
- Users must be associated with a university to receive a template (via `university_id` foreign key)
- If a user is not associated with a university, `website_template` will be `null` in the response

