#!/usr/bin/env python3
# backend/scripts/01_extract_promises.py
#
# WHY THIS SCRIPT:
# This is a one-time pipeline script that:
# 1. Reads PDF manifestos from data/raw/
# 2. Extracts promise sentences
# 3. Classifies them into topics
# 4. Saves to PostgreSQL database
#
# RUN ONCE AFTER SETTING UP:
# cd backend
# python scripts/01_extract_promises.py
#
# After running, promises are in the DB and you can
# query them through the API.

import sys
import os
import logging

# Add the backend directory to Python path
# This lets us import from app/ even though we're in scripts/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.promise_extractor import PromiseExtractor
from app.services.topic_classifier import TopicClassifier
from app.core.database import SessionLocal, create_tables
from app.models.promise import Promise

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


# ===========================================================================
# CONFIGURATION
# Fill in the paths to your actual manifesto PDFs
# ===========================================================================

MANIFESTOS = [
    {
        "party": "DMK",
        "pdf_path": "../data/raw/dmk_manifesto_2021.pdf",
        "year": 2021
    },
    {
        "party": "AIADMK",
        "pdf_path": "../data/raw/aiadmk_manifesto_2021_NOTFOUND.pdf",
        "year": 2021
    }
]

# ===========================================================================
# SAMPLE DATA (used if PDF not found — for testing without actual PDFs)
# ===========================================================================

SAMPLE_PROMISES = {
    "DMK": [
        "We will provide free breakfast for all government school students across Tamil Nadu.",
        "DMK will ensure Rs. 1000 monthly financial assistance to women heads of families.",
        "We shall waive all farm loans up to Rs. 2 lakhs for Tamil Nadu farmers.",
        "The DMK government will create 10 lakh new employment opportunities in the state.",
        "We will establish 1000 new Amma Canteens to provide affordable food to the poor.",
        "DMK will build 5 lakh new affordable housing units for the economically weaker sections.",
        "We shall ensure free education from KG to PG for all students in Tamil Nadu.",
        "The party will provide Rs. 4000 monthly allowance for unemployed youth.",
        "DMK will install solar panels in all government buildings to promote clean energy.",
        "We will construct new medical colleges in each district to improve healthcare access.",
        "The government will provide Rs. 18,000 annual assistance to differently-abled persons.",
        "DMK will implement Rs. 200 per day as minimum wage for unorganized sector workers.",
        "We shall ensure 24-hour uninterrupted electricity supply to all households.",
        "The party will distribute laptops to all students appearing for Class 10 and 12.",
        "DMK will set up skill development centers in all taluks to train youth.",
    ],
    "AIADMK": [
        "AIADMK will provide Rs. 1,500 monthly assistance to all women in Tamil Nadu.",
        "We will ensure 100% crop insurance coverage for all farmers in the state.",
        "The party will build 10,000 km of new roads in rural areas within 5 years.",
        "AIADMK will construct new government hospitals in all constituencies.",
        "We shall provide free uniforms, books and meals to all government school students.",
        "The party will create 15 lakh jobs through new industrial investments.",
        "AIADMK will launch a Rs. 5,000 crore fund for small and medium enterprises.",
        "We will ensure piped drinking water supply to every household in Tamil Nadu.",
        "The party shall waive electricity bills for households consuming less than 100 units.",
        "AIADMK will provide free solar cookers to all BPL families.",
        "We will establish new IT parks in Tier-2 and Tier-3 cities for employment.",
        "The party will increase teacher recruitment by 50,000 in government schools.",
        "AIADMK shall provide Rs. 6,000 monthly pension for all senior citizens above 60.",
        "We will launch a housing scheme providing free houses to economically weaker sections.",
        "The party will construct flyovers and underpasses to reduce traffic congestion.",
    ]
}


def main():
    logger.info("="*60)
    logger.info("STEP 1: Promise Extraction Pipeline")
    logger.info("="*60)

    # Create DB tables if they don't exist
    create_tables()
    logger.info("Database tables created/verified")

    extractor = PromiseExtractor()
    classifier = TopicClassifier()
    db = SessionLocal()

    total_saved = 0

    try:
        for manifesto in MANIFESTOS:
            party = manifesto["party"]
            pdf_path = manifesto["pdf_path"]
            year = manifesto["year"]

            logger.info(f"\nProcessing: {party} manifesto ({year})")

            # Try to read from PDF
            if os.path.exists(pdf_path):
                logger.info(f"Reading PDF: {pdf_path}")
                raw_promises = extractor.extract_from_pdf(pdf_path, party, year)
            else:
                # Use sample data if PDF not found
                logger.warning(f"PDF not found: {pdf_path}")
                logger.warning(f"Using sample data for {party} (add your PDF to data/raw/)")

                sample_texts = SAMPLE_PROMISES.get(party, [])
                raw_promises = []
                for text in sample_texts:
                    raw_promises.append({
                        "party": party,
                        "text": text,
                        "source_file": "sample_data.txt",
                        "page_number": None,
                        "manifesto_year": year,
                        "topic": None,
                        "topic_confidence": None,
                        "is_valid_promise": True
                    })

            if not raw_promises:
                logger.warning(f"No promises extracted for {party}")
                continue

            logger.info(f"Found {len(raw_promises)} promise sentences")

            # --- Classify topics ---
            logger.info("Classifying topics...")
            texts = [p["text"] for p in raw_promises]
            topic_results = classifier.classify_batch(texts)

            # --- Save to database ---
            saved_count = 0

            # Delete old promises for this party/year first (for re-runs)
            old_count = (
                db.query(Promise)
                .filter(Promise.party == party, Promise.manifesto_year == year)
                .delete()
            )
            if old_count > 0:
                logger.info(f"Cleared {old_count} old promises for {party}")

            for promise_data, topic_result in zip(raw_promises, topic_results):
                promise = Promise(
                    party=promise_data["party"],
                    text=promise_data["text"],
                    topic=topic_result["topic"],
                    topic_confidence=topic_result["confidence"],
                    source_file=promise_data.get("source_file"),
                    page_number=promise_data.get("page_number"),
                    manifesto_year=promise_data.get("manifesto_year"),
                    is_valid_promise=True
                )
                db.add(promise)
                saved_count += 1

            db.commit()
            total_saved += saved_count
            logger.info(f"Saved {saved_count} promises for {party}")

            # Print sample of extracted promises
            logger.info(f"\nSample promises for {party}:")
            for i, (p, t) in enumerate(zip(raw_promises[:3], topic_results[:3])):
                logger.info(f"  [{t['topic']}] {p['text'][:80]}...")

    except Exception as e:
        logger.error(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

    logger.info(f"\n✓ Total promises saved: {total_saved}")
    logger.info("Run script 02 next: python scripts/02_scrape_twitter.py")


if __name__ == "__main__":
    main()