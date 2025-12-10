"""
Test database connection
"""
import asyncio
import sys
from sqlalchemy import text
from app.db.session import async_engine, sync_engine
from app.core.config import settings

async def test_async_connection():
    """Test async database connection"""
    try:
        async with async_engine.connect() as conn:
            result = await conn.execute(text("SELECT 1 as test"))
            row = result.fetchone()
            if row and row[0] == 1:
                print("✅ Async database connection successful!")
                print(f"   Database URL: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'hidden'}")
                return True
            else:
                print("❌ Async connection test returned unexpected result")
                return False
    except Exception as e:
        print(f"❌ Async database connection failed: {str(e)}")
        print(f"   Error type: {type(e).__name__}")
        return False

def test_sync_connection():
    """Test sync database connection"""
    try:
        with sync_engine.connect() as conn:
            result = conn.execute(text("SELECT 1 as test"))
            row = result.fetchone()
            if row and row[0] == 1:
                print("✅ Sync database connection successful!")
                return True
            else:
                print("❌ Sync connection test returned unexpected result")
                return False
    except Exception as e:
        print(f"❌ Sync database connection failed: {str(e)}")
        print(f"   Error type: {type(e).__name__}")
        return False

def test_tables():
    """Test if tables exist"""
    try:
        with sync_engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = [row[0] for row in result]
            if tables:
                print(f"\n✅ Found {len(tables)} tables in database:")
                for table in tables:
                    print(f"   - {table}")
                return True
            else:
                print("\n⚠️  No tables found in database")
                return False
    except Exception as e:
        print(f"❌ Error checking tables: {str(e)}")
        return False

def test_enums():
    """Test if ENUM types exist"""
    try:
        with sync_engine.connect() as conn:
            result = conn.execute(text("""
                SELECT typname 
                FROM pg_type 
                WHERE typtype = 'e'
                ORDER BY typname
            """))
            enums = [row[0] for row in result]
            if enums:
                print(f"\n✅ Found {len(enums)} ENUM types:")
                for enum_type in enums:
                    print(f"   - {enum_type}")
                return True
            else:
                print("\n⚠️  No ENUM types found")
                return False
    except Exception as e:
        print(f"❌ Error checking ENUMs: {str(e)}")
        return False

def test_database_info():
    """Get database information"""
    try:
        with sync_engine.connect() as conn:
            # Get database name
            result = conn.execute(text("SELECT current_database()"))
            db_name = result.scalar()
            
            # Get PostgreSQL version
            result = conn.execute(text("SELECT version()"))
            version = result.scalar()
            
            print(f"\n📊 Database Information:")
            print(f"   Database Name: {db_name}")
            print(f"   PostgreSQL Version: {version.split(',')[0]}")
            return True
    except Exception as e:
        print(f"❌ Error getting database info: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Testing Database Connection")
    print("=" * 60)
    
    # Check if .env is loaded
    try:
        db_url = settings.DATABASE_URL
        if "YOUR_PASSWORD" in db_url:
            print("\n⚠️  WARNING: Database password not configured!")
            print("   Please update YOUR_PASSWORD in .env file")
            print()
    except Exception as e:
        print(f"❌ Error loading configuration: {str(e)}")
        sys.exit(1)
    
    print("\n1. Testing sync connection...")
    sync_ok = test_sync_connection()
    
    print("\n2. Testing async connection...")
    async_ok = asyncio.run(test_async_connection())
    
    if sync_ok:
        print("\n3. Getting database information...")
        test_database_info()
        
        print("\n4. Checking tables...")
        test_tables()
        
        print("\n5. Checking ENUM types...")
        test_enums()
    
    print("\n" + "=" * 60)
    if sync_ok and async_ok:
        print("✅ All database connections successful!")
        print("   Your database is ready to use.")
    else:
        print("❌ Connection failed. Please check:")
        print("   1. PostgreSQL is running")
        print("   2. Database 'alumni_portal' exists")
        print("   3. Password in .env file is correct")
        print("   4. PostgreSQL is accessible on localhost:5432")
    print("=" * 60)

