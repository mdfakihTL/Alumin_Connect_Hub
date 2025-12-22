"""
Add missing status column to fundraisers table
"""
from app.core.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_missing_columns():
    """Add missing columns to fundraisers table"""
    
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE fundraisers ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'"))
            conn.commit()
            logger.info("✅ Added status column to fundraisers table")
        except Exception as e:
            logger.error(f"Error: {e}")
        
        # Verify columns
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'fundraisers'"))
        cols = [r[0] for r in result.fetchall()]
        logger.info(f"Fundraisers columns: {cols}")

if __name__ == "__main__":
    add_missing_columns()

