"""
Service 6 - Answer Evaluation

Pure machine learning, no Ollama. Combines:
  - Semantic similarity (cosine similarity of sentence embeddings between
    the student's answer and the reference answer / relevant chunk)
  - Keyword coverage (TF-IDF keyword overlap)
  - Concept coverage (concept-term set overlap)
into a single understanding score, plus short templated feedback.
"""

from sklearn.metrics.pairwise import cosine_similarity

from app.config import (
    WEIGHT_SEMANTIC_SIMILARITY,
    WEIGHT_KEYWORD_COVERAGE,
    WEIGHT_CONCEPT_COVERAGE,
)
from app.services.embedding_service import embed_texts
from app.utils.keyword_extraction import keyword_coverage_score, concept_coverage_score


def _semantic_similarity_score(student_answer: str, reference_text: str) -> float:
    """
    Cosine similarity between the student answer and the reference answer
    (combined with the relevant chunk context when available), scaled to
    a 0-100 percentage.
    """
    embeddings = embed_texts([student_answer, reference_text])
    similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    # Embeddings are already normalized, but clamp defensively.
    similarity = max(0.0, min(1.0, float(similarity)))
    # Map cosine similarity [-1, 1] -> percentage [0, 100]
    return round(similarity * 100, 2)


def _build_feedback(understanding_score: float, keyword_score: float, concept_score: float) -> str:
    if understanding_score >= 85:
        base = "Excellent understanding of the concept."
    elif understanding_score >= 70:
        base = "Good understanding but missed one important concept."
    elif understanding_score >= 50:
        base = "Partial understanding; several key points were missing."
    else:
        base = "Limited understanding; the answer does not align well with the reference material."

    notes = []
    if keyword_score < 50:
        notes.append("few key terms from the material were used")
    if concept_score < 50:
        notes.append("several core concepts were not addressed")

    if notes:
        base += " (" + "; ".join(notes) + ".)"
    return base


def evaluate_answer(
    question: str,
    student_answer: str,
    reference_answer: str,
    relevant_chunk: str = "",
) -> dict:
    """
    Score a student's answer against the reference answer and optional
    supporting chunk. Returns similarity, keyword_score, concept_score,
    understanding_score, and feedback.
    """
    grounding_text = reference_answer
    if relevant_chunk:
        grounding_text = f"{reference_answer}\n{relevant_chunk}"

    similarity = _semantic_similarity_score(student_answer, reference_answer)
    keyword_score = keyword_coverage_score(grounding_text, student_answer)
    concept_score = concept_coverage_score(grounding_text, student_answer)

    understanding_score = round(
        (similarity * WEIGHT_SEMANTIC_SIMILARITY)
        + (keyword_score * WEIGHT_KEYWORD_COVERAGE)
        + (concept_score * WEIGHT_CONCEPT_COVERAGE),
        2,
    )

    feedback = _build_feedback(understanding_score, keyword_score, concept_score)

    return {
        "similarity": similarity,
        "keyword_score": keyword_score,
        "concept_score": concept_score,
        "understanding_score": understanding_score,
        "feedback": feedback,
    }
