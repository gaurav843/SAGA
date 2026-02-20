# @file Migration Template
# @description The template used by Alembic when generating new migration files.

"""empty message

Revision ID: 1746411b8288
Revises: 
Create Date: 2026-02-09 23:20:25.750927

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1746411b8288'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass


