"""add_university_model_and_associate_with_users

Revision ID: 2b88741310f6
Revises: 392f9b11e32f
Create Date: 2025-12-11 02:35:39.930491

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2b88741310f6'
down_revision = '392f9b11e32f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create universities table
    op.create_table(
        'universities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=True),
        sa.Column('website_template', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_universities_name'), 'universities', ['name'], unique=True)
    op.create_index(op.f('ix_universities_code'), 'universities', ['code'], unique=True)
    
    # Add university_id to users table
    op.add_column('users', sa.Column('university_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_users_university', 'users', 'universities',
        ['university_id'], ['id'], ondelete='SET NULL'
    )
    op.create_index(op.f('ix_users_university_id'), 'users', ['university_id'], unique=False)
    
    # Remove website_template from users (moved to universities)
    op.drop_column('users', 'website_template')


def downgrade() -> None:
    # Add website_template back to users
    op.add_column('users', sa.Column('website_template', sa.String(length=100), nullable=True))
    
    # Remove university_id from users
    op.drop_constraint('fk_users_university', 'users', type_='foreignkey')
    op.drop_index(op.f('ix_users_university_id'), table_name='users')
    op.drop_column('users', 'university_id')
    
    # Drop universities table
    op.drop_index(op.f('ix_universities_code'), table_name='universities')
    op.drop_index(op.f('ix_universities_name'), table_name='universities')
    op.drop_table('universities')


