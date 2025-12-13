# 🧪 How to Test All APIs - Complete Request Guide

## 📋 Table of Contents
1. [Start the Server](#start-the-server)
2. [Get Authentication Token](#get-authentication-token)
3. [Authentication APIs](#authentication-apis)
4. [User APIs](#user-apis)
5. [Alumni APIs](#alumni-apis)
6. [Event APIs](#event-apis)
7. [Job APIs](#job-apis)
8. [Document APIs](#document-apis)
9. [Chat APIs](#chat-apis)

---

## 🚀 Start the Server

### Step 1: Start FastAPI Server
```powershell
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 2: Open Swagger UI
Open in browser: **http://localhost:8000/docs**

---

## 🔐 Get Authentication Token

**You need a token to access most APIs!**

### Option 1: Register New User
**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**
```json
{
  "email": "test@example.com",
  "username": "testuser",
  "full_name": "Test User",
  "password": "testpass123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "test@example.com",
    "username": "testuser",
    "full_name": "Test User",
    "role": "GUEST",
    "is_active": true,
    "is_verified": false
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Copy the `access_token`!**

### Option 2: Login (Use Existing User)
**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "username": "superadmin",
  "password": "superadmin123"
}
```

**Or use test credentials:**
- **Super Admin:** `superadmin` / `superadmin123`
- **University Admin:** `university` / `university123`
- **Alumni:** `alumni` / `alumni123`

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Copy the `access_token`!**

---

## 🔑 Using the Token

### In Swagger UI:
1. Click **"Authorize"** button (top right)
2. Enter: `Bearer <your_access_token>`
   - Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Click **"Authorize"**

### In PowerShell/Postman:
Add header:
```
Authorization: Bearer <your_access_token>
```

---

## 📝 Authentication APIs

### 1. Register User
**Endpoint:** `POST /api/v1/auth/register`  
**Auth Required:** ❌ No

**Request:**
```json
{
  "email": "newuser@example.com",
  "username": "newuser",
  "full_name": "New User",
  "password": "password123"
}
```

**PowerShell:**
```powershell
$body = @{
    email = "newuser@example.com"
    username = "newuser"
    full_name = "New User"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/register" -Method Post -Body $body -ContentType "application/json"
```

---

### 2. Login
**Endpoint:** `POST /api/v1/auth/login`  
**Auth Required:** ❌ No

**Request:**
```json
{
  "username": "testuser",
  "password": "testpass123"
}
```

**PowerShell:**
```powershell
$body = @{
    username = "testuser"
    password = "testpass123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $response.access_token
Write-Host "Token: $token"
```

---

### 3. Refresh Token
**Endpoint:** `POST /api/v1/auth/refresh`  
**Auth Required:** ❌ No

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**PowerShell:**
```powershell
$body = @{
    refresh_token = "your_refresh_token_here"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/refresh" -Method Post -Body $body -ContentType "application/json"
```

---

### 4. Logout
**Endpoint:** `POST /api/v1/auth/logout`  
**Auth Required:** ✅ Yes

**Request:** No body needed

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/logout" -Method Post -Headers $headers
```

---

### 5. Get Current User Info
**Endpoint:** `GET /api/v1/auth/me`  
**Auth Required:** ✅ Yes

**Request:** No body needed

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/me" -Method Get -Headers $headers
```

---

## 👤 User APIs

### 1. Get My Profile
**Endpoint:** `GET /api/v1/users/me`  
**Auth Required:** ✅ Yes

**Request:** No body needed

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/users/me" -Method Get -Headers $headers
```

---

### 2. Update My Profile
**Endpoint:** `PUT /api/v1/users/me`  
**Auth Required:** ✅ Yes

**Request:**
```json
{
  "full_name": "Updated Name",
  "email": "newemail@example.com"
}
```

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$body = @{
    full_name = "Updated Name"
    email = "newemail@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/users/me" -Method Put -Body $body -ContentType "application/json" -Headers $headers
```

---

### 3. List All Users (Admin Only)
**Endpoint:** `GET /api/v1/users?skip=0&limit=100`  
**Auth Required:** ✅ Yes (University Admin or Super Admin)

**Query Parameters:**
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum number of records (default: 100)

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/users?skip=0&limit=100" -Method Get -Headers $headers
```

---

### 4. Get User by ID (Admin Only)
**Endpoint:** `GET /api/v1/users/{user_id}`  
**Auth Required:** ✅ Yes (University Admin or Super Admin)

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/users/1" -Method Get -Headers $headers
```

---

## 🎓 Alumni APIs

### 1. Create Alumni Profile
**Endpoint:** `POST /api/v1/alumni`  
**Auth Required:** ✅ Yes

**Request:**
```json
{
  "user_id": 1,
  "graduation_year": 2020,
  "degree": "Bachelor of Science",
  "major": "Computer Science",
  "current_position": "Software Engineer",
  "company": "Tech Corp",
  "location": "New York, NY",
  "bio": "Passionate software engineer",
  "linkedin_url": "https://linkedin.com/in/user",
  "github_url": "https://github.com/user",
  "skills": ["Python", "FastAPI", "PostgreSQL"],
  "interests": ["AI", "Web Development"]
}
```

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$body = @{
    user_id = 1
    graduation_year = 2020
    degree = "Bachelor of Science"
    major = "Computer Science"
    current_position = "Software Engineer"
    company = "Tech Corp"
    location = "New York, NY"
    skills = @("Python", "FastAPI", "PostgreSQL")
    interests = @("AI", "Web Development")
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/alumni" -Method Post -Body $body -ContentType "application/json" -Headers $headers
```

---

### 2. List Alumni Profiles
**Endpoint:** `GET /api/v1/alumni?skip=0&limit=100`  
**Auth Required:** ❌ No (Public)

**Query Parameters:**
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum number of records (default: 100)

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/alumni?skip=0&limit=100" -Method Get
```

---

### 3. Get My Alumni Profile
**Endpoint:** `GET /api/v1/alumni/me`  
**Auth Required:** ✅ Yes

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/alumni/me" -Method Get -Headers $headers
```

---

### 4. Update My Alumni Profile
**Endpoint:** `PUT /api/v1/alumni/me`  
**Auth Required:** ✅ Yes

**Request:**
```json
{
  "current_position": "Senior Software Engineer",
  "company": "New Company",
  "bio": "Updated bio"
}
```

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$body = @{
    current_position = "Senior Software Engineer"
    company = "New Company"
    bio = "Updated bio"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/alumni/me" -Method Put -Body $body -ContentType "application/json" -Headers $headers
```

---

### 5. Get Alumni Profile by ID
**Endpoint:** `GET /api/v1/alumni/{profile_id}`  
**Auth Required:** ❌ No (Public)

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/alumni/1" -Method Get
```

---

## 📅 Event APIs

### 1. Create Event
**Endpoint:** `POST /api/v1/events`  
**Auth Required:** ✅ Yes

**Request:**
```json
{
  "title": "Alumni Networking Event",
  "description": "Annual alumni networking event",
  "event_type": "NETWORKING",
  "start_date": "2025-12-20T18:00:00",
  "end_date": "2025-12-20T22:00:00",
  "location": "Convention Center",
  "venue": "Main Hall",
  "max_attendees": 100,
  "registration_deadline": "2025-12-18T23:59:59",
  "is_online": false
}
```

**Event Types:** `NETWORKING`, `WORKSHOP`, `CONFERENCE`, `SOCIAL`, `OTHER`

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$body = @{
    title = "Alumni Networking Event"
    description = "Annual alumni networking event"
    event_type = "NETWORKING"
    start_date = "2025-12-20T18:00:00"
    end_date = "2025-12-20T22:00:00"
    location = "Convention Center"
    venue = "Main Hall"
    max_attendees = 100
    registration_deadline = "2025-12-18T23:59:59"
    is_online = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/events" -Method Post -Body $body -ContentType "application/json" -Headers $headers
```

---

### 2. List Events
**Endpoint:** `GET /api/v1/events?skip=0&limit=100`  
**Auth Required:** ❌ No (Public)

**Query Parameters:**
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum number of records (default: 100)

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/events?skip=0&limit=100" -Method Get
```

---

### 3. Get Event by ID
**Endpoint:** `GET /api/v1/events/{event_id}`  
**Auth Required:** ❌ No (Public)

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/events/1" -Method Get
```

---

### 4. Register for Event
**Endpoint:** `POST /api/v1/events/{event_id}/register`  
**Auth Required:** ✅ Yes

**Request:**
```json
{
  "event_id": 1,
  "notes": "Looking forward to attending!"
}
```

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$body = @{
    event_id = 1
    notes = "Looking forward to attending!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/events/1/register" -Method Post -Body $body -ContentType "application/json" -Headers $headers
```

---

## 💼 Job APIs

### 1. Create Job Posting
**Endpoint:** `POST /api/v1/jobs`  
**Auth Required:** ✅ Yes

**Request:**
```json
{
  "title": "Senior Software Engineer",
  "company": "Tech Corp",
  "description": "We are looking for an experienced software engineer...",
  "requirements": "5+ years experience, Python, FastAPI",
  "location": "Remote",
  "job_type": "FULL_TIME",
  "salary_min": 100000,
  "salary_max": 150000,
  "currency": "USD",
  "application_deadline": "2025-12-31T23:59:59",
  "contact_email": "jobs@techcorp.com",
  "is_featured": false
}
```

**Job Types:** `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP`, `FREELANCE`

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$body = @{
    title = "Senior Software Engineer"
    company = "Tech Corp"
    description = "We are looking for an experienced software engineer..."
    requirements = "5+ years experience, Python, FastAPI"
    location = "Remote"
    job_type = "FULL_TIME"
    salary_min = 100000
    salary_max = 150000
    currency = "USD"
    application_deadline = "2025-12-31T23:59:59"
    contact_email = "jobs@techcorp.com"
    is_featured = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/jobs" -Method Post -Body $body -ContentType "application/json" -Headers $headers
```

---

### 2. List Jobs
**Endpoint:** `GET /api/v1/jobs?skip=0&limit=100`  
**Auth Required:** ❌ No (Public)

**Query Parameters:**
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum number of records (default: 100)

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/jobs?skip=0&limit=100" -Method Get
```

---

### 3. Get Job by ID
**Endpoint:** `GET /api/v1/jobs/{job_id}`  
**Auth Required:** ❌ No (Public)

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/jobs/1" -Method Get
```

---

### 4. Apply for Job
**Endpoint:** `POST /api/v1/jobs/{job_id}/apply`  
**Auth Required:** ✅ Yes

**Request:**
```json
{
  "job_posting_id": 1,
  "cover_letter": "I am interested in this position...",
  "resume_url": "https://example.com/resume.pdf"
}
```

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$body = @{
    job_posting_id = 1
    cover_letter = "I am interested in this position..."
    resume_url = "https://example.com/resume.pdf"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/jobs/1/apply" -Method Post -Body $body -ContentType "application/json" -Headers $headers
```

---

## 📄 Document APIs

### 1. Upload Document
**Endpoint:** `POST /api/v1/documents/upload`  
**Auth Required:** ✅ Yes  
**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: (file) - The document file
- `title`: (string) - Document title
- `description`: (string, optional) - Document description
- `is_public`: (boolean) - Whether document is public

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$filePath = "C:\path\to\document.pdf"
$formData = @{
    file = Get-Item $filePath
    title = "My Document"
    description = "Document description"
    is_public = $false
}

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/documents/upload" -Method Post -Form $formData -Headers $headers
```

---

### 2. Search Documents (Vector Search)
**Endpoint:** `POST /api/v1/documents/search`  
**Auth Required:** ⚠️ Optional (for private documents)

**Request:**
```json
{
  "query": "What is machine learning?",
  "limit": 10
}
```

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$body = @{
    query = "What is machine learning?"
    limit = 10
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/documents/search" -Method Post -Body $body -ContentType "application/json" -Headers $headers
```

---

### 3. List Documents
**Endpoint:** `GET /api/v1/documents?skip=0&limit=100`  
**Auth Required:** ⚠️ Optional (shows public + user's private documents)

**Query Parameters:**
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum number of records (default: 100)

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/documents?skip=0&limit=100" -Method Get -Headers $headers
```

---

### 4. Get Document by ID
**Endpoint:** `GET /api/v1/documents/{document_id}`  
**Auth Required:** ⚠️ Optional (required for private documents)

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/documents/1" -Method Get -Headers $headers
```

---

## 💬 Chat APIs

### 1. Send Message (AI Chat with RAG)
**Endpoint:** `POST /api/v1/chat/message`  
**Auth Required:** ✅ Yes

**Request:**
```json
{
  "content": "What is the alumni portal about?",
  "session_id": null
}
```

**Note:** If `session_id` is null, a new session will be created automatically.

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$body = @{
    content = "What is the alumni portal about?"
    session_id = $null
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat/message" -Method Post -Body $body -ContentType "application/json" -Headers $headers
```

---

### 2. List Chat Sessions
**Endpoint:** `GET /api/v1/chat/sessions?skip=0&limit=50`  
**Auth Required:** ✅ Yes

**Query Parameters:**
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum number of records (default: 50)

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat/sessions?skip=0&limit=50" -Method Get -Headers $headers
```

---

### 3. Get Chat Session by ID
**Endpoint:** `GET /api/v1/chat/sessions/{session_id}`  
**Auth Required:** ✅ Yes

**PowerShell:**
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/chat/sessions/1" -Method Get -Headers $headers
```

---

## 🧪 Quick Test Script (PowerShell)

Save this as `test_all_apis.ps1`:

```powershell
# Set base URL
$baseUrl = "http://localhost:8000"
$token = ""

# 1. Register
Write-Host "1. Registering user..." -ForegroundColor Cyan
$registerBody = @{
    email = "test@example.com"
    username = "testuser"
    full_name = "Test User"
    password = "testpass123"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
$token = $registerResponse.access_token
Write-Host "Token: $token" -ForegroundColor Green

# 2. Get My Profile
Write-Host "`n2. Getting my profile..." -ForegroundColor Cyan
$headers = @{ Authorization = "Bearer $token" }
$profile = Invoke-RestMethod -Uri "$baseUrl/api/v1/users/me" -Method Get -Headers $headers
Write-Host "Profile: $($profile | ConvertTo-Json)" -ForegroundColor Green

# 3. Create Alumni Profile
Write-Host "`n3. Creating alumni profile..." -ForegroundColor Cyan
$alumniBody = @{
    user_id = $profile.id
    graduation_year = 2020
    degree = "Bachelor of Science"
    major = "Computer Science"
} | ConvertTo-Json

$alumni = Invoke-RestMethod -Uri "$baseUrl/api/v1/alumni" -Method Post -Body $alumniBody -ContentType "application/json" -Headers $headers
Write-Host "Alumni Profile Created!" -ForegroundColor Green

# 4. Create Event
Write-Host "`n4. Creating event..." -ForegroundColor Cyan
$eventBody = @{
    title = "Test Event"
    description = "Test event description"
    event_type = "NETWORKING"
    start_date = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss")
    end_date = (Get-Date).AddDays(8).ToString("yyyy-MM-ddTHH:mm:ss")
    location = "Test Location"
} | ConvertTo-Json

$event = Invoke-RestMethod -Uri "$baseUrl/api/v1/events" -Method Post -Body $eventBody -ContentType "application/json" -Headers $headers
Write-Host "Event Created! ID: $($event.id)" -ForegroundColor Green

# 5. List Events
Write-Host "`n5. Listing events..." -ForegroundColor Cyan
$events = Invoke-RestMethod -Uri "$baseUrl/api/v1/events" -Method Get
Write-Host "Found $($events.Count) events" -ForegroundColor Green

Write-Host "`n✅ All tests completed!" -ForegroundColor Green
```

Run it:
```powershell
.\test_all_apis.ps1
```

---

## 📚 Additional Resources

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **API Documentation:** See `API_DOCUMENTATION.md`

---

## ⚠️ Important Notes

1. **Token Expiration:** Access tokens expire after 30 minutes (default). Use refresh token to get new access token.

2. **Role-Based Access:**
   - **GUEST:** Can register, login, view public content
   - **ALUMNI:** Can create profile, apply for jobs, register for events
   - **UNIVERSITY_ADMIN:** Can manage events, jobs, users
   - **SUPER_ADMIN:** Full access to everything

3. **Datetime Format:** Use ISO 8601 format: `"2025-12-20T18:00:00"`

4. **File Uploads:** Use `multipart/form-data` for document uploads

5. **Error Responses:** All errors return JSON with `detail` field:
   ```json
   {
     "detail": "Error message here"
   }
   ```

---

**Happy Testing! 🚀**

