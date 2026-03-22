# backend/app/services/topic_classifier.py
#
# WHY THIS FILE EXISTS:
# After extracting promises, we need to group them by topic
# (Economy, Jobs, Education, Healthcare, Welfare, Infrastructure).
#
# APPROACH: Zero-shot classification using TF-IDF + Cosine Similarity
#
# HOW IT WORKS:
# 1. We define "keyword prototypes" for each topic
# 2. Convert both the promise text and prototype to TF-IDF vectors
#    (TF-IDF = Term Frequency-Inverse Document Frequency —
#     numbers that represent how important each word is)
# 3. Measure similarity between the promise and each topic prototype
# 4. The most similar topic wins
#
# WHY THIS INSTEAD OF A NEURAL NETWORK:
# - No training data needed (zero-shot = works without examples)
# - Instant — no GPU required
# - Very interpretable — you can see WHICH keywords triggered the topic
# - Accurate enough for 6 broad categories
#
# For a more advanced version, you could use
# "facebook/bart-large-mnli" from HuggingFace for better accuracy.

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import logging
from typing import List, Dict, Tuple

logger = logging.getLogger(__name__)


class TopicClassifier:
    """
    Classifies political promises into predefined topic categories.

    USAGE:
        classifier = TopicClassifier()
        topic, confidence = classifier.classify("We will create 10 lakh new jobs")
        # → ("Jobs", 0.85)
    """

    # --- TOPIC DEFINITIONS ---
    # Each topic has a set of representative keywords.
    # Think of these as the "vocabulary" of each topic.
    # The more keywords, the better the classifier understands the topic.
    TOPIC_KEYWORDS = {
        "Economy": [
            "economy", "economic", "GDP", "growth", "inflation", "tax", "revenue",
            "budget", "fiscal", "trade", "investment", "industrial", "manufacturing",
            "exports", "imports", "market", "finance", "currency", "poverty",
            "income", "price", "cost", "subsidy", "loan", "credit", "bank"
        ],
        "Jobs": [
            "job", "employment", "work", "worker", "salary", "wage", "hire",
            "recruit", "unemployment", "occupation", "career", "profession",
            "skill", "training", "apprentice", "labor", "labour", "workforce",
            "livelihood", "opportunity", "youth employment", "self-employment"
        ],
        "Education": [
            "education", "school", "college", "university", "student", "teacher",
            "learn", "scholarship", "curriculum", "literacy", "degree", "tuition",
            "classroom", "textbook", "library", "exam", "research", "knowledge",
            "training", "skill development", "vocational", "higher education"
        ],
        "Healthcare": [
            "health", "hospital", "doctor", "medicine", "medical", "clinic",
            "patient", "disease", "treatment", "surgery", "nurse", "pharmacy",
            "insurance", "mental health", "nutrition", "vaccination", "primary care",
            "diagnostic", "ambulance", "emergency", "maternal", "child health"
        ],
        "Welfare": [
            "welfare", "pension", "ration", "free", "distribution", "benefit",
            "aid", "assistance", "social security", "relief", "vulnerable",
            "poor", "below poverty", "scheme", "grant", "allowance", "support",
            "disability", "widow", "orphan", "midday meal", "free bus"
        ],
        "Infrastructure": [
            "road", "highway", "bridge", "railway", "metro", "airport", "port",
            "electricity", "power", "water supply", "sewage", "housing", "construction",
            "urban", "rural", "broadband", "internet", "telecom", "smart city",
            "drainage", "irrigation", "dam", "building", "signal", "transport"
        ]
    }

    def __init__(self):
        """
        Initializes the classifier and builds TF-IDF representations
        for each topic's keyword set.
        """
        self.topics = list(self.TOPIC_KEYWORDS.keys())

        # Build "prototype sentences" for each topic
        # Joining keywords into a single string lets TF-IDF work on them
        self.topic_prototypes = {
            topic: " ".join(keywords)
            for topic, keywords in self.TOPIC_KEYWORDS.items()
        }

        # TfidfVectorizer converts text to numerical vectors
        # - It learns the vocabulary from the topic prototypes
        # - Then can convert any new text to the same vector space
        self.vectorizer = TfidfVectorizer(
            lowercase=True,      # Normalize case
            ngram_range=(1, 2),  # Use single words AND two-word phrases
                                 # e.g. "health" AND "mental health" as features
            max_features=5000    # Cap vocabulary size for speed
        )

        # Fit the vectorizer on topic prototype texts
        # This builds the vocabulary and IDF weights
        prototype_texts = list(self.topic_prototypes.values())
        self.vectorizer.fit(prototype_texts)

        # Convert each topic prototype to a TF-IDF vector
        # Shape: (num_topics, num_features)
        self.topic_vectors = self.vectorizer.transform(prototype_texts)

        logger.info(f"TopicClassifier initialized with {len(self.topics)} topics")

    def classify(self, text: str) -> Tuple[str, float]:
        """
        Classifies a single promise text into a topic.

        HOW COSINE SIMILARITY WORKS:
        Both the promise and each topic prototype are represented as vectors.
        Cosine similarity measures the ANGLE between two vectors.
        - Similarity = 1.0: identical direction (same topic)
        - Similarity = 0.0: perpendicular (completely different)

        Returns: (topic_name, confidence_score)
        Example: ("Education", 0.74)
        """
        if not text or len(text.strip()) < 5:
            return ("Welfare", 0.0)   # Default fallback

        # Convert promise text to TF-IDF vector
        # Shape: (1, num_features)
        promise_vector = self.vectorizer.transform([text.lower()])

        # Calculate cosine similarity between promise and all topic prototypes
        # Result shape: (1, num_topics)
        similarities = cosine_similarity(promise_vector, self.topic_vectors)[0]

        # Find the index of the highest similarity
        best_idx = np.argmax(similarities)
        best_topic = self.topics[best_idx]
        best_score = float(similarities[best_idx])

        # Normalize confidence to 0-1 range
        # Raw cosine similarity for short texts is often low (0.1-0.4)
        # Scale it so 0.3+ raw = "confident" classification
        normalized_confidence = min(1.0, best_score * 3)

        return (best_topic, round(normalized_confidence, 3))

    def classify_batch(self, texts: List[str]) -> List[Dict]:
        """
        Classifies a list of promise texts efficiently.

        Returns list of {"topic": "Education", "confidence": 0.74}
        """
        if not texts:
            return []

        # Process all texts at once (much faster than one-by-one)
        promise_vectors = self.vectorizer.transform([t.lower() for t in texts])

        # Shape: (num_promises, num_topics)
        similarities = cosine_similarity(promise_vectors, self.topic_vectors)

        results = []
        for sim_row in similarities:
            best_idx = np.argmax(sim_row)
            best_topic = self.topics[best_idx]
            best_score = float(sim_row[best_idx])
            normalized_confidence = min(1.0, best_score * 3)

            results.append({
                "topic": best_topic,
                "confidence": round(normalized_confidence, 3)
            })

        return results

    def get_topic_distribution(self, promises: List[Dict]) -> Dict:
        """
        Given a list of classified promises, returns topic counts.

        Input: [{"topic": "Education", ...}, {"topic": "Jobs", ...}, ...]

        Output:
        {
            "Economy": {"count": 12, "percentage": 20.0},
            "Jobs": {"count": 18, "percentage": 30.0},
            ...
        }
        """
        total = len(promises)
        if total == 0:
            return {}

        counts = {topic: 0 for topic in self.topics}

        for promise in promises:
            topic = promise.get("topic", "Welfare")
            if topic in counts:
                counts[topic] += 1

        distribution = {}
        for topic, count in counts.items():
            distribution[topic] = {
                "count": count,
                "percentage": round((count / total) * 100, 1)
            }

        return distribution

    def explain_classification(self, text: str) -> Dict:
        """
        Shows WHY a text was classified into a topic.
        Useful for debugging and academic presentation.

        Returns all topic scores so you can see which topics were close.
        """
        topic, confidence = self.classify(text)

        promise_vector = self.vectorizer.transform([text.lower()])
        similarities = cosine_similarity(promise_vector, self.topic_vectors)[0]

        all_scores = {
            topic_name: round(float(score), 4)
            for topic_name, score in zip(self.topics, similarities)
        }

        # Find which keywords in the text matched
        feature_names = self.vectorizer.get_feature_names_out()
        nonzero_features = promise_vector.nonzero()[1]
        matched_keywords = [feature_names[i] for i in nonzero_features[:10]]

        return {
            "text": text,
            "predicted_topic": topic,
            "confidence": confidence,
            "all_topic_scores": all_scores,
            "matched_keywords": matched_keywords
        }