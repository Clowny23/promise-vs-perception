# backend/app/models/post.py
#
# WHY THIS FILE EXISTS:
# This defines the "posts" table — storing tweets about each party.
# Each row = one tweet with its sentiment analysis result.
#
# We store raw tweet text + the AI's sentiment prediction.
# This lets us re-analyze later without re-scraping.

from sqlalchemy import Column, Integer, String, Text, Float, DateTime, BigInteger
from sqlalchemy.sql import func
from app.core.database import Base


class Post(Base):
    """
    Represents a single tweet/post about a political party.

    Example row:
        id=1, party="DMK", text="DMK's education policy is excellent!",
        sentiment_label="Positive", sentiment_score=0.92,
        tweet_date="2024-03-15"
    """

    __tablename__ = "posts"

    # --- Primary Key ---
    id = Column(Integer, primary_key=True, index=True)

    # --- Party ---
    # Which party this tweet is discussing
    party = Column(String(50), nullable=False, index=True)

    # --- Tweet Content ---
    text = Column(Text, nullable=False)

    # --- Tweet Metadata ---
    # The original tweet ID from Twitter (BigInteger — tweet IDs are huge numbers)
    tweet_id = Column(BigInteger, nullable=True, unique=True)

    # Twitter handle of the person who tweeted
    username = Column(String(100), nullable=True)

    # When the original tweet was posted
    tweet_date = Column(DateTime(timezone=True), nullable=True)

    # Number of likes on the tweet (optional — useful for weighting)
    likes_count = Column(Integer, nullable=True, default=0)

    # --- Sentiment Analysis Results ---
    # The model's prediction: "Positive", "Neutral", or "Negative"
    sentiment_label = Column(String(20), nullable=True, index=True)

    # How confident the model was (0.0 to 1.0)
    # Higher = more certain. e.g. 0.95 = very sure it's Positive
    sentiment_score = Column(Float, nullable=True)

    # Raw scores for all three classes (stored as JSON string)
    # e.g. '{"Positive": 0.9, "Neutral": 0.07, "Negative": 0.03}'
    sentiment_raw = Column(Text, nullable=True)

    # --- Topic Link (Optional) ---
    # If this tweet is clearly about a specific topic
    related_topic = Column(String(50), nullable=True)

    # --- Timestamps ---
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Post id={self.id} party={self.party} sentiment={self.sentiment_label}>"

    def to_dict(self):
        return {
            "id": self.id,
            "party": self.party,
            "text": self.text,
            "tweet_id": self.tweet_id,
            "username": self.username,
            "tweet_date": str(self.tweet_date) if self.tweet_date else None,
            "likes_count": self.likes_count,
            "sentiment_label": self.sentiment_label,
            "sentiment_score": self.sentiment_score,
            "related_topic": self.related_topic,
            "created_at": str(self.created_at),
        }