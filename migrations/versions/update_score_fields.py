"""update score fields

Revision ID: update_score_fields
Revises: a04aeb69ee6e
Create Date: 2025-01-10 16:14:14.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'update_score_fields'
down_revision = 'a04aeb69ee6e'
branch_labels = None
depends_on = None


def upgrade():
    # 創建新表
    op.create_table(
        'score_new',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tournament_id', sa.Integer(), nullable=False),
        sa.Column('member_id', sa.Integer(), nullable=False),
        sa.Column('member_number', sa.String(4), nullable=True),
        sa.Column('full_name', sa.String(128), nullable=True),
        sa.Column('chinese_name', sa.String(64), nullable=True),
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
        INSERT INTO score_new (id, tournament_id, member_id, gross_score, 
                             net_score, new_handicap, points, created_at, updated_at)
        SELECT id, tournament_id, member_id, gross_score, 
               net_score, new_handicap, points, created_at, updated_at
        FROM score
    ''')
    
    # 刪除舊表
    op.drop_table('score')
    
    # 重命名新表
    op.rename_table('score_new', 'score')


def downgrade():
    # 創建舊表
    op.create_table(
        'score_old',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tournament_id', sa.Integer(), nullable=False),
        sa.Column('member_id', sa.Integer(), nullable=False),
        sa.Column('rank', sa.Integer(), nullable=True),
        sa.Column('gross_score', sa.Integer(), nullable=False),
        sa.Column('handicap', sa.Float(), nullable=True),
        sa.Column('net_score', sa.Float(), nullable=True),
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
        INSERT INTO score_old (id, tournament_id, member_id, gross_score,
                             net_score, new_handicap, points, created_at, updated_at)
        SELECT id, tournament_id, member_id, gross_score,
               net_score, new_handicap, points, created_at, updated_at
        FROM score
    ''')
    
    # 刪除新表
    op.drop_table('score')
    
    # 重命名舊表
    op.rename_table('score_old', 'score')
