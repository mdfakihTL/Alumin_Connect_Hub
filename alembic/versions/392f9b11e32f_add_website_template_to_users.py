"""add_website_template_to_users

Revision ID: 392f9b11e32f
Revises: 002_update_roles
Create Date: 2025-12-11 02:22:34.824559

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '392f9b11e32f'
down_revision = '002_update_roles'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add website_template column to users table
    op.add_column('users', sa.Column('website_template', sa.String(length=100), nullable=True))


def downgrade() -> None:
    # Remove website_template column from users table
    op.drop_column('users', 'website_template')


