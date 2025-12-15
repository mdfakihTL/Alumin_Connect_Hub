#!/usr/bin/env python3
"""
Test server startup to identify any errors
"""
import sys
import traceback

print("=" * 80)
print("Testing Server Startup")
print("=" * 80)

try:
    print("\n1. Testing imports...")
    from app.main import app
    print("   ✅ App imported successfully")
    
    print("\n2. Testing router imports...")
    from app.api import api_router
    print("   ✅ API router imported successfully")
    
    print("\n3. Testing posts router...")
    from app.api.routes.posts import router as posts_router
    print("   ✅ Posts router imported successfully")
    
    print("\n4. Testing database connection...")
    from app.core.database import SessionLocal
    db = SessionLocal()
    db.close()
    print("   ✅ Database connection successful")
    
    print("\n" + "=" * 80)
    print("✅ All checks passed! Server should start successfully.")
    print("=" * 80)
    print("\nTo start the server, run:")
    print("  python -m uvicorn app.main:app --reload")
    
except ImportError as e:
    print(f"\n❌ Import Error: {e}")
    print("\nFull traceback:")
    traceback.print_exc()
    sys.exit(1)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nFull traceback:")
    traceback.print_exc()
    sys.exit(1)

