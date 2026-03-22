# backend/app/services/twitter_scraper.py
#
# WHY THIS FILE EXISTS:
# We need public reaction data — tweets about DMK and AIADMK.
# This file uses snscrape (no official API key needed) to collect tweets.
#
# WHY snscrape:
# - The official Twitter/X API now costs money ($100+/month)
# - snscrape works by mimicking browser requests
# - Free, but slower and less reliable than the official API
# - Good enough for an MVP with ~500-1000 tweets per party
#
# ALTERNATIVE: If you have Twitter API access, you can swap
# the _scrape_with_snscrape() method for the official API.
#
# LEGAL NOTE: Only scrape public tweets. Don't store personal data.
# For academic/research purposes, this is generally acceptable.

import csv
import time
import logging
import subprocess
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from pathlib import Path

logger = logging.getLogger(__name__)


class TwitterScraper:
    """
    Scrapes tweets about political parties using snscrape.

    USAGE:
        scraper = TwitterScraper()
        tweets = scraper.scrape_party_tweets("DMK", max_tweets=500)
    """

    # Search queries for each party
    # We search by party name AND common hashtags
    PARTY_QUERIES = {
        "DMK": [
            "DMK party",
            "#DMK",
            "Dravida Munnetra Kazhagam",
            "Stalin DMK",
            "#MKStalin"
        ],
        "AIADMK": [
            "AIADMK party",
            "#AIADMK",
            "All India Anna Dravida",
            "EPS AIADMK",
            "#Palaniswami"
        ]
    }

    def __init__(self, output_dir: str = "data/raw"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def scrape_party_tweets(
        self,
        party: str,
        max_tweets: int = 500,
        days_back: int = 90,  # Get tweets from last 3 months
        lang: str = "en"       # English only
    ) -> List[Dict]:
        """
        Scrapes tweets about a political party.

        HOW IT WORKS:
        snscrape is a command-line tool. We run it as a subprocess
        (like opening a terminal and running a command from Python).
        The output is JSON — one tweet per line.

        Args:
            party: "DMK" or "AIADMK"
            max_tweets: How many tweets to collect (more = slower)
            days_back: How many days in the past to search
            lang: Language filter ("en" for English)

        Returns:
            List of tweet dictionaries
        """
        if party not in self.PARTY_QUERIES:
            logger.error(f"Unknown party: {party}")
            return []

        all_tweets = []
        since_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")

        # Try each query until we have enough tweets
        for query in self.PARTY_QUERIES[party]:
            if len(all_tweets) >= max_tweets:
                break

            remaining = max_tweets - len(all_tweets)
            tweets = self._scrape_with_snscrape(
                query=f"{query} lang:{lang} since:{since_date}",
                max_results=remaining
            )
            all_tweets.extend(tweets)
            logger.info(f"Query '{query}': got {len(tweets)} tweets (total: {len(all_tweets)})")

            # Be polite — wait 2 seconds between requests
            # Avoids getting rate-limited or blocked
            time.sleep(2)

        # Add party label to each tweet
        for tweet in all_tweets:
            tweet["party"] = party

        logger.info(f"Total tweets collected for {party}: {len(all_tweets)}")
        return all_tweets

    def _scrape_with_snscrape(self, query: str, max_results: int) -> List[Dict]:
        """
        Runs snscrape as a command-line subprocess.

        WHY SUBPROCESS:
        snscrape works best as a CLI tool. Running it from Python
        via subprocess is the recommended approach.

        The command we run:
        snscrape --jsonl --max-results 500 twitter-search "DMK party lang:en"
        """
        tweets = []

        try:
            # Build the command
            # --jsonl: output one JSON object per line
            # --max-results: limit number of results
            # twitter-search: search for tweets
            cmd = [
                "snscrape",
                "--jsonl",
                f"--max-results", str(max_results),
                "twitter-search",
                query
            ]

            # Run the command and capture output
            # timeout=60: give up after 60 seconds
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60
            )

            if result.returncode != 0:
                logger.warning(f"snscrape returned error: {result.stderr}")
                return []

            # Parse JSON output — one tweet per line
            for line in result.stdout.strip().split('\n'):
                if not line:
                    continue
                try:
                    tweet_data = json.loads(line)
                    tweet = self._parse_tweet(tweet_data)
                    if tweet:
                        tweets.append(tweet)
                except json.JSONDecodeError:
                    continue

        except subprocess.TimeoutExpired:
            logger.warning("snscrape timed out")
        except FileNotFoundError:
            logger.error("snscrape not found. Install with: pip install snscrape")
        except Exception as e:
            logger.error(f"Scraping error: {e}")

        return tweets

    def _parse_tweet(self, raw: Dict) -> Optional[Dict]:
        """
        Extracts relevant fields from raw snscrape tweet JSON.
        Discards retweets (they're not original opinions).
        """
        # Skip retweets — they just amplify others' opinions
        if raw.get("retweetedTweet"):
            return None

        # Skip tweets with too few characters (likely just hashtags)
        content = raw.get("content", "")
        if len(content) < 20:
            return None

        return {
            "tweet_id": raw.get("id"),
            "text": content,
            "username": raw.get("user", {}).get("username", ""),
            "tweet_date": raw.get("date", ""),
            "likes_count": raw.get("likeCount", 0),
            "party": None,  # Filled by caller
            "sentiment_label": None,   # Filled by sentiment service
            "sentiment_score": None,
            "sentiment_raw": None
        }

    def save_to_csv(self, tweets: List[Dict], party: str) -> str:
        """
        Saves scraped tweets to a CSV file.
        Always save raw data before processing — if something breaks,
        you don't have to re-scrape.
        """
        output_path = self.output_dir / f"{party.lower()}_tweets_raw.csv"

        if not tweets:
            logger.warning(f"No tweets to save for {party}")
            return str(output_path)

        fieldnames = list(tweets[0].keys())

        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(tweets)

        logger.info(f"Saved {len(tweets)} tweets to {output_path}")
        return str(output_path)

    def load_from_csv(self, party: str) -> List[Dict]:
        """
        Loads previously scraped tweets from CSV.
        Use this instead of re-scraping every time.
        """
        csv_path = self.output_dir / f"{party.lower()}_tweets_raw.csv"

        if not csv_path.exists():
            logger.warning(f"No CSV found for {party}: {csv_path}")
            return []

        tweets = []
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            tweets = list(reader)

        logger.info(f"Loaded {len(tweets)} tweets for {party} from CSV")
        return tweets

    def generate_sample_data(self, party: str, count: int = 100) -> List[Dict]:
        """
        Generates realistic sample tweets for development/testing.

        WHY THIS EXISTS:
        During development, you might not want to actually scrape Twitter
        every time you test. This generates fake but realistic-looking data
        so you can test the rest of the pipeline without scraping.

        In your final submission, replace this with real scraped data.
        """
        import random

        # Sample tweet templates for each party
        templates = {
            "DMK": {
                "positive": [
                    "DMK's free breakfast scheme is really helping students! Great initiative.",
                    "Finally a party that thinks about farmers. DMK's loan waiver program is excellent!",
                    "DMK government has done amazing work in infrastructure. Roads are much better now.",
                    "The healthcare scheme by DMK is working well in my village. People are getting treatment.",
                    "MK Stalin keeps his promises unlike others. Proud to support DMK.",
                    "DMK's education policies are transforming Tamil Nadu's schools.",
                ],
                "negative": [
                    "DMK promised jobs but unemployment is still high. Where are the opportunities?",
                    "Another broken promise by DMK. When will the metro expansion be complete?",
                    "Corruption allegations are damaging DMK's credibility. Very disappointing.",
                    "DMK's economic policies haven't helped small businesses at all.",
                    "Inflation is still rising despite DMK's promises to control prices.",
                ],
                "neutral": [
                    "DMK announced new welfare scheme today. Will wait and watch implementation.",
                    "DMK party meeting in Chennai discussing manifesto implementation.",
                    "DMK government budget session starts next week.",
                    "MK Stalin meets farmers to discuss DMK's agricultural policies.",
                ]
            },
            "AIADMK": {
                "positive": [
                    "AIADMK did great work during their tenure. Miss those days.",
                    "AIADMK's Amma schemes were truly helpful for Tamil Nadu women.",
                    "EPS is a strong leader for AIADMK. Party needs to unite.",
                    "AIADMK has clear policies for Tamil Nadu development. Good opposition.",
                    "The AIADMK government's CMCHIS health scheme was a game changer.",
                ],
                "negative": [
                    "AIADMK keeps criticizing but where was their governance? Empty promises.",
                    "AIADMK's internal conflicts are weakening the party. Sad to see.",
                    "AIADMK promised everything before election but delivered nothing.",
                    "AIADMK leadership seems focused on politics not on Tamil Nadu's people.",
                    "Corruption scandals plagued AIADMK rule. Time for accountability.",
                ],
                "neutral": [
                    "AIADMK press conference on Tamil Nadu budget expected today.",
                    "AIADMK announces party reorganization plans for 2024.",
                    "EPS meets AIADMK district leaders for strategy discussion.",
                    "AIADMK releases alternate policy document for Tamil Nadu.",
                ]
            }
        }

        party_templates = templates.get(party, templates["DMK"])
        all_templates = (
            [(t, "Positive") for t in party_templates["positive"]] +
            [(t, "Negative") for t in party_templates["negative"]] +
            [(t, "Neutral") for t in party_templates["neutral"]]
        )

        sample_tweets = []
        for i in range(count):
            text, true_sentiment = random.choice(all_templates)
            sample_tweets.append({
                "tweet_id": 1700000000000 + i,
                "text": text,
                "username": f"user_{random.randint(1000, 9999)}",
                "tweet_date": "2024-03-01",
                "likes_count": random.randint(0, 500),
                "party": party,
                "sentiment_label": None,
                "sentiment_score": None,
                "sentiment_raw": None
            })

        logger.info(f"Generated {count} sample tweets for {party}")
        return sample_tweets