# Role Migration Guide

## Overview

The user role system has been updated from the old 4-role system to a new 3-role system:

### Old Roles (Deprecated)
- `ADMIN` → Migrated to `SUPER_ADMIN`
- `MODERATOR` → Migrated to `UNIVERSITY_ADMIN`
- `ALUMNI` → Remains `ALUMNI`
- `GUEST` → Remains `GUEST`

### New Roles
- `SUPER_ADMIN` - Full system access
- `UNIVERSITY_ADMIN` - University-level administration
- `ALUMNI` - Standard alumni user
- `GUEST` - Unauthenticated access

## Migration Steps

### 1. Run Database Migration

```bash
# Apply the migration
alembic upgrade head
```

This will:
- Update the enum type in PostgreSQL
- Migrate existing user roles automatically:
  - `admin` → `SUPER_ADMIN`
  - `moderator` → `UNIVERSITY_ADMIN`
  - `alumni` → `ALUMNI`
  - Others → `GUEST`

### 2. Update Code References

The following files have been updated:
- ✅ `app/models/user.py` - UserRole enum
- ✅ `app/api/dependencies.py` - Role dependencies
- ✅ `app/db/init_db.py` - Seed data
- ✅ `app/api/v1/users.py` - API endpoints

### 3. Update Environment

Re-run the database initialization to create new default users:

```bash
python -m app.db.init_db
```

This creates:
- Super Admin: `superadmin@alumni-portal.com` / `superadmin123`
- University Admin: `university@alumni-portal.com` / `university123`
- Alumni: `alumni@example.com` / `alumni123`

### 4. Update API Clients

If you have API clients, update them to use the new role names:
- Old: `role: "admin"` → New: `role: "super_admin"`
- Old: `role: "moderator"` → New: `role: "university_admin"`

## Breaking Changes

### API Dependencies

Old code:
```python
from app.api.dependencies import require_admin

@router.get("/endpoint")
async def endpoint(current_user: User = Depends(require_admin)):
    pass
```

New code:
```python
from app.api.dependencies import require_university_admin

@router.get("/endpoint")
async def endpoint(current_user: User = Depends(require_university_admin)):
    pass
```

**Note**: `require_admin` still works as an alias for `require_university_admin` for backward compatibility.

### Role Checks

Old code:
```python
if current_user.role == UserRole.ADMIN:
    # Admin logic
```

New code:
```python
if current_user.role == UserRole.SUPER_ADMIN:
    # Super admin logic
elif current_user.role == UserRole.UNIVERSITY_ADMIN:
    # University admin logic
```

## Permission Changes

### Super Admin
- **New**: Can manage all users including other admins
- **New**: Full system configuration access
- **Same**: All previous admin permissions

### University Admin
- **New**: Can manage alumni users
- **New**: University-specific administration
- **Removed**: Cannot manage other admins
- **Removed**: Cannot access super admin features

### Alumni
- **Same**: All previous permissions remain

## Testing

After migration, test the following:

1. **Login with each role type**
2. **Verify permissions** for each role
3. **Test API endpoints** with different roles
4. **Check role-based access control**

## Rollback

If you need to rollback:

```bash
# Rollback migration
alembic downgrade -1
```

This will revert to the old role system.

## Support

For issues or questions:
- Check `USER_ROLES.md` for detailed role documentation
- Review `app/api/dependencies.py` for role dependencies
- Check migration file: `alembic/versions/002_update_user_roles.py`

