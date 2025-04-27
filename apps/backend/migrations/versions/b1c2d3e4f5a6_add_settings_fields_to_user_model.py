"""Add settings fields and remove deprecated preferred_companies from User model

Revision ID: b1c2d3e4f5a6
Revises: 4efcf5318032
Create Date: 2025-06-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b1c2d3e4f5a6'
down_revision = '4efcf5318032'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        # remove old preferred_companies column
        batch_op.drop_column('preferred_companies')
        # add new settings fields
        batch_op.add_column(sa.Column('university', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('about_me', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('openai_api_key', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('archive_duration', sa.String(), nullable=False, server_default='A Month'))
        batch_op.add_column(sa.Column('delete_duration', sa.String(), nullable=False, server_default='A Month'))


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        # drop the new settings fields
        batch_op.drop_column('delete_duration')
        batch_op.drop_column('archive_duration')
        batch_op.drop_column('openai_api_key')
        batch_op.drop_column('about_me')
        batch_op.drop_column('university')
        # restore the deprecated column
        batch_op.add_column(sa.Column('preferred_companies', sa.String(), nullable=True)) 