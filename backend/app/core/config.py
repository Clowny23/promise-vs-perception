# backend/app/core/config.py
#
# WHY THIS FILE EXISTS:
# Instead of hardcoding secrets (DB password, API keys) in code,
# we store them in a .env file and load them here.
# This way secrets are never accidentally pushed to GitHub.

import os
from dotenv import load_dotenv

# Load variables from .env file into environment
load_dotenv()

class Settings:
    """
    Central place for all configuration.
    Other files import this instead of calling os.getenv() everywhere.
    """

    # --- App ---
    APP_NAME: str = "Promise vs Perception API"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = os.getenv("APP_ENV", "development")

    # --- Database ---
    # Falls back to a local SQLite DB if PostgreSQL URL not set
    # (useful for quick testing without PostgreSQL)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./promise_perception.db"  # fallback for easy local dev
    )

    # --- CORS (Cross-Origin Resource Sharing) ---
    # Which frontend URLs are allowed to call our API
    # In dev: localhost:5173 (Vite default)
    # In prod: your Vercel URL
    ALLOWED_ORIGINS: list = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:3000"
    ).split(",")

    # --- Parties ---
    # Add more parties here if needed
    PARTIES = ["DMK", "AIADMK"]

    # --- Topics ---
    # The categories we classify promises into
    TOPICS = [
        "Economy",
        "Jobs",
        "Education",
        "Healthcare",
        "Welfare",
        "Infrastructure"
    ]

    # --- Sentiment Labels ---
    SENTIMENT_LABELS = ["Positive", "Neutral", "Negative"]

    # --- NLP Model ---
    # This pretrained model is fine-tuned for sentiment analysis
    # It runs locally — no API key needed
    SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"

    # --- Caching ---
    # How long to cache API responses (seconds)
    # 300 = 5 minutes — sentiment scores don't change often
    CACHE_TTL_SECONDS: int = 300

# Create a single global instance — import this in other files
settings = Settings()