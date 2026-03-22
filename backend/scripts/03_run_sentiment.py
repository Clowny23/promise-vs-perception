import sys
import os
import json
import logging
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.twitter_scraper import TwitterScraper
from app.services.sentiment_service import SentimentService
from app.core.database import SessionLocal, create_tables
from app.models.post import Post

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def main():
    logger.info("=" * 60)
    logger.info("STEP 3: Sentiment Analysis Pipeline")
    logger.info("=" * 60)

    create_tables()

    scraper = TwitterScraper(output_dir="../data/raw")
    sentiment_service = SentimentService()

    total_saved = 0

    for party in ["DMK", "AIADMK"]:
        logger.info(f"\nProcessing: {party}")

        tweets = scraper.load_from_csv(party)
        if not tweets:
            logger.warning(f"No tweets found for {party}. Run script 02 first.")
            continue

        logger.info(f"Loaded {len(tweets)} tweets")
        texts = [t.get("text", "") for t in tweets if t.get("text")]
        if not texts:
            continue

        logger.info("Running sentiment model (this may take 1-2 minutes)...")
        sentiment_results = sentiment_service.analyze_batch(texts, batch_size=16)

        # Open a fresh DB session for each party
        db = SessionLocal()
        try:
            # Hard delete using raw SQL — guaranteed to work
            db.execute(
                __import__('sqlalchemy').text("DELETE FROM posts WHERE party = :p"),
                {"p": party}
            )
            db.commit()
            logger.info(f"Cleared old posts for {party}")

            # Insert new posts one by one to avoid bulk constraint issues
            saved = 0
            for i, (tweet, sentiment) in enumerate(zip(tweets, sentiment_results)):
                tweet_date = None
                if tweet.get("tweet_date"):
                    try:
                        tweet_date = datetime.fromisoformat(str(tweet["tweet_date"]))
                    except Exception:
                        tweet_date = None

                post = Post(
                    party=party,
                    text=tweet.get("text", ""),
                    tweet_id=None,  # Set to None to avoid unique constraint
                    username=tweet.get("username", ""),
                    tweet_date=tweet_date,
                    likes_count=int(tweet.get("likes_count", 0) or 0),
                    sentiment_label=sentiment["label"],
                    sentiment_score=sentiment["score"],
                    sentiment_raw=json.dumps(sentiment["all_scores"])
                )
                db.add(post)
                saved += 1

            db.commit()
            total_saved += saved

            from collections import Counter
            label_counts = Counter(s["label"] for s in sentiment_results)
            logger.info(f"Sentiment breakdown for {party}:")
            for label, count in label_counts.items():
                pct = round(count / len(sentiment_results) * 100, 1)
                logger.info(f"  {label}: {count} ({pct}%)")

        except Exception as e:
            logger.error(f"Error saving {party}: {e}")
            db.rollback()
        finally:
            db.close()

    logger.info(f"\n✓ Total posts saved: {total_saved}")
    logger.info("Pipeline complete! Start your API: uvicorn app.main:app --reload")


if __name__ == "__main__":
    main()