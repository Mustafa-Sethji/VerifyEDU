"""
Service 3 - Embeddings

Generates embeddings with SentenceTransformer (all-MiniLM-L6-v2 by default)
and stores them in a per-document FAISS index for fast similarity search
during retrieval (Service 4) and quiz/evaluation grounding.
"""

import json
import threading
from pathlib import Path
from typing import List, Tuple

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

from app.config import EMBEDDING_MODEL_NAME, EMBEDDINGS_DIR

_model_lock = threading.Lock()
_model: SentenceTransformer = None


def get_embedding_model() -> SentenceTransformer:
    """
    Lazily load the SentenceTransformer model once per process (thread-safe).
    """
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return _model


def embed_texts(texts: List[str]) -> np.ndarray:
    """
    Embed a list of strings and return a float32 numpy array of shape
    (len(texts), embedding_dim), L2-normalized for cosine similarity via
    inner product search.
    """
    model = get_embedding_model()
    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        show_progress_bar=False,
        normalize_embeddings=True,
    )
    return embeddings.astype("float32")


def _index_path(document_id: str) -> Path:
    return EMBEDDINGS_DIR / f"{document_id}.faiss"


def _chunks_path(document_id: str) -> Path:
    return EMBEDDINGS_DIR / f"{document_id}.chunks.json"


def build_and_store_index(document_id: str, chunks: List[str]) -> np.ndarray:
    """
    Embed all chunks for a document, build a FAISS inner-product index
    (equivalent to cosine similarity since vectors are normalized), and
    persist both the index and the raw chunk text to disk.
    """
    embeddings = embed_texts(chunks)
    dim = embeddings.shape[1]

    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)

    faiss.write_index(index, str(_index_path(document_id)))
    with open(_chunks_path(document_id), "w", encoding="utf-8") as f:
        json.dump(chunks, f)

    return embeddings


def load_index(document_id: str) -> Tuple[faiss.Index, List[str]]:
    """
    Load a previously stored FAISS index and its associated chunk text
    for a given document_id.
    """
    index_path = _index_path(document_id)
    chunks_path = _chunks_path(document_id)

    if not index_path.exists() or not chunks_path.exists():
        raise FileNotFoundError(
            f"No stored embeddings found for document_id={document_id}. "
            "Call /process-pdf first."
        )

    index = faiss.read_index(str(index_path))
    with open(chunks_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    return index, chunks


def search_similar_chunks(document_id: str, query: str, top_k: int = 6) -> List[Tuple[str, float]]:
    """
    Retrieve the top_k most relevant chunks for a query against a stored
    document index. Returns a list of (chunk_text, similarity_score) tuples.
    """
    index, chunks = load_index(document_id)
    query_embedding = embed_texts([query])

    top_k = min(top_k, len(chunks))
    scores, indices = index.search(query_embedding, top_k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx == -1:
            continue
        results.append((chunks[idx], float(score)))
    return results
