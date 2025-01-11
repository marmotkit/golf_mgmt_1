"""add announcements table

Revision ID: 46cd9ed55557
Revises: fafdef862d27
Create Date: 2025-01-10 21:56:39.223574

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '46cd9ed55557'
down_revision = 'fafdef862d27'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('announcements',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('announcements')
    # ### end Alembic commands ###
