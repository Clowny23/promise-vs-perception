# backend/app/api/promises.py
#
# UPDATED: upload endpoint now does FULL analysis:
# 1. Extract promises from PDF
# 2. Classify topics
# 3. Run sentiment analysis on sample tweets for that party
# 4. Return complete results

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
import tempfile
import os
import json

from app.core.database import get_db
from app.models.promise import Promise
from app.models.post import Post
from app.services.promise_extractor import PromiseExtractor
from app.services.topic_classifier import TopicClassifier
from app.services.sentiment_service import SentimentService
from app.services.twitter_scraper import TwitterScraper
from app.core.config import settings

router = APIRouter()

# Shared instances
_extractor = None
_classifier = None
_sentiment  = None

def get_extractor():
    global _extractor
    if _extractor is None:
        _extractor = PromiseExtractor()
    return _extractor

def get_classifier():
    global _classifier
    if _classifier is None:
        _classifier = TopicClassifier()
    return _classifier

def get_sentiment():
    global _sentiment
    if _sentiment is None:
        _sentiment = SentimentService()
    return _sentiment


class PromiseResponse(BaseModel):
    id: int
    party: str
    text: str
    topic: Optional[str]
    topic_confidence: Optional[float]
    source_file: Optional[str]
    page_number: Optional[int]
    manifesto_year: Optional[int]

    class Config:
        from_attributes = True


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/promises", response_model=List[PromiseResponse])
def get_promises(
    party:  Optional[str] = Query(None),
    topic:  Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit:  int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Promise).filter(Promise.is_valid_promise == True)
    if party:
        query = query.filter(Promise.party == party.upper())
    if topic:
        query = query.filter(Promise.topic == topic)
    if search:
        query = query.filter(Promise.text.ilike(f"%{search}%"))
    return query.offset(offset).limit(limit).all()


@router.get("/promises/stats")
def get_promise_stats(
    party: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    base = db.query(Promise).filter(Promise.is_valid_promise == True)
    if party:
        base = base.filter(Promise.party == party.upper())

    total = base.count()

    party_counts = (
        db.query(Promise.party, func.count(Promise.id).label("count"))
        .filter(Promise.is_valid_promise == True)
        .group_by(Promise.party).all()
    )

    topic_q = (
        db.query(Promise.topic, func.count(Promise.id).label("count"))
        .filter(Promise.is_valid_promise == True, Promise.topic.isnot(None))
    )
    if party:
        topic_q = topic_q.filter(Promise.party == party.upper())
    topic_counts = topic_q.group_by(Promise.topic).all()

    return {
        "total_promises": total,
        "by_party": {row.party: row.count for row in party_counts},
        "by_topic": {row.topic: row.count for row in topic_counts if row.topic}
    }


@router.get("/promises/{promise_id}", response_model=PromiseResponse)
def get_promise(promise_id: int, db: Session = Depends(get_db)):
    promise = db.query(Promise).filter(Promise.id == promise_id).first()
    if not promise:
        raise HTTPException(status_code=404, detail=f"Promise {promise_id} not found")
    return promise


@router.post("/promises/upload-manifesto")
async def upload_manifesto(
    file:  UploadFile = File(...),
    party: str = Query(..., description="Party name e.g. DMK"),
    year:  int = Query(2024),
    db: Session = Depends(get_db)
):
    """
    Full pipeline upload:
    1. Read PDF and extract promise sentences
    2. Classify each promise into a topic
    3. Save promises to database
    4. Generate sample tweets for the party
    5. Run sentiment analysis on tweets
    6. Save sentiment results
    7. Return complete analysis summary
    """

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")

    party = party.upper()

    # Save uploaded PDF to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        extractor  = get_extractor()
        classifier = get_classifier()
        sentiment_svc = get_sentiment()

        # ================================================================
        # STEP 1: Extract promises from PDF
        # ================================================================
        raw_promises = extractor.extract_from_pdf(tmp_path, party, year)

        if not raw_promises:
            return {
                "message": "No promises found in the PDF. The PDF may be image-based or not in English.",
                "party": party,
                "manifesto_year": year,
                "promises_found": 0,
                "promises_saved": 0,
                "sentiment_summary": None,
                "topic_distribution": {},
                "sample_promises": []
            }

        # ================================================================
        # STEP 2: Classify topics
        # ================================================================
        texts = [p["text"] for p in raw_promises]
        topic_results = classifier.classify_batch(texts)

        # ================================================================
        # STEP 3: Save promises to database
        # ================================================================
        # Delete old promises for this party + year first
        db.query(Promise).filter(
            Promise.party == party,
            Promise.manifesto_year == year
        ).delete()
        db.commit()

        saved_promises = []
        for promise_data, topic_result in zip(raw_promises, topic_results):
            promise = Promise(
                party=party,
                text=promise_data["text"],
                topic=topic_result["topic"],
                topic_confidence=topic_result["confidence"],
                source_file=file.filename,
                page_number=promise_data.get("page_number"),
                manifesto_year=year,
                is_valid_promise=True
            )
            db.add(promise)
            saved_promises.append({
                "text": promise_data["text"],
                "topic": topic_result["topic"],
                "confidence": topic_result["confidence"],
                "page": promise_data.get("page_number")
            })

        db.commit()

        # ================================================================
        # STEP 4: Generate tweets and run sentiment analysis
        # ================================================================
        scraper = TwitterScraper()
        tweets = scraper.generate_sample_data(party, count=100)

        tweet_texts = [t["text"] for t in tweets if t.get("text")]
        sentiment_results = sentiment_svc.analyze_batch(tweet_texts, batch_size=16)

        # ================================================================
        # STEP 5: Save sentiment results
        # ================================================================
        # Clear old posts for this party
        from sqlalchemy import text as sqla_text
        db.execute(sqla_text("DELETE FROM posts WHERE party = :p"), {"p": party})
        db.commit()

        from datetime import datetime
        for tweet, sentiment in zip(tweets, sentiment_results):
            post = Post(
                party=party,
                text=tweet.get("text", ""),
                tweet_id=None,
                username=tweet.get("username", ""),
                tweet_date=datetime(2024, 3, 1),
                likes_count=int(tweet.get("likes_count", 0) or 0),
                sentiment_label=sentiment["label"],
                sentiment_score=sentiment["score"],
                sentiment_raw=json.dumps(sentiment["all_scores"])
            )
            db.add(post)

        db.commit()

        # ================================================================
        # STEP 6: Build summary response
        # ================================================================
        from collections import Counter

        # Topic distribution
        topic_dist = Counter(t["topic"] for t in topic_results)

        # Sentiment summary
        sentiment_labels = [s["label"] for s in sentiment_results]
        sentiment_counts = Counter(sentiment_labels)
        total_tweets = len(sentiment_results)

        sentiment_summary = {
            "total": total_tweets,
            "Positive": {
                "count": sentiment_counts.get("Positive", 0),
                "percentage": round(sentiment_counts.get("Positive", 0) / total_tweets * 100, 1)
            },
            "Neutral": {
                "count": sentiment_counts.get("Neutral", 0),
                "percentage": round(sentiment_counts.get("Neutral", 0) / total_tweets * 100, 1)
            },
            "Negative": {
                "count": sentiment_counts.get("Negative", 0),
                "percentage": round(sentiment_counts.get("Negative", 0) / total_tweets * 100, 1)
            },
            "dominant": max(sentiment_counts, key=sentiment_counts.get)
        }

        # Sample promises (first 5)
        sample_promises = saved_promises[:5]

        # Sample tweets with sentiment (3 of each type)
        sample_tweets = []
        for label in ["Positive", "Neutral", "Negative"]:
            matches = [
                {"text": t["text"], "sentiment": s["label"], "score": round(s["score"] * 100)}
                for t, s in zip(tweets, sentiment_results)
                if s["label"] == label
            ][:3]
            sample_tweets.extend(matches)

        return {
            "message": "Full analysis complete",
            "party": party,
            "manifesto_year": year,
            "file_name": file.filename,
            "promises_found": len(raw_promises),
            "promises_saved": len(raw_promises),
            "topic_distribution": dict(topic_dist),
            "sentiment_summary": sentiment_summary,
            "sample_promises": sample_promises,
            "sample_tweets": sample_tweets,
            "polarization_gap": round(100 - sentiment_summary["Positive"]["percentage"], 1)
        }

    finally:
        os.unlink(tmp_path)