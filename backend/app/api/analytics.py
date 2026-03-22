# backend/app/api/analytics.py
#
# WHY THIS FILE EXISTS:
# These endpoints aggregate data from multiple tables
# to power the main dashboard charts and summary cards.
# Instead of making 5 separate requests, the frontend can
# call /dashboard-summary once and get everything.

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from functools import lru_cache
import time

from app.core.database import get_db
from app.models.promise import Promise
from app.models.post import Post
from app.core.config import settings

router = APIRouter()

# Simple in-memory cache
# {cache_key: (data, timestamp)}
_cache = {}
CACHE_TTL = settings.CACHE_TTL_SECONDS


def get_cached(key: str):
    """Returns cached value if not expired, else None"""
    if key in _cache:
        data, timestamp = _cache[key]
        if time.time() - timestamp < CACHE_TTL:
            return data
    return None


def set_cached(key: str, data):
    """Stores value in cache with current timestamp"""
    _cache[key] = (data, time.time())
    return data


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/dashboard-summary")
def get_dashboard_summary(
    party: Optional[str] = Query(None, description="Filter by party (optional)"),
    db: Session = Depends(get_db)
):
    """
    Get all data needed to render the main dashboard in ONE request.

    WHY ONE ENDPOINT:
    If the frontend made 5 separate API calls for:
    - promise counts
    - topic distribution
    - sentiment breakdown
    - comparison data
    - recent posts
    ...there'd be 5 network round trips. This combines them into 1.

    Returns:
    {
        "promise_stats": {...},
        "topic_distribution": {...},
        "sentiment_summary": {...},
        "party_comparison": {...},
        "recent_promises": [...]
    }
    """
    cache_key = f"dashboard_{party}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    filter_party = party.upper() if party else None

    # --- Promise Stats ---
    promise_query = db.query(Promise).filter(Promise.is_valid_promise == True)
    if filter_party:
        promise_query = promise_query.filter(Promise.party == filter_party)

    total_promises = promise_query.count()

    # By party
    party_promise_counts = {}
    for p in settings.PARTIES:
        count = (
            db.query(Promise)
            .filter(Promise.party == p, Promise.is_valid_promise == True)
            .count()
        )
        party_promise_counts[p] = count

    # By topic
    topic_query = (
        db.query(Promise.topic, func.count(Promise.id).label("count"))
        .filter(Promise.is_valid_promise == True, Promise.topic.isnot(None))
    )
    if filter_party:
        topic_query = topic_query.filter(Promise.party == filter_party)
    topic_rows = topic_query.group_by(Promise.topic).all()
    topic_counts = {row.topic: row.count for row in topic_rows}

    # Ensure all topics appear (with 0 if no promises)
    topic_distribution = {topic: topic_counts.get(topic, 0) for topic in settings.TOPICS}

    # --- Sentiment Summary ---
    sentiment_query = (
        db.query(Post.sentiment_label, func.count(Post.id).label("count"))
        .filter(Post.sentiment_label.isnot(None))
    )
    if filter_party:
        sentiment_query = sentiment_query.filter(Post.party == filter_party)

    sentiment_rows = sentiment_query.group_by(Post.sentiment_label).all()
    total_posts = sum(row.count for row in sentiment_rows)

    sentiment_summary = {}
    for label in settings.SENTIMENT_LABELS:
        count = next((row.count for row in sentiment_rows if row.sentiment_label == label), 0)
        sentiment_summary[label] = {
            "count": count,
            "percentage": round((count / total_posts * 100), 1) if total_posts > 0 else 0.0
        }

    # --- Party Comparison (sentiment side by side) ---
    party_comparison = {}
    for p in settings.PARTIES:
        p_rows = (
            db.query(Post.sentiment_label, func.count(Post.id).label("count"))
            .filter(Post.party == p, Post.sentiment_label.isnot(None))
            .group_by(Post.sentiment_label)
            .all()
        )
        p_total = sum(row.count for row in p_rows)
        party_comparison[p] = {
            "total_posts": p_total,
            "Positive": round(next((r.count for r in p_rows if r.sentiment_label == "Positive"), 0) / p_total * 100, 1) if p_total else 0,
            "Neutral": round(next((r.count for r in p_rows if r.sentiment_label == "Neutral"), 0) / p_total * 100, 1) if p_total else 0,
            "Negative": round(next((r.count for r in p_rows if r.sentiment_label == "Negative"), 0) / p_total * 100, 1) if p_total else 0,
        }

    # --- Recent Promises (for the list view) ---
    recent_q = db.query(Promise).filter(Promise.is_valid_promise == True)
    if filter_party:
        recent_q = recent_q.filter(Promise.party == filter_party)
    recent_promises = [p.to_dict() for p in recent_q.order_by(Promise.id.desc()).limit(10).all()]

    # --- Compile result ---
    result = {
        "promise_stats": {
            "total": total_promises,
            "by_party": party_promise_counts
        },
        "topic_distribution": topic_distribution,
        "sentiment_summary": sentiment_summary,
        "total_posts": total_posts,
        "party_comparison": party_comparison,
        "recent_promises": recent_promises,
        "parties": settings.PARTIES,
        "topics": settings.TOPICS
    }

    return set_cached(cache_key, result)


@router.get("/polarization-score")
def get_polarization_score(db: Session = Depends(get_db)):
    """
    Calculate a "Promise-Perception Gap" score for each party.

    HOW IT WORKS:
    - We calculate a "positivity ratio" from promises
      (all promises are implicitly positive — parties promise good things)
    - We calculate a "public sentiment ratio" from tweets
    - The GAP between these two shows the promise-perception gap

    GAP = 100% (implied promise positivity) - actual_positive_sentiment%

    A high gap = party promises a lot but public isn't convinced.
    A low gap = public sentiment matches the promises.

    This is the core academic contribution of your project!
    """
    result = {}

    for party in settings.PARTIES:
        # Promises: count how many per topic
        promise_count = (
            db.query(func.count(Promise.id))
            .filter(Promise.party == party, Promise.is_valid_promise == True)
            .scalar() or 0
        )

        # Posts: get sentiment breakdown
        post_rows = (
            db.query(Post.sentiment_label, func.count(Post.id).label("count"))
            .filter(Post.party == party, Post.sentiment_label.isnot(None))
            .group_by(Post.sentiment_label)
            .all()
        )
        total_posts = sum(row.count for row in post_rows)
        positive_posts = next(
            (row.count for row in post_rows if row.sentiment_label == "Positive"), 0
        )

        # Positive sentiment percentage
        positive_pct = round((positive_posts / total_posts * 100), 1) if total_posts > 0 else 0

        # Gap score: 100 - positive_sentiment
        # (Parties always promise positively, so gap = how much public disagrees)
        gap_score = round(100 - positive_pct, 1)

        result[party] = {
            "promise_count": promise_count,
            "total_posts_analyzed": total_posts,
            "public_positive_sentiment": positive_pct,
            "polarization_gap_score": gap_score,
            "interpretation": (
                "High polarization" if gap_score > 60
                else "Moderate polarization" if gap_score > 40
                else "Low polarization"
            )
        }

    return {
        "scores": result,
        "explanation": (
            "Gap score = how far public sentiment is from what parties promise. "
            "100 = complete distrust, 0 = complete trust."
        )
    }