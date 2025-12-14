# Fix Signin Issues

## Common Issues and Fixes

### 1. API Connection Error
**Problem**: Frontend can't connect to backend

**Fix**: 
- Check `VITE_API_BASE_URL` in `.env` or Vercel environment variables
- Should be: `http://localhost:8000/api/v1` for local, or your Render URL for production
- Verify backend is running: `curl http://localhost:8000/health`

### 2. CORS Error
**Problem**: Browser shows CORS errors in console

**Fix**:
- In backend `.env`, set: `CORS_ORIGINS=http://localhost:5173,http://localhost:8080`
- For production, set `CORS_ORIGINS` in Render to your Vercel URL
- Restart backend after changing CORS settings

### 3. Database Not Seeded
**Problem**: Login fails with "Incorrect email or password" even with correct credentials

**Fix**:
```bash
cd backend
source venv/bin/activate
python seed_data.py
```

### 4. Token Issues
**Problem**: Login succeeds but user not persisted

**Fix**:
- Check browser console for errors
- Clear localStorage: `localStorage.clear()` in browser console
- Try login again

### 5. Backend Not Starting
**Problem**: Backend server won't start

**Fix**:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

## Quick Test

1. **Check Backend**:
   ```bash
   curl http://localhost:8000/health
   ```

2. **Check API**:
   ```bash
   curl http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"john.doe@alumni.mit.edu","password":"password123"}'
   ```

3. **Check Frontend**:
   - Open browser console (F12)
   - Look for API errors
   - Check Network tab for failed requests

## Production Deployment

After deploying to Render and Vercel:

1. **Update Vercel Environment Variable**:
   ```
   VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
   ```

2. **Update Render CORS**:
   ```
   CORS_ORIGINS=https://your-app.vercel.app
   ```

3. **Redeploy both services**

