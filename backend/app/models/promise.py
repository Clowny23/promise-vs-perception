# backend/app/models/promise.py
#
# WHY THIS FILE EXISTS:
# This defines the "promises" table in our database.
# Each class = one table. Each attribute = one column.
#
# A "promise" is a sentence from a party's manifesto that
# makes a future-oriented commitment (e.g. "We will build 500 new schools")
#
# SQLAlchemy maps this Python class to a PostgreSQL table automatically.

from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class Promise(Base):
    """
    Represents a single political promise extracted from a manifesto.

    Example row:
        id=1, party="DMK", text="We will provide free tablets to all students",
        topic="Education", confidence=0.87, page_number=12
    """

    __tablename__ = "promises"  # The actual table name in PostgreSQL

    # --- Primary Key ---
    # Auto-increments: 1, 2, 3, ... for each new row
    id = Column(Integer, primary_key=True, index=True)

    # --- Party Info ---
    # Which party made this promise
    # index=True means PostgreSQL creates an index for fast lookups
    party = Column(String(50), nullable=False, index=True)

    # --- Promise Content ---
    # The full sentence/paragraph from the manifesto
    text = Column(Text, nullable=False)

    # --- Topic Classification ---
    # One of: Economy, Jobs, Education, Healthcare, Welfare, Infrastructure
    topic = Column(String(50), nullable=True, index=True)

    # How confident the classifier was (0.0 to 1.0)
    topic_confidence = Column(Float, nullable=True)

    # --- Source Info ---
    # Which manifesto file this came from
    source_file = Column(String(255), nullable=True)

    # Which page number in the PDF
    page_number = Column(Integer, nullable=True)

    # Year of the manifesto (e.g. 2021, 2024)
    manifesto_year = Column(Integer, nullable=True)

    # --- Flags ---
    # True = this was validated as a real promise (not a statement of fact)
    is_valid_promise = Column(Boolean, default=True)

    # --- Timestamps ---
    # func.now() automatically sets to current time when row is created
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        """Shows a readable representation when you print a Promise object"""
        return f"<Promise id={self.id} party={self.party} topic={self.topic}>"

    def to_dict(self):
        """Converts the model to a plain dictionary (for JSON responses)"""
        return {
            "id": self.id,
            "party": self.party,
            "text": self.text,
            "topic": self.topic,
            "topic_confidence": self.topic_confidence,
            "source_file": self.source_file,
            "page_number": self.page_number,
            "manifesto_year": self.manifesto_year,
            "is_valid_promise": self.is_valid_promise,
            "created_at": str(self.created_at),
        }