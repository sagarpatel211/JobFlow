"""add company image url

Revision ID: add_company_image_url
Revises:
Create Date: 2023-07-26 12:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "add_company_image_url"
down_revision = "a0ab748e70cf"  # updated to initial migration revision
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("companies", sa.Column("image_url", sa.String(), nullable=True))


def downgrade():
    op.drop_column("companies", "image_url")
