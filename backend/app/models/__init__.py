# backend/app/models/__init__.py
# Makes 'models' a Python package.
# Importing both models here ensures SQLAlchemy sees them
# when create_tables() is called.

from app.models.promise import Promise
from app.models.post import Post

__all__ = ["Promise", "Post"]