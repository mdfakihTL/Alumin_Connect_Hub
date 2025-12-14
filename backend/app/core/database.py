from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Create engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
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
    # First, fix events table if it has old schema
    try:
        from sqlalchemy import text, inspect
        inspector = inspect(engine)
        
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
    
    # Now create/update all tables
    Base.metadata.create_all(bind=engine)
