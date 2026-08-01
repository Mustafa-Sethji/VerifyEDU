"""
Keyword / concept extraction utilities built on scikit-learn's TF-IDF.
Used both for RAG summarization (Service 4) and answer evaluation (Service 6).
"""

import re
from typing import List, Set

from sklearn.feature_extraction.text import TfidfVectorizer

_TOKEN_PATTERN = re.compile(r"[A-Za-z]{3,}")

_STOPWORDS = {
    "the", "and", "for", "are", "but", "not", "you", "all", "any", "can",
    "had", "her", "was", "one", "our", "out", "day", "get", "has", "him",
    "his", "how", "man", "new", "now", "old", "see", "two", "way", "who",
    "boy", "did", "its", "let", "put", "say", "she", "too", "use", "that",
    "with", "this", "from", "have", "will", "your", "which", "their",
    "would", "there", "been", "into", "than", "them", "these", "those",
    "such", "when", "where", "were", "what", "also", "each", "some",
    "more", "most", "other", "over", "then", "only", "same", "very",
    "here", "both", "does", "being", "about", "above", "after", "again",
    "before", "between", "during", "further", "once", "under", "while",
}


def extract_keywords(text: str, top_n: int = 15) -> List[str]:
    """
    Extract top-N keywords/phrases from a block of text using TF-IDF
    unigrams and bigrams. Falls back gracefully on very short text.
    """
    text = text.strip()
    if not text:
        return []

    try:
        vectorizer = TfidfVectorizer(
            max_features=200,
            stop_words="english",
            ngram_range=(1, 2),
            token_pattern=r"(?u)\b[A-Za-z][A-Za-z\-]{2,}\b",
        )
        tfidf_matrix = vectorizer.fit_transform([text])
        scores = tfidf_matrix.toarray()[0]
        feature_names = vectorizer.get_feature_names_out()
        ranked = sorted(zip(feature_names, scores), key=lambda x: x[1], reverse=True)
        keywords = [term for term, score in ranked if score > 0][:top_n]
        if keywords:
            return keywords
    except ValueError:
        pass

    # Fallback: simple frequency-based extraction for very short inputs.
    tokens = [t.lower() for t in _TOKEN_PATTERN.findall(text) if t.lower() not in _STOPWORDS]
    seen = []
    for tok in tokens:
        if tok not in seen:
            seen.append(tok)
    return seen[:top_n]


def extract_concept_terms(text: str) -> Set[str]:
    """
    Return a set of lowercase concept terms (single tokens) for a piece of
    text, used for concept-coverage comparisons in answer evaluation.
    """
    tokens = {t.lower() for t in _TOKEN_PATTERN.findall(text)}
    return {t for t in tokens if t not in _STOPWORDS}


def keyword_coverage_score(reference_text: str, candidate_text: str) -> float:
    """
    Percentage of important reference keywords that also appear in the
    candidate text. Returns a value in [0, 100].
    """
    reference_keywords = extract_keywords(reference_text, top_n=20)
    if not reference_keywords:
        return 0.0

    candidate_lower = candidate_text.lower()
    matched = sum(1 for kw in reference_keywords if kw.lower() in candidate_lower)
    return round((matched / len(reference_keywords)) * 100, 2)


def concept_coverage_score(reference_text: str, candidate_text: str) -> float:
    """
    Jaccard-style overlap between the concept-term sets of reference and
    candidate text. Returns a value in [0, 100].
    """
    reference_concepts = extract_concept_terms(reference_text)
    candidate_concepts = extract_concept_terms(candidate_text)

    if not reference_concepts:
        return 0.0

    overlap = reference_concepts.intersection(candidate_concepts)
    return round((len(overlap) / len(reference_concepts)) * 100, 2)
