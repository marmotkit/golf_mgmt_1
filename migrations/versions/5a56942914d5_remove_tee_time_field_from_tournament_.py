"""Remove tee_time field from Tournament model

Revision ID: 5a56942914d5
Revises: d7561f790e9e
Create Date: 2025-01-10 00:24:40.485968

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5a56942914d5'
down_revision = 'd7561f790e9e'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('tournament', 'tee_time')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('tournament', sa.Column('tee_time', sa.VARCHAR(length=10), nullable=True))
    # ### end Alembic commands ###
