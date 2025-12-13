# 🧪 Testing User Profiles

This guide shows you how to test if all your user profiles are active and working.

## ✅ Quick Check - All Users Status

Run this command to see all users and their status:

```bash
source venv/bin/activate
python3 check_users.py
```

**Expected Output:**
```
📊 Found 3 user(s) in database:
✅ All users are active and verified!
```

## 🔐 Test User Login

### Option 1: Using the Test Script

```bash
# Make sure server is running first
uvicorn app.main:app --reload

# In another terminal, test all users
python3 test_user_login.py
```

This will test:
- Login for all default users
- Access token generation
- `/auth/me` endpoint

### Option 2: Using cURL

Test each user individually:

**Super Admin:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "superadmin", "password": "superadmin123"}'
```

**University Admin:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "university", "password": "university123"}'
```

**Alumni:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alumni", "password": "alumni123"}'
```

### Option 3: Using Swagger UI

1. Start server: `uvicorn app.main:app --reload`
2. Open: http://localhost:8000/docs
3. Go to `/api/v1/auth/login` endpoint
4. Click "Try it out"
5. Enter credentials:
   ```json
   {
     "username": "superadmin",
     "password": "superadmin123"
   }
   ```
6. Click "Execute"
7. Check response for access token

## 📋 Default Users

| Username | Password | Role | Email |
|----------|----------|------|-------|
| `superadmin` | `superadmin123` | Super Admin | superadmin@alumni-portal.com |
| `university` | `university123` | University Admin | university@alumni-portal.com |
| `alumni` | `alumni123` | Alumni | alumni@example.com |

## ✅ What to Check

### 1. User Status
- ✅ All users are `is_active = True`
- ✅ All users are `is_verified = True`
- ✅ Users have correct roles

### 2. Login Functionality
- ✅ Can login with username/password
- ✅ Receive access token
- ✅ Receive refresh token
- ✅ Token is valid

### 3. Authentication
- ✅ Can access `/auth/me` with token
- ✅ Token contains correct user info
- ✅ Role-based access works

## 🛠️ Available Scripts

### `check_users.py`
Shows all users and their status:
```bash
python3 check_users.py
```

Options:
```bash
# Check specific user
python3 check_users.py --test-login superadmin
```

### `test_user_login.py`
Tests login functionality:
```bash
# Test all default users
python3 test_user_login.py

# Test specific user
python3 test_user_login.py --user superadmin --password superadmin123

# Test against different server
python3 test_user_login.py --url https://your-api.com
```

## 🔍 Current Status

Based on the last check:

✅ **All 3 users are active and verified:**
- Super Admin: ✅ Active, ✅ Verified
- University Admin: ✅ Active, ✅ Verified  
- Alumni: ✅ Active, ✅ Verified

## 🐛 Troubleshooting

### User not found
- Check if user exists: `python3 check_users.py`
- Verify username is correct
- Check database connection

### Login fails
- Verify password is correct
- Check if user is active: `is_active = True`
- Check server logs for errors

### Token not working
- Verify token format: `Bearer <token>`
- Check token expiration
- Verify SECRET_KEY is set correctly

## 📝 Next Steps

1. ✅ All users are active (verified)
2. Test login functionality
3. Test role-based access
4. Test API endpoints with different roles

---

**All your users are ready to use!** 🎉

