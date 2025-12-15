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
# Allow specific Vercel frontend origin (not wildcard)
allowed_origins = [
    "https://alumni-portal-hazel-tau.vercel.app",  # Your Vercel deployment
    "https://alumni-portal-git-main-bhanushri-chintas-projects.vercel.app",  # Preview deployments
    "http://localhost:5173",  # Local development (Vite default)
    "http://localhost:3000",  # Local development (Create React App)
    "http://localhost:8080",  # Local development (Vite custom port)
    "http://127.0.0.1:8080",  # Local development (Vite custom port)
]

# Also check environment variable for additional origins
cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env:
    env_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
    allowed_origins.extend(env_origins)

# Remove duplicates
allowed_origins = list(set(allowed_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Specific origins only (not wildcard)
    allow_credentials=True,  # Can be True with specific origins
    allow_methods=["*"],  # Allow all methods (includes OPTIONS automatically)
    allow_headers=["*"],  # Allow all headers (simpler, works for preflight)
    expose_headers=["*"],
    max_age=3600,  # Cache preflight responses for 1 hour
)

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

