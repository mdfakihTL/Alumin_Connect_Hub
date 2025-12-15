# Server Startup Troubleshooting Guide

## Common Errors and Solutions

### 1. ❌ **ModuleNotFoundError: No module named 'app'**

**Error:**
```
ModuleNotFoundError: No module named 'app'
```

**Solution:**
Make sure you're in the `backend` directory:
```bash
cd backend
python -m uvicorn app.main:app --reload
```

---

### 2. ❌ **Database Connection Error**

**Error:**
```
sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) could not connect to server
```

**Solution:**
1. Check if `.env` file exists in `backend/` directory
2. Verify `DATABASE_URL` is set correctly:
   ```bash
   # Check .env file
   cat backend/.env | grep DATABASE_URL
   ```
3. Make sure your Neon database is running
4. Test connection:
   ```bash
   python test_db_connection.py
   ```

---

### 3. ❌ **Missing Environment Variables**

**Error:**
```
pydantic_core._pydantic_core.ValidationError: 1 validation error for Settings
```

**Solution:**
Create `.env` file in `backend/` directory with required variables:
```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
SECRET_KEY=your-secret-key-here
```

---

### 4. ❌ **Port Already in Use**

**Error:**
```
ERROR:    [Errno 48] Address already in use
```

**Solution:**
1. Find and kill the process using port 8000:
   ```bash
   # Windows PowerShell
   netstat -ano | findstr :8000
   taskkill /PID <PID> /F
   
   # Or use a different port
   python -m uvicorn app.main:app --reload --port 8001
   ```

---

### 5. ❌ **Import Errors**

**Error:**
```
ImportError: cannot import name 'X' from 'app.Y'
```

**Solution:**
1. Run the startup test:
   ```bash
   python test_server_startup.py
   ```
2. Check for syntax errors:
   ```bash
   python -m py_compile app/api/routes/posts.py
   ```

---

## Quick Diagnostic Steps

### Step 1: Test Imports
```bash
cd backend
python -c "from app.main import app; print('✅ Import successful')"
```

### Step 2: Test Database Connection
```bash
python -c "from app.core.database import SessionLocal; db = SessionLocal(); db.close(); print('✅ Database connection successful')"
```

### Step 3: Test Server Startup
```bash
python test_server_startup.py
```

### Step 4: Start Server
```bash
python -m uvicorn app.main:app --reload
```

---

## Expected Successful Startup Output

```
INFO:     Will watch for changes in these directories: ['D:\\...\\backend']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXXX] using WatchFiles
Starting up Alumni Connect Hub API...
Database tables created/verified.
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## Still Having Issues?

1. **Share the exact error message** from your terminal
2. **Check the logs** - look for any red error messages
3. **Verify environment** - make sure `.env` file exists and has correct values
4. **Test database connection** separately using `test_db_connection.py`

---

## Quick Fixes Applied

✅ Removed unused `s3_service` import from `posts.py`  
✅ All syntax checks pass  
✅ All imports verified  
✅ Database connection tested  

The server should start successfully now!

