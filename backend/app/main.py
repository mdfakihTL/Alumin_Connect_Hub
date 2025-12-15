import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import create_tables
from app.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("Starting up Alumni Connect Hub API...")
    create_tables()
    print("Database tables created/verified.")
    
    # Auto-seed database if enabled and empty
    if os.getenv("AUTO_SEED", "false").lower() == "true":
        try:
            from app.core.database import SessionLocal
            from app.models.user import User
            db = SessionLocal()
            try:
                # Check if database is empty (no users)
                user_count = db.query(User).count()
                if user_count == 0:
                    print("Database is empty. Auto-seeding...")
                    # Import and run seed functions directly
                    import sys
                    import os as os_module
                    backend_dir = os_module.path.dirname(os_module.path.dirname(os_module.path.abspath(__file__)))
                    sys.path.insert(0, backend_dir)
                    from seed_data import main as seed_main
                    seed_main()
                    print("✓ Database seeded successfully")
                else:
                    print(f"Database already has {user_count} users. Skipping seed.")
            finally:
                db.close()
        except Exception as e:
            print(f"⚠ Could not auto-seed database: {e}")
            print("You may need to run 'python seed_data.py' manually")
    
    yield
    # Shutdown
    print("Shutting down...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for Alumni Connect Hub - A comprehensive alumni networking platform",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Configure CORS - CRITICAL: Must be BEFORE router registration
# Build comprehensive list of allowed origins
allowed_origins = [
    "https://alumni-portal-hazel-tau.vercel.app",  # Your Vercel deployment
    "https://alumni-portal-git-main-bhanushri-chintas-projects.vercel.app",  # Preview deployments
    "http://localhost:5173",  # Local development (Vite default)
    "http://localhost:3000",  # Local development (Create React App)
    "http://localhost:8080",  # Local development (Vite custom port)
    "http://127.0.0.1:8080",  # Local development (Vite custom port)
    "http://127.0.0.1:5173",  # Local development
    "http://localhost:5174",  # Alternative Vite port
]

# Also check environment variable for additional origins
cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env:
    env_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
    allowed_origins.extend(env_origins)

# Remove duplicates
allowed_origins = list(set(allowed_origins))

# Custom CORS middleware to handle dynamic origins (Vercel previews, localhost variations)
from starlette.middleware.cors import CORSMiddleware as StarletteCORSMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp, Receive, Send, Scope
import re

def is_origin_allowed(origin: str) -> bool:
    """Check if origin is allowed, including wildcard patterns and dynamic matching."""
    if not origin:
        return False
    
    # Check exact matches first
    if origin in allowed_origins:
        return True
    
    # Allow all Vercel preview deployments (*.vercel.app)
    if origin.endswith(".vercel.app"):
        return True
    
    # Allow localhost with any port
    if re.match(r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$", origin):
        return True
    
    # Check wildcard patterns in allowed_origins
    for allowed in allowed_origins:
        if "*" in allowed:
            pattern = allowed.replace(".", r"\.").replace("*", ".*")
            if re.match(f"^{pattern}$", origin):
                return True
    
    return False

class FlexibleCORSMiddleware:
    """Custom CORS middleware that handles dynamic origins including Vercel previews."""
    
    def __init__(self, app: ASGIApp):
        self.app = app
    
    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        origin = request.headers.get("origin")
        
        # Handle preflight OPTIONS requests
        if request.method == "OPTIONS":
            response = Response()
            if origin and is_origin_allowed(origin):
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD"
                response.headers["Access-Control-Allow-Headers"] = "*"
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Max-Age"] = "3600"
                response.headers["Vary"] = "Origin"
            response.status_code = 200
            await response(scope, receive, send)
            return
        
        # Handle regular requests - wrap send to add CORS headers
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = dict(message.get("headers", []))
                if origin and is_origin_allowed(origin):
                    headers[b"access-control-allow-origin"] = origin.encode()
                    headers[b"access-control-allow-credentials"] = b"true"
                    headers[b"access-control-expose-headers"] = b"*"
                    headers[b"vary"] = b"Origin"
                message["headers"] = list(headers.items())
            await send(message)
        
        await self.app(scope, receive, send_wrapper)

# Use the flexible CORS middleware
app.add_middleware(FlexibleCORSMiddleware)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Alumni Connect Hub API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": settings.APP_NAME}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

