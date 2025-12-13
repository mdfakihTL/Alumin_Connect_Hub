# 🧪 Complete API Testing Guide

## 🔐 Authentication Method

**Your API uses Bearer Token Authentication (NOT OAuth2)**

- **Method**: Bearer Token (JWT)
- **Format**: `Authorization: Bearer <your_access_token>`
- **No OAuth2**: The login endpoint is a simple POST that returns a JWT token
- **Swagger UI**: Shows simple "Bearer Token" input (not OAuth2 password flow)

---

## 📋 Test Credentials

| Role | Username | Password | Email |
|------|----------|----------|-------|
| Super Admin | `superadmin` | `superadmin123` | `superadmin@alumni-portal.com` |
| University Admin | `university` | `university123` | `university@alumni-portal.com` |
| Alumni | `alumni` | `alumni123` | `alumni@example.com` |

---

## 🚀 Step-by-Step: How to Test APIs

### Step 1: Open Swagger UI

1. Start your server (if not running):
   ```powershell
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. Open in browser: **http://localhost:8000/docs**

---

### Step 2: Get Access Token (Login)

1. Find **`POST /api/v1/auth/login`**
2. Click **"Try it out"**
3. Enter credentials:
   ```json
   {
     "username": "superadmin",
     "password": "superadmin123"
   }
   ```
4. Click **"Execute"**
5. **Copy the `access_token`** from response:
   ```json
   {
     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "refresh_token": "...",
     "token_type": "bearer"
   }
   ```

---

### Step 3: Authorize in Swagger UI

1. Click the **"Authorize"** button (🔒 lock icon, top right)
2. You'll see a simple input field (NOT username/password/client ID)
3. Enter your token in one of these ways:
   - **Option A**: Just paste the token (Swagger adds "Bearer " automatically)
   - **Option B**: Enter `Bearer YOUR_ACCESS_TOKEN`
4. Click **"Authorize"**
5. Click **"Close"**

✅ Now all protected endpoints will automatically use this token!

---

## 📚 Complete API Endpoint Testing Guide

### 🔓 Public Endpoints (No Authentication Required)

#### 1. Health Check
- **Endpoint**: `GET /health`
- **Auth**: ❌ None
- **Test**:
  - Click "Try it out" → "Execute"
  - Should return: `{"status": "healthy", "service": "Alumni Portal"}`

#### 2. Root Endpoint
- **Endpoint**: `GET /`
- **Auth**: ❌ None
- **Test**: Click "Try it out" → "Execute"

---

### 🔐 Authentication Endpoints

#### 3. Register User
- **Endpoint**: `POST /api/v1/auth/register`
- **Auth**: ❌ None
- **Test**:
  ```json
  {
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "password123",
    "full_name": "New User"
  }
  ```

#### 4. Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Auth**: ❌ None
- **Test**:
  ```json
  {
    "username": "superadmin",
    "password": "superadmin123"
  }
  ```
- **Response**: Copy `access_token` for authorization

#### 5. Refresh Token
- **Endpoint**: `POST /api/v1/auth/refresh`
- **Auth**: ❌ None (but needs refresh_token)
- **Test**:
  ```json
  "refresh_token_string_here"
  ```

#### 6. Get Current User
- **Endpoint**: `GET /api/v1/auth/me`
- **Auth**: ✅ Bearer Token (Any authenticated user)
- **Test**: 
  - Authorize first (Step 3 above)
  - Click "Try it out" → "Execute"
  - Should return your user info

#### 7. Logout
- **Endpoint**: `POST /api/v1/auth/logout`
- **Auth**: ✅ Bearer Token (Any authenticated user)
- **Test**: Click "Try it out" → "Execute"

---

### 👥 User Management Endpoints

#### 8. Get My Profile
- **Endpoint**: `GET /api/v1/users/me`
- **Auth**: ✅ Bearer Token (Any authenticated user)
- **Test**: Authorize → "Try it out" → "Execute"

#### 9. Update My Profile
- **Endpoint**: `PUT /api/v1/users/me`
- **Auth**: ✅ Bearer Token (Any authenticated user)
- **Test**:
  ```json
  {
    "full_name": "Updated Name",
    "email": "newemail@example.com"
  }
  ```

#### 10. List All Users
- **Endpoint**: `GET /api/v1/users`
- **Auth**: ✅ Bearer Token (University Admin or Super Admin only)
- **Test**: 
  - Login as `university` or `superadmin`
  - Authorize with their token
  - Click "Try it out" → "Execute"

#### 11. Get User by ID
- **Endpoint**: `GET /api/v1/users/{user_id}`
- **Auth**: ✅ Bearer Token (University Admin or Super Admin only)
- **Test**: 
  - Set `user_id` = 1
  - Click "Execute"

---

### 🎓 Alumni Profile Endpoints

#### 12. Create Alumni Profile
- **Endpoint**: `POST /api/v1/alumni`
- **Auth**: ✅ Bearer Token (Any authenticated user)
- **Test**:
  ```json
  {
    "user_id": 1,
    "graduation_year": 2020,
    "degree": "Bachelor of Science",
    "major": "Computer Science",
    "current_position": "Software Engineer",
    "company": "Tech Corp",
    "location": "New York, USA",
    "bio": "Alumni bio here",
    "linkedin_url": "https://linkedin.com/in/user",
    "skills": ["Python", "FastAPI", "PostgreSQL"]
  }
  ```

#### 13. List Alumni Profiles
- **Endpoint**: `GET /api/v1/alumni`
- **Auth**: ❌ None (Public)
- **Test**: Click "Try it out" → "Execute"

#### 14. Get My Alumni Profile
- **Endpoint**: `GET /api/v1/alumni/me`
- **Auth**: ✅ Bearer Token (Any authenticated user)
- **Test**: Authorize → "Try it out" → "Execute"

#### 15. Update My Alumni Profile
- **Endpoint**: `PUT /api/v1/alumni/me`
- **Auth**: ✅ Bearer Token (Any authenticated user)
- **Test**:
  ```json
  {
    "current_position": "Senior Software Engineer",
    "company": "New Company",
    "bio": "Updated bio"
  }
  ```

#### 16. Get Alumni Profile by ID
- **Endpoint**: `GET /api/v1/alumni/{profile_id}`
- **Auth**: ❌ None (Public)
- **Test**: Set `profile_id` = 1 → "Execute"

---

### 📅 Event Endpoints

#### 17. Create Event
- **Endpoint**: `POST /api/v1/events`
- **Auth**: ✅ Bearer Token (Any authenticated user)
- **Test**:
  ```json
  {
    "title": "Alumni Networking Event",
    "description": "Annual networking event",
    "event_type": "networking",
    "status": "published",
    "start_date": "2024-12-20T18:00:00",
    "end_date": "2024-12-20T21:00:00",
    "location": "Convention Center",
    "venue": "Main Hall",
    "max_attendees": 100,
    "is_online": false
  }
  ```

#### 18. List Events
- **Endpoint**: `GET /api/v1/events`
- **Auth**: ❌ None (Public)
- **Test**: Click "Try it out" → "Execute"

#### 19. Get Event by ID
- **Endpoint**: `GET /api/v1/events/{event_id}`
- **Auth**: ❌ None (Public)
- **Test**: Set `event_id` = 1 → "Execute"

#### 20. Register for Event
- **Endpoint**: `POST /api/v1/events/{event_id}/register`
- **Auth**: ✅ Bearer Token (Any authenticated user)
- **Test**:
  - Set `event_id` = 1
  - Body:
    ```json
    {
      "notes": "Looking forward to attending!"
    }
    ```

---

### 💼 Job Posting Endpoints

#### 21. Create Job Posting
- **Endpoint**: `POST /api/v1/jobs`
- **Auth**: ✅ Bearer Token (Any authenticated user)
- **Test**:
  ```json
  {
    "title": "Senior Software Engineer",
    "company": "Tech Company",
    "description": "We are looking for an experienced software engineer...",
    "requirements": "5+ years experience, Python, FastAPI",
    "location": "Remote",
    "job_type": "full_time",
    "status": "active",
    "salary_min": 80000,
    "salary_max": 120000,
    "currency": "USD"
  }
  ```

#### 22. List Jobs
- **Endpoint**: `GET /api/v1/jobs`
- **Auth**: ❌ None (Public - only active jobs)
- **Test**: Click "Try it out" → "Execute"

#### 23. Get Job by ID
- **Endpoint**: `GET /api/v1/jobs/{job_id}`
- **Auth**: ❌ None (Public)
- **Test**: Set `job_id` = 1 → "Execute"

#### 24. Apply for Job
- **Endpoint**: `POST /api/v1/jobs/{job_id}/apply`
- **Auth**: ✅ Bearer Token (Any authenticated user)
- **Test**:
  - Set `job_id` = 1
  - Body:
    ```json
    {
      "cover_letter": "I am interested in this position...",
      "resume_url": "https://example.com/resume.pdf"
    }
    ```

---

### 📄 Document Endpoints

#### 25. Upload Document
- **Endpoint**: `POST /api/v1/documents/upload`
- **Auth**: ✅ Bearer Token (Any authenticated user)
- **Test**:
  - Click "Try it out"
  - Fill form fields:
    - `title`: "My Document"
    - `description`: "Test document"
    - `is_public`: false
  - Click "Choose File" and select a PDF/DOC/TXT file
  - Click "Execute"

#### 26. Search Documents (Vector Search)
- **Endpoint**: `POST /api/v1/documents/search`
- **Auth**: ⚠️ Optional (Better results if authenticated)
- **Test**:
  ```json
  {
    "query": "What is machine learning?",
    "limit": 10
  }
  ```

#### 27. List Documents
- **Endpoint**: `GET /api/v1/documents`
- **Auth**: ⚠️ Optional (Shows public + your documents if authenticated)
- **Test**: Click "Try it out" → "Execute"

#### 28. Get Document by ID
- **Endpoint**: `GET /api/v1/documents/{document_id}`
- **Auth**: ⚠️ Optional (Must be public or yours)
- **Test**: Set `document_id` = 1 → "Execute"

#### 29. Update Document
- **Endpoint**: `PUT /api/v1/documents/{document_id}`
- **Auth**: ✅ Bearer Token (Owner only)
- **Test**:
  ```json
  {
    "title": "Updated Title",
    "description": "Updated description",
    "is_public": true
  }
  ```

#### 30. Delete Document
- **Endpoint**: `DELETE /api/v1/documents/{document_id}`
- **Auth**: ✅ Bearer Token (Owner only)
- **Test**: Set `document_id` = 1 → "Execute"

---

### 💬 Chat Endpoints (AI-Powered)

#### 31. Send Chat Message (RAG)
- **Endpoint**: `POST /api/v1/chat/message`
- **Auth**: ✅ Bearer Token (Any authenticated user)
- **Note**: Requires OpenAI API key in .env
- **Test**:
  ```json
  {
    "content": "What is the alumni network?",
    "session_id": null
  }
  ```

#### 32. List Chat Sessions
- **Endpoint**: `GET /api/v1/chat/sessions`
- **Auth**: ✅ Bearer Token (Any authenticated user)
- **Test**: Click "Try it out" → "Execute"

#### 33. Get Chat Session with Messages
- **Endpoint**: `GET /api/v1/chat/sessions/{session_id}`
- **Auth**: ✅ Bearer Token (Owner only)
- **Test**: Set `session_id` = 1 → "Execute"

---

## 🔑 Authentication Summary

### Endpoints by Authentication Type

| Type | Count | Examples |
|------|-------|----------|
| **Public (No Auth)** | 8 | Health, List Events, List Jobs, List Alumni |
| **Bearer Token Required** | 20 | All create/update/delete, Get me, Chat |
| **Admin Only** | 2 | List Users, Get User by ID |
| **Optional Auth** | 4 | Document search/list (better with auth) |

### Role-Based Access

- **Super Admin**: Full access to everything
- **University Admin**: Can list/view users, full access to other resources
- **Alumni**: Can access their own data, create events/jobs, use chat
- **Guest**: Limited read-only access

---

## 🧪 Quick Test Workflow

### Test as Super Admin

1. **Login**: `POST /api/v1/auth/login` with `superadmin` credentials
2. **Copy token** from response
3. **Authorize** in Swagger UI with the token
4. **Test endpoints**:
   - ✅ `GET /api/v1/auth/me` - Should return super admin user
   - ✅ `GET /api/v1/users` - Should list all users
   - ✅ `POST /api/v1/events` - Create event
   - ✅ `POST /api/v1/jobs` - Create job
   - ✅ `POST /api/v1/documents/upload` - Upload document
   - ✅ `POST /api/v1/chat/message` - Send chat message

### Test as Alumni

1. **Login**: `POST /api/v1/auth/login` with `alumni` credentials
2. **Authorize** with alumni token
3. **Test endpoints**:
   - ✅ `GET /api/v1/auth/me` - Should return alumni user
   - ❌ `GET /api/v1/users` - Should fail (403 Forbidden)
   - ✅ `POST /api/v1/alumni` - Create alumni profile
   - ✅ `GET /api/v1/alumni/me` - Get own profile
   - ✅ `POST /api/v1/events` - Create event
   - ✅ `POST /api/v1/jobs` - Create job posting

---

## 📝 Testing Checklist

### Authentication
- [ ] Can register new user
- [ ] Can login with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Can get access token from login
- [ ] Can refresh token
- [ ] Can get current user with token
- [ ] Can logout

### Authorization
- [ ] Super admin can access all endpoints
- [ ] University admin can list users
- [ ] Alumni cannot list users (403 error)
- [ ] Users can only access their own data

### Endpoints
- [ ] All public endpoints work without auth
- [ ] All protected endpoints require token
- [ ] File upload works
- [ ] Vector search works (if OpenAI key set)
- [ ] Chat works (if OpenAI key set)

---

## 🐛 Common Issues & Solutions

### Issue: "401 Unauthorized"
- **Cause**: Token missing or invalid
- **Solution**: Login again and copy new token

### Issue: "403 Forbidden"
- **Cause**: Insufficient permissions
- **Solution**: Login with user that has required role

### Issue: "422 Validation Error"
- **Cause**: Invalid request body
- **Solution**: Check required fields and data types

### Issue: "500 Internal Server Error"
- **Cause**: Server error
- **Solution**: Check server logs, verify database connection

---

## 💡 Pro Tips

1. **Keep token handy**: Copy token to notepad for quick access
2. **Test with different roles**: Test as super admin, university admin, and alumni
3. **Check responses**: Verify response structure matches expectations
4. **Test error cases**: Try invalid data, missing fields, wrong IDs
5. **Use Swagger UI**: It's the easiest way to test all endpoints

---

## 🎯 Quick Reference

**Base URL**: `http://localhost:8000`  
**Swagger UI**: `http://localhost:8000/docs`  
**ReDoc**: `http://localhost:8000/redoc`  
**Health Check**: `http://localhost:8000/health`

**Auth Header Format**: `Authorization: Bearer <token>`

---

**Happy Testing! 🚀**

