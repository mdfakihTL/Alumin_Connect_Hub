# 🚨 URGENT: Login Not Working - Complete Fix

## Problem
The deployed backend on Render is using an OLD schema that expects `username` instead of `email`.

## Root Cause
Render hasn't deployed the latest code yet, OR there's a path conflict with old `app/` directory.

## ✅ Solution - Do This Now

### Step 1: Trigger Manual Redeploy in Render
1. Go to **Render Dashboard**: https://dashboard.render.com
2. Click on your **alumni-portal** service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**
4. **Wait 2-3 minutes** for deployment

### Step 2: Verify Deployment
After redeploy, test:
```bash
curl -X POST https://alumni-portal-yw7q.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@alumni.mit.edu","password":"password123"}'
```

**Should return**: `{"access_token":"...","user":{...}}`

### Step 3: If Still Not Working

**Option A: Check Render Build Logs**
- Look for errors during build
- Check if `backend/` directory is being used
- Verify Python path is correct

**Option B: Verify Render Settings**
1. Render Dashboard → Your service → Settings
2. Check **"Root Directory"** - should be `backend` or `.`
3. Check **"Build Command"** - should be `pip install -r requirements.txt`
4. Check **"Start Command"** - should include `cd backend &&`

**Option C: Re-seed Database**
1. In Neon Console → SQL Editor:
   ```sql
   DELETE FROM users;
   ```
2. In Render → Environment:
   - Set `AUTO_SEED=true`
   - Save (triggers redeploy)

## 🔍 Verification Checklist

After redeploy, verify:

- [ ] Backend health check works
- [ ] Login endpoint accepts `email` (not `username`)
- [ ] Database is seeded (users exist)
- [ ] Frontend can connect to backend
- [ ] CORS is configured

## 📝 Test Commands

```bash
# 1. Test health
curl https://alumni-portal-yw7q.onrender.com/health

# 2. Test login (should work after redeploy)
curl -X POST https://alumni-portal-yw7q.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@alumni.mit.edu","password":"password123"}'

# 3. Check OpenAPI schema
curl https://alumni-portal-yw7q.onrender.com/openapi.json | grep -A 5 "UserLogin"
```

## 🎯 Expected Result

After redeploy, the OpenAPI schema should show:
```json
"UserLogin": {
  "properties": {
    "email": {"type": "string"},
    "password": {"type": "string"}
  }
}
```

**NOT:**
```json
"UserLogin": {
  "properties": {
    "username": {"type": "string"},  // ❌ OLD VERSION
    "password": {"type": "string"}
  }
}
```

## ⚡ Quick Action

**Go to Render NOW and trigger manual redeploy!**

The code is correct - Render just needs to deploy the latest version.

