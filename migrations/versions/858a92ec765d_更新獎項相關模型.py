"""更新獎項相關模型

Revision ID: 858a92ec765d
Revises: fc088d678059
Create Date: 2025-02-12 20:48:49.795719

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '858a92ec765d'
down_revision = 'fc088d678059'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('award_types', schema=None) as batch_op:
        batch_op.alter_column('name',
               existing_type=sa.VARCHAR(length=50),
               type_=sa.String(length=100),
               existing_nullable=False)
        batch_op.drop_constraint('award_types_name_key', type_='unique')
        batch_op.drop_column('has_category')

    with op.batch_alter_table('score', schema=None) as batch_op:
        batch_op.alter_column('previous_handicap',
               existing_type=sa.REAL(),
               type_=sa.Float(precision=2),
               existing_nullable=True)
        batch_op.alter_column('net_score',
               existing_type=sa.REAL(),
               type_=sa.Float(precision=2),
               existing_nullable=True)
        batch_op.alter_column('handicap_change',
               existing_type=sa.REAL(),
               type_=sa.Float(precision=2),
               existing_nullable=True)
        batch_op.alter_column('new_handicap',
               existing_type=sa.REAL(),
               type_=sa.Float(precision=2),
               existing_nullable=True)

    with op.batch_alter_table('tournament_awards', schema=None) as batch_op:
        batch_op.add_column(sa.Column('award_type_id', sa.Integer(), nullable=False))
        batch_op.add_column(sa.Column('member_number', sa.String(length=32), nullable=True))
        batch_op.add_column(sa.Column('chinese_name', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('remarks', sa.Text(), nullable=True))
        batch_op.create_foreign_key(None, 'award_types', ['award_type_id'], ['id'])
        batch_op.drop_column('award_type')
        batch_op.drop_column('category')
        batch_op.drop_column('description')
        batch_op.drop_column('winner_name')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('tournament_awards', schema=None) as batch_op:
        batch_op.add_column(sa.Column('winner_name', sa.VARCHAR(length=100), autoincrement=False, nullable=False))
        batch_op.add_column(sa.Column('description', sa.TEXT(), autoincrement=False, nullable=True))
        batch_op.add_column(sa.Column('category', sa.VARCHAR(length=50), autoincrement=False, nullable=True))
        batch_op.add_column(sa.Column('award_type', sa.VARCHAR(length=50), autoincrement=False, nullable=False))
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.drop_column('remarks')
        batch_op.drop_column('chinese_name')
        batch_op.drop_column('member_number')
        batch_op.drop_column('award_type_id')

    with op.batch_alter_table('score', schema=None) as batch_op:
        batch_op.alter_column('new_handicap',
               existing_type=sa.Float(precision=2),
               type_=sa.REAL(),
               existing_nullable=True)
        batch_op.alter_column('handicap_change',
               existing_type=sa.Float(precision=2),
               type_=sa.REAL(),
               existing_nullable=True)
        batch_op.alter_column('net_score',
               existing_type=sa.Float(precision=2),
               type_=sa.REAL(),
               existing_nullable=True)
        batch_op.alter_column('previous_handicap',
               existing_type=sa.Float(precision=2),
               type_=sa.REAL(),
               existing_nullable=True)

    with op.batch_alter_table('award_types', schema=None) as batch_op:
        batch_op.add_column(sa.Column('has_category', sa.BOOLEAN(), autoincrement=False, nullable=True))
        batch_op.create_unique_constraint('award_types_name_key', ['name'])
        batch_op.alter_column('name',
               existing_type=sa.String(length=100),
               type_=sa.VARCHAR(length=50),
               existing_nullable=False)

    # ### end Alembic commands ###
