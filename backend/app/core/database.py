# backend/app/core/database.py
#
# WHY THIS FILE EXISTS:
# SQLAlchemy is an ORM (Object Relational Mapper).
# Instead of writing raw SQL like:
#   "SELECT * FROM promises WHERE party='DMK'"
# We write Python:
#   db.query(Promise).filter(Promise.party == "DMK").all()
#
# This file sets up the database connection and creates
# a "session" factory — think of a session as a single
# conversation with the database.

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# --- Engine ---
# The engine is the actual connection to PostgreSQL
# "pool_pre_ping=True" checks if connection is alive before using it
# This prevents "connection closed" errors on long-running servers
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    # For SQLite (dev fallback): allow multiple threads
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

# --- Session Factory ---
# SessionLocal() creates a new database session each time it's called
# autocommit=False: we manually commit transactions (safer)
# autoflush=False: don't auto-save to DB — we control when
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# --- Base ---
# All our model classes (tables) inherit from this Base
# It keeps track of all the tables we define
Base = declarative_base()


def get_db():
    """
    FastAPI dependency — provides a database session per request.

    HOW IT WORKS:
    FastAPI calls this function for each incoming request.
    It creates a session, gives it to the route handler,
    and automatically closes it when the request is done.

    USAGE in routes:
        @router.get("/promises")
        def get_promises(db: Session = Depends(get_db)):
            return db.query(Promise).all()
    """
    db = SessionLocal()
    try:
        yield db          # Give session to the route handler
    finally:
        db.close()        # Always close, even if an error occurred


def create_tables():
    """
    Creates all database tables defined in models/.
    Call this once when the app starts.
    """
    # Import models so SQLAlchemy knows about them
    from app.models import promise, post  # noqa: F401
    Base.metadata.create_all(bind=engine)