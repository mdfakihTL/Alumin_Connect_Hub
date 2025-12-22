"""
Add missing columns to user_profiles table
"""
from app.core.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_missing_columns():
    """Add missing columns to user_profiles table"""
    
    columns_to_add = [
        ("latitude", "DOUBLE PRECISION"),
        ("longitude", "DOUBLE PRECISION"),
        ("city", "VARCHAR(255)"),
        ("country", "VARCHAR(255)"),
        ("country_code", "VARCHAR(10)"),
        ("geohash", "VARCHAR(20)"),
        ("is_discoverable", "BOOLEAN DEFAULT TRUE"),
        ("show_exact_location", "BOOLEAN DEFAULT FALSE"),
    ]
    
    with engine.connect() as conn:
        for column_name, column_type in columns_to_add:
            try:
                conn.execute(text(f"ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS {column_name} {column_type}"))
                logger.info(f"✅ Added column: {column_name}")
            except Exception as e:
                logger.warning(f"⚠️ Column {column_name} might already exist or error: {e}")
        
        conn.commit()
    
    logger.info("✅ Migration complete!")

if __name__ == "__main__":
    add_missing_columns()

