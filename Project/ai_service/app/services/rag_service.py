"""
Service 4 - RAG

Never sends the full PDF to Ollama. Instead:
  1. Retrieves the most relevant chunks (or a representative sample for
     initial summarization, since there is no query yet at /process-pdf time).
  2. Generates a concise summary via Ollama, grounded only in those chunks.
  3. Extracts keywords via TF-IDF (no LLM call needed).

Only summary + keywords + relevant chunks are ever sent to Ollama downstream
(e.g. during quiz generation).
"""

from typing import List, Tuple

from app.services import embedding_service, ollama_service
from app.prompts.quiz_prompt import build_summary_prompt, SUMMARY_SYSTEM_PROMPT
from app.utils.keyword_extraction import extract_keywords


def select_representative_chunks(chunks: List[str], max_chunks: int = 8) -> List[str]:
    """
    For initial document summarization (no user query yet), pick an evenly
    spaced sample of chunks across the document rather than sending
    everything to the LLM.
    """
    if len(chunks) <= max_chunks:
        return chunks

    step = len(chunks) / max_chunks
    indices = sorted({int(i * step) for i in range(max_chunks)})
    return [chunks[i] for i in indices]


def summarize_document(chunks: List[str]) -> str:
    """
    Generate a concise, grounded summary of the document using only a
    representative subset of chunks (never the whole PDF).
    """
    sample_chunks = select_representative_chunks(chunks)
    prompt = build_summary_prompt(sample_chunks)
    print("=" * 60)
    print(f"Total chunks: {len(chunks)}")
    print(f"Selected chunks: {len(sample_chunks)}")
    print(f"Prompt length: {len(prompt)} characters")
    print("=" * 60)
    summary = ollama_service.generate(
        prompt=prompt,
        system=SUMMARY_SYSTEM_PROMPT,
        temperature=0.2,
    )
    return summary.strip()


def extract_document_keywords(full_text: str, top_n: int = 15) -> List[str]:
    """
    Extract representative keywords for the whole document using TF-IDF
    (no LLM call required for this step).
    """
    return extract_keywords(full_text, top_n=top_n)


def retrieve_relevant_chunks(document_id: str, query: str, top_k: int) -> List[str]:
    """
    Retrieve the top_k most relevant chunks for a given query against the
    stored FAISS index for this document.
    """
    results: List[Tuple[str, float]] = embedding_service.search_similar_chunks(
        document_id=document_id, query=query, top_k=top_k
    )
    return [chunk for chunk, _score in results]


def build_quiz_context(document_id: str, summary: str, keywords: List[str], top_k: int) -> List[str]:
    """
    Build the chunk context used for quiz generation: retrieve chunks most
    relevant to the document's own summary + keywords, so the LLM only ever
    sees a focused, grounded slice of the document.
    """
    query = summary + " " + " ".join(keywords)
    chunks = retrieve_relevant_chunks(document_id, query=query, top_k=top_k)
    if not chunks:
        # Fallback: if retrieval yields nothing (e.g. very short doc), use
        # whatever chunks were stored directly.
        _, stored_chunks = embedding_service.load_index(document_id)
        chunks = stored_chunks[:top_k]
    return chunks
