# User Roles and Authentication

## Overview

The Alumni Portal supports three distinct user login types with different permission levels:

1. **Super Admin** - Full system access
2. **University Admin** - University/administrative access
3. **Alumni** - Standard alumni user access

## Role Hierarchy

```
Super Admin (Highest)
    ↓
University Admin
    ↓
Alumni
    ↓
Guest (Lowest - unauthenticated)
```

## Role Definitions

### 🔴 Super Admin (`SUPER_ADMIN`)

**Purpose**: System-level administration with full control

**Permissions**:
- All University Admin permissions
- Manage all users (create, update, delete)
- Manage system settings
- Access all data across all universities
- Manage other admins
- System configuration
- Database administration

**Use Cases**:
- Platform administrators
- System maintainers
- Global administrators

**Default Credentials** (after `init_db`):
- Email: `superadmin@alumni-portal.com`
- Password: `superadmin123`

### 🟡 University Admin (`UNIVERSITY_ADMIN`)

**Purpose**: University-level administration

**Permissions**:
- Manage alumni users within their university
- Create and manage events
- Post and manage job opportunities
- Moderate content
- View analytics and reports
- Manage university-specific settings
- Cannot manage other admins or super admins

**Use Cases**:
- University administrators
- Alumni relations staff
- University IT staff

**Default Credentials** (after `init_db`):
- Email: `university@alumni-portal.com`
- Password: `university123`

### 🟢 Alumni (`ALUMNI`)

**Purpose**: Standard alumni user access

**Permissions**:
- View and update own profile
- Register for events
- Apply for jobs
- Upload and manage own documents
- Use AI chat features
- Search documents
- View public content
- Cannot access admin features

**Use Cases**:
- Alumni members
- Graduates
- Former students

**Default Credentials** (after `init_db`):
- Email: `alumni@example.com`
- Password: `alumni123`

### ⚪ Guest (`GUEST`)

**Purpose**: Limited unauthenticated access

**Permissions**:
- View public content only
- Read-only access
- Cannot create or modify anything

**Use Cases**:
- Unregistered visitors
- Public browsing

## Authentication Flow

### Login Process

1. **User submits credentials** (username/email + password)
2. **System validates** credentials against database
3. **JWT tokens generated** with role information
4. **Access granted** based on role permissions

### Token Structure

```json
{
  "sub": "user_id",
  "username": "username",
  "role": "super_admin|university_admin|alumni",
  "exp": 1234567890,
  "type": "access"
}
```

## API Endpoint Access

### Public Endpoints (No Authentication)
- `POST /api/v1/auth/register` - Register new alumni
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/events` - List public events
- `GET /api/v1/jobs` - List public jobs

### Alumni Endpoints
- All public endpoints
- `GET /api/v1/alumni/me` - Own profile
- `PUT /api/v1/alumni/me` - Update own profile
- `POST /api/v1/events/{id}/register` - Register for events
- `POST /api/v1/jobs/{id}/apply` - Apply for jobs
- `POST /api/v1/documents/upload` - Upload documents
- `POST /api/v1/chat/message` - AI chat

### University Admin Endpoints
- All Alumni endpoints
- `GET /api/v1/users` - List all users
- `GET /api/v1/users/{id}` - View user details
- `POST /api/v1/events` - Create events
- `POST /api/v1/jobs` - Create job postings
- Manage alumni accounts

### Super Admin Endpoints
- All University Admin endpoints
- Full user management (create, update, delete)
- System configuration
- Manage other admins
- All administrative functions

## Code Implementation

### Role Dependencies

```python
from app.api.dependencies import (
    require_super_admin,
    require_university_admin,
    require_alumni
)

# Super admin only
@router.get("/super-admin-only")
async def super_admin_endpoint(
    current_user: User = Depends(require_super_admin)
):
    pass

# University admin and super admin
@router.get("/admin-only")
async def admin_endpoint(
    current_user: User = Depends(require_university_admin)
):
    pass

# All authenticated users
@router.get("/alumni-only")
async def alumni_endpoint(
    current_user: User = Depends(require_alumni)
):
    pass
```

### Role Checking

```python
from app.models.user import UserRole

# Check role in code
if current_user.role == UserRole.SUPER_ADMIN:
    # Super admin logic
    pass
elif current_user.role == UserRole.UNIVERSITY_ADMIN:
    # University admin logic
    pass
```

## Database Migration

When updating roles, run:

```bash
alembic upgrade head
```

This will:
1. Update the enum type
2. Migrate existing users:
   - `admin` → `SUPER_ADMIN`
   - `moderator` → `UNIVERSITY_ADMIN`
   - `alumni` → `ALUMNI`
   - Others → `GUEST`

## Best Practices

1. **Principle of Least Privilege**: Grant minimum necessary permissions
2. **Role-Based Access Control**: Use role dependencies, not manual checks
3. **Audit Logging**: Log all admin actions
4. **Regular Review**: Periodically review user roles
5. **Secure Defaults**: New users default to `GUEST` or `ALUMNI`

## Security Considerations

- **Super Admin accounts** should be limited and monitored
- **University Admin accounts** should be verified
- **Password policies** should be enforced
- **Two-factor authentication** recommended for admins
- **Session management** with proper token expiration
- **Role changes** should be logged and audited

## Example Usage

### Creating a Super Admin

```python
user = User(
    email="admin@university.edu",
    username="admin",
    hashed_password=get_password_hash("secure_password"),
    role=UserRole.SUPER_ADMIN,
    is_active=True,
    is_verified=True
)
```

### Creating a University Admin

```python
user = User(
    email="university@university.edu",
    username="university_admin",
    hashed_password=get_password_hash("secure_password"),
    role=UserRole.UNIVERSITY_ADMIN,
    is_active=True,
    is_verified=True
)
```

### Creating an Alumni User

```python
user = User(
    email="alumni@example.com",
    username="alumni_user",
    hashed_password=get_password_hash("secure_password"),
    role=UserRole.ALUMNI,
    is_active=True,
    is_verified=True
)
```

