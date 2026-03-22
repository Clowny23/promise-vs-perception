# backend/app/main.py
#
# WHY THIS FILE EXISTS:
# This is the entry point of the FastAPI backend.
# It creates the app, registers all routes, sets up CORS,
# and connects everything together.
#
# WHAT IS FastAPI:
# FastAPI is a modern Python web framework that:
# - Creates URL endpoints automatically from Python functions
# - Validates request data automatically (using Pydantic)
# - Generates interactive API documentation at /docs
# - Is very fast (based on Starlette + Pydantic)
#
# TO RUN:
# uvicorn app.main:app --reload
# Then open: http://localhost:8000/docs

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import create_tables
from app.api import promises, posts, analytics

# Configure logging — shows INFO level messages in the terminal
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


# --- LIFESPAN ---
# Code that runs ONCE when the server starts and ONCE when it stops
# (Modern replacement for @app.on_event("startup"))
@asynccontextmanager
async def lifespan(app: FastAPI):
    # === STARTUP ===
    logger.info("Starting Promise vs Perception API...")

    # Create database tables (if they don't exist yet)
    # This is safe to call multiple times — CREATE TABLE IF NOT EXISTS
    create_tables()
    logger.info("Database tables ready")

    yield  # ← Server runs here

    # === SHUTDOWN ===
    logger.info("Shutting down...")


# --- CREATE APP ---
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## Promise vs Perception API

    Analyzes the gap between political promises and public perception.

    ### Parties
    - **DMK** (Dravida Munnetra Kazhagam)
    - **AIADMK** (All India Anna Dravida Munnetra Kazhagam)

    ### Features
    - Extract promises from manifestos
    - Classify promises by topic (Economy, Jobs, Education, etc.)
    - Sentiment analysis of public tweets
    - Comparative analytics between parties
    """,
    docs_url="/docs",        # Swagger UI — interactive API tester
    redoc_url="/redoc",      # Alternative docs UI
    lifespan=lifespan
)


# --- CORS MIDDLEWARE ---
# CORS = Cross-Origin Resource Sharing
# PROBLEM: By default, browsers block requests from one domain (localhost:5173)
#          to another (localhost:8000). This is a security feature.
# SOLUTION: Tell the backend to allow requests from our React frontend.
#
# In production: change ALLOWED_ORIGINS to your Vercel URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


# --- INCLUDE ROUTERS ---
# Each router handles a group of related endpoints
# prefix="/api/v1" means all URLs start with /api/v1/
# tags= groups them in the /docs page
app.include_router(
    promises.router,
    prefix="/api/v1",
    tags=["Promises"]
)
app.include_router(
    posts.router,
    prefix="/api/v1",
    tags=["Posts & Sentiment"]
)
app.include_router(
    analytics.router,
    prefix="/api/v1",
    tags=["Analytics"]
)


# --- ROOT ENDPOINT ---
@app.get("/", tags=["Health"])
def root():
    """Health check — confirms the API is running"""
    return {
        "message": "Promise vs Perception API is running! 🗳️",
        "docs": "/docs",
        "version": settings.APP_VERSION
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Detailed health check for deployment monitoring"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV
    }