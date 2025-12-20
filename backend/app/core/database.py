from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Create engine
# Neon (serverless PostgreSQL) compatible configuration
# Normalize database URL for synchronous SQLAlchemy (use psycopg2, not asyncpg)
database_url = settings.DATABASE_URL

# Convert postgres:// to postgresql:// if needed (for SQLAlchemy compatibility)
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

# Remove +asyncpg if present (we use synchronous SQLAlchemy with psycopg2)
if 'postgresql+asyncpg://' in database_url:
    database_url = database_url.replace('postgresql+asyncpg://', 'postgresql://', 1)
elif 'postgresql://' not in database_url and 'postgres://' not in database_url:
    # If it's a Neon connection string with asyncpg, convert it
    database_url = database_url.replace('postgresql+asyncpg://', 'postgresql://', 1)

engine = create_engine(
    database_url,
    pool_pre_ping=True,  # Verify connections before using (important for serverless)
    pool_size=5,  # Connection pool size
    max_overflow=10,  # Max overflow connections
    pool_recycle=300,  # Recycle connections after 5 minutes (important for Neon)
    echo=settings.DEBUG
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base
Base = declarative_base()


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables in the database."""
    try:
        from sqlalchemy import text, inspect
        inspector = inspect(engine)
        
        # Fix users table - make username nullable if it exists and is not nullable
        if 'users' in inspector.get_table_names():
            columns = [col['name'] for col in inspector.get_columns('users')]
            if 'username' in columns:
                try:
                    with engine.begin() as conn:
                        # Check if username is nullable
                        result = conn.execute(text("""
                            SELECT is_nullable 
                            FROM information_schema.columns 
                            WHERE table_name = 'users' AND column_name = 'username'
                        """))
                        row = result.fetchone()
                        if row and row[0] == 'NO':
                            # Make username nullable
                            conn.execute(text("ALTER TABLE users ALTER COLUMN username DROP NOT NULL"))
                            print("  ✓ Made users.username nullable")
                except Exception as e:
                    print(f"  ⚠ Could not modify users.username: {e}")
        
        # Fix universities table - add email columns if missing
        if 'universities' in inspector.get_table_names():
            columns = [col['name'] for col in inspector.get_columns('universities')]
            new_columns = {
                'email': 'VARCHAR',
                'smtp_host': 'VARCHAR',
                'smtp_port': 'INTEGER DEFAULT 587',
                'smtp_user': 'VARCHAR',
                'smtp_password': 'VARCHAR'
            }
            
            for col, col_type in new_columns.items():
                if col not in columns:
                    try:
                        with engine.begin() as conn:
                            conn.execute(text(f"ALTER TABLE universities ADD COLUMN IF NOT EXISTS {col} {col_type}"))
                            print(f"  ✓ Added universities.{col}")
                    except Exception as e:
                        print(f"  ⚠ Could not add universities.{col}: {e}")
        
        # Fix events table if it has old schema
        if 'events' in inspector.get_table_names():
            columns = [col['name'] for col in inspector.get_columns('events')]
            old_columns = ['event_type', 'status', 'start_date', 'end_date', 
                          'venue', 'registration_deadline', 'image_url', 
                          'registration_url', 'is_online', 'online_link', 'creator_id']
            
            # Check if any old columns exist
            columns_to_drop = [col for col in old_columns if col in columns]
            
            if columns_to_drop:
                print(f"⚠ Fixing events table schema - removing {len(columns_to_drop)} old columns...")
                with engine.begin() as conn:
                    # Drop event_registrations first (foreign key constraint)
                    try:
                        conn.execute(text("DROP TABLE IF EXISTS event_registrations CASCADE"))
                        print("  ✓ Dropped event_registrations table")
                    except:
                        pass
                    
                    # Drop old columns
                    for col in columns_to_drop:
                        try:
                            conn.execute(text(f"ALTER TABLE events DROP COLUMN IF EXISTS {col} CASCADE"))
                            print(f"  ✓ Dropped: {col}")
                        except Exception as e:
                            print(f"  ⚠ Could not drop {col}: {e}")
                    
                    # Add new columns if missing
                    new_columns = {
                        'event_date': 'VARCHAR',
                        'event_time': 'VARCHAR',
                        'organizer_id': 'VARCHAR',
                        'is_virtual': 'BOOLEAN DEFAULT FALSE',
                        'meeting_link': 'VARCHAR',
                        'category': 'VARCHAR',
                        'attendees_count': 'INTEGER DEFAULT 0',
                        'is_active': 'BOOLEAN DEFAULT TRUE',
                        'image': 'VARCHAR'
                    }
                    
                    for col, col_type in new_columns.items():
                        if col not in columns:
                            try:
                                conn.execute(text(f"ALTER TABLE events ADD COLUMN IF NOT EXISTS {col} {col_type}"))
                                print(f"  ✓ Added: {col}")
                            except Exception as e:
                                print(f"  ⚠ Could not add {col}: {e}")
                    
                    # Rename image_url to image if needed
                    if 'image_url' in columns and 'image' not in columns:
                        try:
                            conn.execute(text("ALTER TABLE events RENAME COLUMN image_url TO image"))
                            print(f"  ✓ Renamed image_url to image")
                        except:
                            pass
                
                print("✅ Events table schema fixed!")
    except Exception as e:
        print(f"⚠ Could not fix events schema: {e}")
        import traceback
        traceback.print_exc()
    
    # Fix ads table - add new columns if missing
    try:
        from sqlalchemy import text, inspect
        inspector = inspect(engine)
        
        if 'ads' in inspector.get_table_names():
            columns = [col['name'] for col in inspector.get_columns('ads')]
            new_ad_columns = {
                'media_url': 'VARCHAR',
                'media_type': "VARCHAR DEFAULT 'image'",
                'link_url': 'VARCHAR',
                'placement': "VARCHAR DEFAULT 'feed'",
                'target_universities': "TEXT DEFAULT '[\"all\"]'",
                'impressions': 'INTEGER DEFAULT 0',
                'clicks': 'INTEGER DEFAULT 0'
            }
            
            for col, col_type in new_ad_columns.items():
                if col not in columns:
                    try:
                        with engine.begin() as conn:
                            conn.execute(text(f"ALTER TABLE ads ADD COLUMN IF NOT EXISTS {col} {col_type}"))
                            print(f"  ✓ Added ads.{col}")
                    except Exception as e:
                        print(f"  ⚠ Could not add ads.{col}: {e}")
            
            # Copy data from old columns to new if needed
            try:
                with engine.begin() as conn:
                    # Copy image to media_url where media_url is null
                    conn.execute(text("""
                        UPDATE ads SET media_url = image 
                        WHERE media_url IS NULL AND image IS NOT NULL
                    """))
                    # Copy link to link_url where link_url is null
                    conn.execute(text("""
                        UPDATE ads SET link_url = link 
                        WHERE link_url IS NULL AND link IS NOT NULL
                    """))
            except Exception as e:
                print(f"  ⚠ Could not migrate ads data: {e}")
    except Exception as e:
        print(f"⚠ Could not fix ads schema: {e}")
    
    # Now create/update all tables
    Base.metadata.create_all(bind=engine)
