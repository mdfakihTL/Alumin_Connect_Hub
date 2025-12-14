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
    
    # Fix events table schema if needed
    try:
        from app.core.database import engine, SessionLocal
        from sqlalchemy import text, inspect
        from app.models.event import Event
        
        db = SessionLocal()
        try:
            # Check if events table has old columns
            inspector = inspect(engine)
            if 'events' in inspector.get_table_names():
                columns = [col['name'] for col in inspector.get_columns('events')]
                old_columns = ['event_type', 'status', 'start_date', 'end_date']
                has_old_columns = any(col in columns for col in old_columns)
                
                if has_old_columns:
                    print("⚠ Detected old events table schema. Fixing...")
                    with engine.connect() as conn:
                        # Drop old columns if they exist
                        for col in old_columns:
                            if col in columns:
                                try:
                                    conn.execute(text(f"ALTER TABLE events DROP COLUMN IF EXISTS {col}"))
                                    conn.commit()
                                    print(f"✓ Removed old column: {col}")
                                except Exception as e:
                                    print(f"⚠ Could not remove {col}: {e}")
                        
                        # Ensure new columns exist
                        new_columns_map = {
                            'event_date': 'VARCHAR',
                            'event_time': 'VARCHAR',
                            'organizer_id': 'VARCHAR',
                            'is_virtual': 'BOOLEAN DEFAULT FALSE',
                            'meeting_link': 'VARCHAR',
                            'category': 'VARCHAR',
                            'attendees_count': 'INTEGER DEFAULT 0',
                            'is_active': 'BOOLEAN DEFAULT TRUE'
                        }
                        
                        for col, col_type in new_columns_map.items():
                            if col not in columns:
                                try:
                                    conn.execute(text(f"ALTER TABLE events ADD COLUMN IF NOT EXISTS {col} {col_type}"))
                                    conn.commit()
                                    print(f"✓ Added column: {col}")
                                except Exception as e:
                                    print(f"⚠ Could not add {col}: {e}")
                    
                    print("✅ Events table schema fixed!")
        finally:
            db.close()
    except Exception as e:
        print(f"⚠ Could not fix events schema: {e}")
        print("Events may not work correctly until schema is fixed.")
    
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

# Configure CORS
origins = settings.CORS_ORIGINS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

