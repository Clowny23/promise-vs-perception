# backend/app/services/promise_extractor.py
#
# WHY THIS FILE EXISTS:
# This is the "brain" of promise extraction.
# It reads a PDF manifesto and finds sentences that are promises.
#
# HOW WE DETECT PROMISES:
# A "promise" in political language usually:
#   1. Uses future tense verbs: "will", "shall", "would"
#   2. Contains commitment words: "ensure", "provide", "build", "create"
#   3. Is about a specific group or sector
#
# APPROACH: Rule-based + spaCy (NO model training needed)
# This is fast, explainable, and works well for structured manifesto text.

import re
import fitz          # PyMuPDF — reads PDF files
import spacy         # NLP toolkit — splits text, finds verbs
import pandas as pd
from pathlib import Path
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)


class PromiseExtractor:
    """
    Extracts political promises from PDF manifesto files.

    USAGE:
        extractor = PromiseExtractor()
        promises = extractor.extract_from_pdf("data/raw/dmk_manifesto.pdf", party="DMK")
    """

    def __init__(self):
        # Load the small English spaCy model
        # This model does: tokenization, POS tagging, dependency parsing
        # "en_core_web_sm" = small model (fast, ~12MB)
        # Run once: python -m spacy download en_core_web_sm
        logger.info("Loading spaCy model...")
        self.nlp = spacy.load("en_core_web_sm")
        logger.info("spaCy model loaded.")

        # --- PROMISE INDICATORS ---
        # These words signal a future commitment
        # We look for these in each sentence

        # Future-tense modal verbs
        self.future_modals = {
            "will", "shall", "would", "going to"
        }

        # Action/commitment verbs — party promises to DO something
        self.commitment_verbs = {
            "ensure", "provide", "create", "build", "establish",
            "develop", "implement", "introduce", "increase", "reduce",
            "improve", "expand", "strengthen", "promote", "allocate",
            "distribute", "construct", "launch", "initiate", "guarantee",
            "offer", "extend", "support", "fund", "invest"
        }

        # Welfare/subject markers — who benefits?
        self.beneficiary_keywords = {
            "farmer", "student", "youth", "women", "elderly", "children",
            "worker", "family", "poor", "rural", "urban", "citizen",
            "unemployed", "disabled", "minority"
        }

    def extract_text_from_pdf(self, pdf_path: str) -> List[Dict]:
        """
        Reads a PDF file and extracts text page by page.

        WHY PAGE-BY-PAGE:
        Keeps page number info — useful for citations and debugging.
        Also handles large PDFs without loading everything into RAM.

        Returns: List of {"page": 3, "text": "The party will..."}
        """
        pages = []
        try:
            # fitz.open() is PyMuPDF's way to open a PDF
            doc = fitz.open(pdf_path)
            logger.info(f"Opened PDF: {pdf_path} ({len(doc)} pages)")

            for page_num, page in enumerate(doc, start=1):
                # get_text() extracts raw text from the page
                text = page.get_text("text")

                # Skip empty or very short pages (page numbers, headers)
                if len(text.strip()) > 50:
                    pages.append({
                        "page": page_num,
                        "text": text.strip()
                    })

            doc.close()
            logger.info(f"Extracted text from {len(pages)} pages")

        except Exception as e:
            logger.error(f"Error reading PDF {pdf_path}: {e}")
            raise

        return pages

    def clean_text(self, text: str) -> str:
        """
        Cleans raw PDF text — removes junk characters and extra whitespace.

        WHY NEEDED:
        PDFs often have weird encoding artifacts, multiple spaces,
        hyphenated words that wrap across lines, etc.
        """
        # Remove non-ASCII characters (handles encoding issues)
        text = re.sub(r'[^\x00-\x7F]+', ' ', text)

        # Fix hyphenated line breaks: "edu-\ncation" → "education"
        text = re.sub(r'(\w+)-\n(\w+)', r'\1\2', text)

        # Collapse multiple whitespace/newlines
        text = re.sub(r'\s+', ' ', text)

        return text.strip()

    def is_promise_sentence(self, sentence: str) -> bool:
        """
        Returns True if this sentence looks like a political promise.

        HOW IT WORKS:
        We check 3 criteria — a sentence needs at least 2 to qualify:
          1. Contains future modal verb (will, shall...)
          2. Contains commitment verb (ensure, provide, build...)
          3. Is long enough to be meaningful (> 10 words)

        WHY RULE-BASED INSTEAD OF AI:
        Rules are transparent — you can debug exactly WHY a sentence
        was classified as a promise. No black box.
        Also much faster than running a neural net on every sentence.
        """
        sentence_lower = sentence.lower()
        score = 0

        # --- Check 1: Future modal verb ---
        for modal in self.future_modals:
            if modal in sentence_lower:
                score += 1
                break  # Only count once even if multiple modals

        # --- Check 2: Commitment verb ---
        for verb in self.commitment_verbs:
            if verb in sentence_lower:
                score += 1
                break

        # --- Check 3: Length check ---
        word_count = len(sentence.split())
        if word_count >= 10:
            score += 1

        # --- Check 4: Beneficiary keyword (bonus) ---
        for keyword in self.beneficiary_keywords:
            if keyword in sentence_lower:
                score += 0.5
                break

        # Threshold: needs at least 2 signals to be called a promise
        return score >= 2

    def extract_sentences(self, text: str) -> List[str]:
        """
        Splits text into individual sentences using spaCy.

        WHY spaCy INSTEAD OF SPLITTING ON PERIODS:
        "Mr. Modi said Rs. 5,000 will be given." — naive split on "."
        would break at "Mr." and "Rs." — spaCy handles these correctly.
        """
        doc = self.nlp(text)
        sentences = [sent.text.strip() for sent in doc.sents
                     if len(sent.text.strip()) > 20]  # Skip tiny fragments
        return sentences

    def extract_from_pdf(self, pdf_path: str, party: str, year: int = 2021) -> List[Dict]:
        """
        Main method — extracts all promises from a manifesto PDF.

        Returns a list of dicts ready to insert into the database.
        """
        logger.info(f"Extracting promises from {pdf_path} for party: {party}")

        all_promises = []
        pages = self.extract_text_from_pdf(pdf_path)

        for page_data in pages:
            cleaned = self.clean_text(page_data["text"])
            sentences = self.extract_sentences(cleaned)

            for sentence in sentences:
                if self.is_promise_sentence(sentence):
                    all_promises.append({
                        "party": party,
                        "text": sentence,
                        "source_file": str(Path(pdf_path).name),
                        "page_number": page_data["page"],
                        "manifesto_year": year,
                        "topic": None,           # Will be filled by topic classifier
                        "topic_confidence": None,
                        "is_valid_promise": True
                    })

        logger.info(f"Found {len(all_promises)} promises for {party}")
        return all_promises

    def extract_from_text(self, text: str, party: str) -> List[Dict]:
        """
        Alternative: extract from plain text string (useful for testing).
        """
        cleaned = self.clean_text(text)
        sentences = self.extract_sentences(cleaned)

        promises = []
        for sentence in sentences:
            if self.is_promise_sentence(sentence):
                promises.append({
                    "party": party,
                    "text": sentence,
                    "source_file": "manual_input",
                    "page_number": None,
                    "manifesto_year": None,
                    "topic": None,
                    "topic_confidence": None,
                    "is_valid_promise": True
                })

        return promises

    def save_to_csv(self, promises: List[Dict], output_path: str):
        """
        Saves extracted promises to a CSV file for inspection.

        WHY CSV FIRST:
        Always inspect your data before inserting to the database.
        You can open the CSV in Excel and check if the extraction is correct.
        """
        df = pd.DataFrame(promises)
        df.to_csv(output_path, index=False)
        logger.info(f"Saved {len(promises)} promises to {output_path}")
        return df