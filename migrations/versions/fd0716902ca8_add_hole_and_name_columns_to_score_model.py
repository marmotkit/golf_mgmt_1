"""add hole and name columns to score model

Revision ID: fd0716902ca8
Revises: 46cd9ed55557
Create Date: 2024-03-17 22:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fd0716902ca8'
down_revision = '46cd9ed55557'
branch_labels = None
depends_on = None


def upgrade():
    # 創建新表
    op.create_table('score_new',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tournament_id', sa.Integer(), nullable=False),
        sa.Column('member_number', sa.String(length=32), nullable=False),
        sa.Column('hole', sa.String(length=100), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=True),
        sa.Column('rank', sa.Integer(), nullable=True),
        sa.Column('gross_score', sa.Integer(), nullable=True),
        sa.Column('previous_handicap', sa.Float(), nullable=True),
        sa.Column('handicap_change', sa.Float(), nullable=True),
        sa.Column('new_handicap', sa.Float(), nullable=True),
        sa.Column('points', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['tournament_id'], ['tournament.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # 複製數據
    op.execute('''
        INSERT INTO score_new (
            id, tournament_id, member_number, gross_score,
            previous_handicap, handicap_change, new_handicap,
            points, created_at, updated_at
        )
        SELECT 
            id, tournament_id, member_number, gross_score,
            previous_handicap, handicap_change, new_handicap,
            points, created_at, updated_at
        FROM score
    ''')

    # 刪除舊表
    op.drop_table('score')

    # 重命名新表
    op.rename_table('score_new', 'score')


def downgrade():
    # 創建舊表
    op.create_table('score_old',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tournament_id', sa.Integer(), nullable=False),
        sa.Column('member_id', sa.Integer(), nullable=False),
        sa.Column('member_number', sa.String(length=4), nullable=True),
        sa.Column('full_name', sa.String(length=128), nullable=True),
        sa.Column('chinese_name', sa.String(length=64), nullable=True),
        sa.Column('net_rank', sa.Integer(), nullable=True),
        sa.Column('gross_score', sa.Integer(), nullable=True),
        sa.Column('previous_handicap', sa.Float(), nullable=True),
        sa.Column('net_score', sa.Float(), nullable=True),
        sa.Column('handicap_change', sa.Float(), nullable=True),
        sa.Column('new_handicap', sa.Float(), nullable=True),
        sa.Column('points', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['member_id'], ['member.id'], ),
        sa.ForeignKeyConstraint(['tournament_id'], ['tournament.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # 複製數據
    op.execute('''
        INSERT INTO score_old (
            id, tournament_id, member_number, gross_score,
            previous_handicap, handicap_change, new_handicap,
            points, created_at, updated_at
        )
        SELECT 
            id, tournament_id, member_number, gross_score,
            previous_handicap, handicap_change, new_handicap,
            points, created_at, updated_at
        FROM score
    ''')

    # 刪除新表
    op.drop_table('score')

    # 重命名舊表
    op.rename_table('score_old', 'score')
