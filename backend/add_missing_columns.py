"""Add missing columns to the users table"""
from app.core.database import engine
from sqlalchemy import text

def add_columns():
    with engine.connect() as conn:
        # Add force_password_reset column
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_reset BOOLEAN DEFAULT FALSE"))
            print("✅ Added force_password_reset column")
        except Exception as e:
            print(f"⚠️ force_password_reset: {e}")
        
        # Add temp_password_expires_at column
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS temp_password_expires_at TIMESTAMP"))
            print("✅ Added temp_password_expires_at column")
        except Exception as e:
            print(f"⚠️ temp_password_expires_at: {e}")
        
        # Add last_password_change column
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP"))
            print("✅ Added last_password_change column")
        except Exception as e:
            print(f"⚠️ last_password_change: {e}")
        
        conn.commit()
        print("\n✅ Migration complete!")

if __name__ == "__main__":
    add_columns()

