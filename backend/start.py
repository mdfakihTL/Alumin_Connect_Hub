#!/usr/bin/env python3
"""
Render startup script - ensures correct Python path
"""
import sys
import os

# Add current directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Verify import works
try:
    from app.main import app
    print(f"✅ Successfully imported app from {backend_dir}")
except ImportError as e:
    print(f"❌ Failed to import app: {e}")
    print(f"Current directory: {os.getcwd()}")
    print(f"Python path: {sys.path[:3]}")
    print(f"Backend dir: {backend_dir}")
    sys.exit(1)

# Import uvicorn and run
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

