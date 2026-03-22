# backend/app/api/posts.py
#
# WHY THIS FILE EXISTS:
# Endpoints for managing tweet posts and sentiment data.
# The frontend calls these to display sentiment charts.

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from pydantic import BaseModel

from app.core.database import get_db
from app.models.post import Post
from app.core.config import settings

router = APIRouter()


class PostResponse(BaseModel):
    """What a post looks like in API responses"""
    id: int
    party: str
    text: str
    sentiment_label: Optional[str]
    sentiment_score: Optional[float]
    tweet_date: Optional[str]
    likes_count: Optional[int]

    class Config:
        from_attributes = True


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/posts", response_model=List[PostResponse])
def get_posts(
    party: Optional[str] = Query(None, description="Filter by party"),
    sentiment: Optional[str] = Query(None, description="Filter: Positive, Neutral, Negative"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    List posts with optional filters.

    Examples:
    - GET /api/v1/posts?party=DMK → DMK posts
    - GET /api/v1/posts?sentiment=Negative → only negative posts
    - GET /api/v1/posts?party=AIADMK&sentiment=Positive → AIADMK positive posts
    """
    query = db.query(Post)

    if party:
        query = query.filter(Post.party == party.upper())

    if sentiment:
        if sentiment not in settings.SENTIMENT_LABELS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid sentiment. Choose from: {settings.SENTIMENT_LABELS}"
            )
        query = query.filter(Post.sentiment_label == sentiment)

    posts = query.offset(offset).limit(limit).all()
    return posts


@router.get("/sentiment/summary")
def get_sentiment_summary(
    party: Optional[str] = Query(None, description="Filter by party"),
    db: Session = Depends(get_db)
):
    """
    Get sentiment breakdown (counts and percentages).

    Returns:
    {
        "total": 500,
        "Positive": {"count": 200, "percentage": 40.0},
        "Neutral":  {"count": 150, "percentage": 30.0},
        "Negative": {"count": 150, "percentage": 30.0}
    }

    This powers the pie chart on the dashboard.
    """
    query = db.query(
        Post.sentiment_label,
        func.count(Post.id).label("count")
    ).filter(Post.sentiment_label.isnot(None))

    if party:
        query = query.filter(Post.party == party.upper())

    results = query.group_by(Post.sentiment_label).all()

    total = sum(row.count for row in results)

    if total == 0:
        return {
            "total": 0,
            "party": party,
            "Positive": {"count": 0, "percentage": 0.0},
            "Neutral": {"count": 0, "percentage": 0.0},
            "Negative": {"count": 0, "percentage": 0.0}
        }

    summary = {
        "total": total,
        "party": party
    }

    for label in settings.SENTIMENT_LABELS:
        count = next((row.count for row in results if row.sentiment_label == label), 0)
        summary[label] = {
            "count": count,
            "percentage": round((count / total) * 100, 1)
        }

    return summary


@router.get("/sentiment/comparison")
def get_sentiment_comparison(db: Session = Depends(get_db)):
    """
    Get sentiment breakdown for ALL parties side-by-side.

    Returns:
    {
        "DMK": {"Positive": 45.2, "Neutral": 30.1, "Negative": 24.7},
        "AIADMK": {"Positive": 38.0, "Neutral": 35.0, "Negative": 27.0}
    }

    This powers the comparison bar chart on the dashboard.
    """
    result = {}

    for party in settings.PARTIES:
        counts_query = (
            db.query(Post.sentiment_label, func.count(Post.id).label("count"))
            .filter(Post.party == party)
            .filter(Post.sentiment_label.isnot(None))
            .group_by(Post.sentiment_label)
            .all()
        )

        total = sum(row.count for row in counts_query)

        if total == 0:
            result[party] = {"Positive": 0.0, "Neutral": 0.0, "Negative": 0.0, "total": 0}
            continue

        party_result = {"total": total}
        for label in settings.SENTIMENT_LABELS:
            count = next((row.count for row in counts_query if row.sentiment_label == label), 0)
            party_result[label] = round((count / total) * 100, 1)

        result[party] = party_result

    return result


@router.get("/sentiment/by-topic")
def get_sentiment_by_topic(
    party: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get sentiment breakdown grouped by topic.
    Useful for seeing which policy areas get positive/negative reactions.
    """
    query = (
        db.query(
            Post.related_topic,
            Post.sentiment_label,
            func.count(Post.id).label("count")
        )
        .filter(Post.sentiment_label.isnot(None))
        .filter(Post.related_topic.isnot(None))
    )

    if party:
        query = query.filter(Post.party == party.upper())

    results = query.group_by(Post.related_topic, Post.sentiment_label).all()

    # Restructure into topic → sentiment → count
    topic_data = {}
    for row in results:
        topic = row.related_topic
        if topic not in topic_data:
            topic_data[topic] = {"Positive": 0, "Neutral": 0, "Negative": 0}
        topic_data[topic][row.sentiment_label] = row.count

    return topic_data