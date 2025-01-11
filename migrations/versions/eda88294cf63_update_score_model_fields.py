"""update score model fields

Revision ID: eda88294cf63
Revises: ff12bb2adf88
Create Date: 2025-01-10 22:52:10.707722

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'eda88294cf63'
down_revision = 'ff12bb2adf88'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('score', sa.Column('full_name', sa.String(length=128), nullable=True))
    op.add_column('score', sa.Column('chinese_name', sa.String(length=64), nullable=True))
    op.drop_column('score', 'hole')
    op.drop_column('score', 'name')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('score', sa.Column('name', sa.VARCHAR(length=100), nullable=True))
    op.add_column('score', sa.Column('hole', sa.VARCHAR(length=100), nullable=True))
    op.drop_column('score', 'chinese_name')
    op.drop_column('score', 'full_name')
    # ### end Alembic commands ###
