#!/usr/bin/env python3
"""
Check for server startup errors
"""
import sys
import traceback
import os

# Change to backend directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 80)
print("Checking for Server Startup Errors")
print("=" * 80)

errors = []

# Test 1: Import app
print("\n1. Testing app import...")
try:
    from app.main import app
    print("   ✅ App imported successfully")
except Exception as e:
    error_msg = f"App import failed: {str(e)}"
    print(f"   ❌ {error_msg}")
    errors.append(error_msg)
    traceback.print_exc()

# Test 2: Check database connection
print("\n2. Testing database connection...")
try:
    from app.core.database import SessionLocal, engine
    db = SessionLocal()
    db.close()
    print("   ✅ Database connection successful")
except Exception as e:
    error_msg = f"Database connection failed: {str(e)}"
    print(f"   ❌ {error_msg}")
    errors.append(error_msg)
    traceback.print_exc()

# Test 3: Check all route imports
print("\n3. Testing route imports...")
try:
    from app.api import api_router
    print("   ✅ API router imported successfully")
    
    # Check posts router specifically
    from app.api.routes.posts import router as posts_router
    print("   ✅ Posts router imported successfully")
except Exception as e:
    error_msg = f"Route import failed: {str(e)}"
    print(f"   ❌ {error_msg}")
    errors.append(error_msg)
    traceback.print_exc()

# Test 4: Check config
print("\n4. Testing configuration...")
try:
    from app.core.config import settings
    print(f"   ✅ Config loaded - DATABASE_URL: {'Set' if settings.DATABASE_URL else 'Missing'}")
    if not settings.DATABASE_URL:
        errors.append("DATABASE_URL not set in environment")
except Exception as e:
    error_msg = f"Config error: {str(e)}"
    print(f"   ❌ {error_msg}")
    errors.append(error_msg)
    traceback.print_exc()

# Test 5: Try to start uvicorn (briefly)
print("\n5. Testing uvicorn startup...")
try:
    import uvicorn
    print("   ✅ Uvicorn imported successfully")
    print("   ℹ️  To start server: python -m uvicorn app.main:app --reload")
except Exception as e:
    error_msg = f"Uvicorn import failed: {str(e)}"
    print(f"   ❌ {error_msg}")
    errors.append(error_msg)
    traceback.print_exc()

# Summary
print("\n" + "=" * 80)
if errors:
    print("❌ ERRORS FOUND:")
    for i, error in enumerate(errors, 1):
        print(f"   {i}. {error}")
    print("\n" + "=" * 80)
    sys.exit(1)
else:
    print("✅ All checks passed! Server should start successfully.")
    print("=" * 80)
    print("\nTo start the server, run:")
    print("  python -m uvicorn app.main:app --reload")
    sys.exit(0)

