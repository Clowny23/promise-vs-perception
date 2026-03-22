# backend/app/services/sentiment_service.py
#
# WHY THIS FILE EXISTS:
# This runs sentiment analysis on tweets using a pretrained AI model.
# We use "cardiffnlp/twitter-roberta-base-sentiment-latest" from HuggingFace.
#
# WHY THIS MODEL:
# - Trained specifically on TWEETS (not news or books) — matches our data
# - Returns 3 classes: Positive, Neutral, Negative
# - No API key needed — runs locally on your computer
# - ~500MB download (cached after first use)
#
# HOW BERT SENTIMENT WORKS:
# The model reads the tweet, converts words to numbers (tokens),
# passes them through 12 layers of transformer attention,
# and outputs probability scores for each sentiment class.

import torch
import json
import logging
from typing import List, Dict, Optional
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch.nn.functional as F

logger = logging.getLogger(__name__)


class SentimentService:
    """
    Runs sentiment analysis on text using a pretrained HuggingFace model.

    USAGE:
        service = SentimentService()
        result = service.analyze("DMK's education policy is excellent!")
        # → {"label": "Positive", "score": 0.92, "all_scores": {...}}
    """

    MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment-latest"

    def __init__(self):
        self.tokenizer = None
        self.model = None
        self.labels = ["Negative", "Neutral", "Positive"]  # Model's output order
        self._is_loaded = False

    def load_model(self):
        """
        Downloads and loads the sentiment model.

        WHY LAZY LOADING:
        The model is ~500MB. We don't want to download it every time
        the server starts — only when we actually need it.
        After the first download, HuggingFace caches it locally.
        """
        if self._is_loaded:
            return

        logger.info(f"Loading sentiment model: {self.MODEL_NAME}")
        logger.info("First time? This will download ~500MB (cached after that)")

        # AutoTokenizer converts text to token IDs the model understands
        self.tokenizer = AutoTokenizer.from_pretrained(self.MODEL_NAME)

        # AutoModelForSequenceClassification loads the classification model
        self.model = AutoModelForSequenceClassification.from_pretrained(self.MODEL_NAME)

        # Set to evaluation mode — turns off dropout (used only during training)
        self.model.eval()

        self._is_loaded = True
        logger.info("Sentiment model loaded successfully!")

    def preprocess(self, text: str) -> str:
        """
        Cleans tweet text before analysis.

        WHY:
        Raw tweets have @mentions, URLs, and #hashtags that confuse the model.
        The Cardiff model was trained with these replaced by special tokens.
        """
        # Replace @username with @user (model was trained this way)
        import re
        text = re.sub(r'@\w+', '@user', text)

        # Replace URLs with http (model expects this)
        text = re.sub(r'http\S+|www\S+', 'http', text)

        # Remove extra whitespace
        text = ' '.join(text.split())

        return text

    def analyze(self, text: str) -> Dict:
        """
        Analyzes sentiment of a single text.

        Returns:
            {
                "label": "Positive",     ← the predicted class
                "score": 0.92,           ← confidence (0-1)
                "all_scores": {          ← probabilities for all classes
                    "Positive": 0.92,
                    "Neutral": 0.05,
                    "Negative": 0.03
                }
            }
        """
        self.load_model()   # Load if not already loaded

        # Preprocess the text
        text = self.preprocess(text)

        # Tokenize: convert text → numbers the model can process
        # - max_length=128: tweets are short, 128 tokens is enough
        # - truncation=True: cut if longer than max_length
        # - return_tensors="pt": return PyTorch tensors (not plain lists)
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            max_length=128,
            truncation=True,
            padding=True
        )

        # Run the model (no gradient calculation needed — we're just predicting)
        # torch.no_grad() saves memory and speeds up inference
        with torch.no_grad():
            outputs = self.model(**inputs)

        # outputs.logits = raw scores (not probabilities yet)
        # F.softmax converts them to probabilities that sum to 1.0
        probabilities = F.softmax(outputs.logits, dim=-1)

        # Convert to Python list
        probs = probabilities[0].tolist()

        # Map probabilities to label names
        scores = {
            label: round(prob, 4)
            for label, prob in zip(self.labels, probs)
        }

        # The predicted label = the one with highest probability
        predicted_label = max(scores, key=scores.get)
        confidence = scores[predicted_label]

        return {
            "label": predicted_label,
            "score": confidence,
            "all_scores": scores
        }

    def analyze_batch(self, texts: List[str], batch_size: int = 16) -> List[Dict]:
        """
        Analyzes multiple texts efficiently.

        WHY BATCHING:
        Sending 1000 tweets one-by-one is slow.
        Batching sends 16 at a time — much faster because the GPU
        (or CPU) processes them in parallel.

        batch_size=16: safe for most computers with 8GB RAM
        Lower it to 8 if you run out of memory.
        """
        self.load_model()

        results = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch = [self.preprocess(t) for t in batch]

            # Tokenize entire batch at once
            inputs = self.tokenizer(
                batch,
                return_tensors="pt",
                max_length=128,
                truncation=True,
                padding=True  # Pad shorter texts to match longest in batch
            )

            with torch.no_grad():
                outputs = self.model(**inputs)

            probabilities = F.softmax(outputs.logits, dim=-1)

            for probs in probabilities:
                probs_list = probs.tolist()
                scores = {
                    label: round(prob, 4)
                    for label, prob in zip(self.labels, probs_list)
                }
                predicted_label = max(scores, key=scores.get)
                confidence = scores[predicted_label]

                results.append({
                    "label": predicted_label,
                    "score": confidence,
                    "all_scores": scores,
                    "sentiment_raw": json.dumps(scores)
                })

            logger.info(f"Processed batch {i // batch_size + 1} of {len(texts) // batch_size + 1}")

        return results

    def get_party_sentiment_summary(self, posts: List[Dict]) -> Dict:
        """
        Aggregates sentiment results for a party.

        Given a list of analyzed posts, returns:
        {
            "total": 500,
            "Positive": {"count": 200, "percentage": 40.0},
            "Neutral":  {"count": 150, "percentage": 30.0},
            "Negative": {"count": 150, "percentage": 30.0},
            "average_score": 0.68,
            "dominant_sentiment": "Positive"
        }
        """
        total = len(posts)
        if total == 0:
            return {"total": 0, "error": "No posts found"}

        counts = {"Positive": 0, "Neutral": 0, "Negative": 0}
        score_sum = 0.0

        for post in posts:
            label = post.get("sentiment_label", "Neutral")
            if label in counts:
                counts[label] += 1
            score_sum += post.get("sentiment_score", 0.5)

        return {
            "total": total,
            "Positive": {
                "count": counts["Positive"],
                "percentage": round((counts["Positive"] / total) * 100, 1)
            },
            "Neutral": {
                "count": counts["Neutral"],
                "percentage": round((counts["Neutral"] / total) * 100, 1)
            },
            "Negative": {
                "count": counts["Negative"],
                "percentage": round((counts["Negative"] / total) * 100, 1)
            },
            "average_score": round(score_sum / total, 3),
            "dominant_sentiment": max(counts, key=counts.get)
        }