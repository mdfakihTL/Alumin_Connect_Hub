"""Update user roles

Revision ID: 002_update_roles
Revises: 001_initial
Create Date: 2024-12-09 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_update_roles'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create new enum with updated roles
    op.execute("""
        CREATE TYPE userrole_new AS ENUM (
            'SUPER_ADMIN',
            'UNIVERSITY_ADMIN',
            'ALUMNI',
            'GUEST'
        )
    """)
    
    # Alter column to use new enum with data conversion
    op.execute("""
        ALTER TABLE users 
        ALTER COLUMN role TYPE userrole_new 
        USING CASE 
            WHEN role::text = 'admin' THEN 'SUPER_ADMIN'::userrole_new
            WHEN role::text = 'moderator' THEN 'UNIVERSITY_ADMIN'::userrole_new
            WHEN role::text = 'alumni' THEN 'ALUMNI'::userrole_new
            ELSE 'GUEST'::userrole_new
        END
    """)
    
    # Drop old enum and rename new one
    op.execute("DROP TYPE userrole")
    op.execute("ALTER TYPE userrole_new RENAME TO userrole")


def downgrade() -> None:
    # Create old enum
    op.execute("""
        CREATE TYPE userrole_old AS ENUM (
            'ADMIN',
            'ALUMNI',
            'MODERATOR',
            'GUEST'
        )
    """)
    
    # Convert data and change column type
    op.execute("""
        ALTER TABLE users 
        ALTER COLUMN role TYPE userrole_old 
        USING CASE 
            WHEN role::text = 'SUPER_ADMIN' THEN 'ADMIN'::userrole_old
            WHEN role::text = 'UNIVERSITY_ADMIN' THEN 'MODERATOR'::userrole_old
            WHEN role::text = 'ALUMNI' THEN 'ALUMNI'::userrole_old
            ELSE 'GUEST'::userrole_old
        END
    """)
    
    # Drop new enum and rename old one
    op.execute("DROP TYPE userrole")
    op.execute("ALTER TYPE userrole_old RENAME TO userrole")

