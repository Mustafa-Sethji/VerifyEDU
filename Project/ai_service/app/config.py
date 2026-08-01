"""
Central configuration for the VERIFYedu AI Service.
All values are read from environment variables (.env) with sane defaults.
"""

import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # python-dotenv is optional at runtime if env vars are already set
    pass

BASE_DIR = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Ollama
# ---------------------------------------------------------------------------
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_GENERATE_URL = f"{OLLAMA_BASE_URL}/api/generate"
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b-instruct")
OLLAMA_TIMEOUT_SECONDS = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "300"))

# ---------------------------------------------------------------------------
# Embeddings
# ---------------------------------------------------------------------------
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")

# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------
CHUNK_MIN_WORDS = int(os.getenv("CHUNK_MIN_WORDS", "500"))
CHUNK_MAX_WORDS = int(os.getenv("CHUNK_MAX_WORDS", "800"))
CHUNK_OVERLAP_WORDS = int(os.getenv("CHUNK_OVERLAP_WORDS", "50"))

# ---------------------------------------------------------------------------
# RAG / retrieval
# ---------------------------------------------------------------------------
RAG_TOP_K_CHUNKS = int(os.getenv("RAG_TOP_K_CHUNKS", "6"))

# ---------------------------------------------------------------------------
# Quiz generation
# ---------------------------------------------------------------------------
NUM_MCQ_QUESTIONS = int(os.getenv("NUM_MCQ_QUESTIONS", "6"))
NUM_DESCRIPTIVE_QUESTIONS = int(os.getenv("NUM_DESCRIPTIVE_QUESTIONS", "4"))

# ---------------------------------------------------------------------------
# Storage paths
# ---------------------------------------------------------------------------
UPLOADS_DIR = BASE_DIR / "uploads"
EMBEDDINGS_DIR = BASE_DIR / "embeddings"
CACHE_DIR = BASE_DIR / "cache"

for directory in (UPLOADS_DIR, EMBEDDINGS_DIR, CACHE_DIR):
    directory.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Evaluation scoring weights (must sum to 1.0)
# ---------------------------------------------------------------------------
WEIGHT_SEMANTIC_SIMILARITY = float(os.getenv("WEIGHT_SEMANTIC_SIMILARITY", "0.9"))
WEIGHT_KEYWORD_COVERAGE = float(os.getenv("WEIGHT_KEYWORD_COVERAGE", "0.05"))
WEIGHT_CONCEPT_COVERAGE = float(os.getenv("WEIGHT_CONCEPT_COVERAGE", "0.05"))
