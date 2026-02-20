# @file Shared Database Base Class
# @author The Engineer
# @description The Common Ancestor for all SQLAlchemy models.
#              UPDATED: Removed explicit model imports to fix Circular Dependency.

from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    """
    The shared registry for all database models.
    All Domain Models and Kernel Models must inherit from this.
    """
    pass

# --- NOTE ON MIGRATIONS ---
# Alembic's env.py handles the discovery of models dynamically.
# We do NOT need to import them here. Doing so causes circular imports
# because models need to import 'Base' from this file first.

