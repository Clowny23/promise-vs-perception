#!/usr/bin/env python3
# backend/scripts/02_scrape_twitter.py
#
# WHY THIS SCRIPT:
# Collects tweets about DMK and AIADMK and saves them to CSV.
# Run this BEFORE script 03 (sentiment analysis).
#
# NOTE: If snscrape fails (Twitter blocks it sometimes),
# the script falls back to sample data automatically.
#
# RUN: python scripts/02_scrape_twitter.py

import sys
import os
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.twitter_scraper import TwitterScraper

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def main():
    logger.info("=" * 60)
    logger.info("STEP 2: Twitter Data Collection")
    logger.info("=" * 60)

    scraper = TwitterScraper(output_dir="../data/raw")

    for party in ["DMK", "AIADMK"]:
        logger.info(f"\nCollecting tweets for: {party}")

        # Try real scraping first
        tweets = []
        try:
            tweets = scraper.scrape_party_tweets(
                party=party,
                max_tweets=300,   # 300 per party = 600 total
                days_back=180,    # Last 6 months
                lang="en"
            )
        except Exception as e:
            logger.warning(f"Real scraping failed: {e}")

        # Fallback to sample data if scraping fails or returns too few tweets
        if len(tweets) < 50:
            logger.warning(f"Got only {len(tweets)} real tweets. Using sample data.")
            tweets = scraper.generate_sample_data(party, count=200)

        # Save to CSV
        scraper.save_to_csv(tweets, party)
        logger.info(f"✓ Saved {len(tweets)} tweets for {party}")

    logger.info("\n✓ Data collection complete!")
    logger.info("Run script 03 next: python scripts/03_run_sentiment.py")


if __name__ == "__main__":
    main()