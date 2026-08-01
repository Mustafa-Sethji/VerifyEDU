# VERIFYedu AI Service

An **independent AI/ML microservice**. It has no authentication, no database,
no frontend, and no user/classroom management. The backend team integrates
with it purely over REST/JSON.

It receives an uploaded PDF, returns an intelligent quiz grounded strictly in
that document, and evaluates student answers using machine learning (no LLM
involved in evaluation). Everything runs locally via Ollama.

## Folder structure

```
ai_service/
  app/
    api/            # FastAPI route handlers (one file per endpoint)
    services/        # Business logic: PDF, chunking, embeddings, RAG, Ollama, quiz, evaluation
    models/          # Pydantic request/response schemas
    utils/           # Text cleaning, keyword extraction, document metadata cache
    prompts/         # LLM prompt templates
    config.py        # Environment-driven configuration
    main.py          # FastAPI app entry point
  uploads/           # (runtime) transient upload scratch space
  embeddings/        # (runtime) per-document FAISS indexes + chunk text
  cache/             # (runtime) per-document summary/keyword cache
  requirements.txt
  .env.example
```

## Setup

```bash
cd ai_service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Make sure [Ollama](https://ollama.com) is running locally and the model in
`.env` (default `qwen3:latest`) is pulled:

```bash
ollama pull qwen3:latest
ollama serve
```

Run the service:

```bash
uvicorn app.main:app --reload --port 8001
```

The interactive API docs are then available at `http://localhost:8001/docs`.

## Pipeline overview

1. **PDF Processing** — `PyMuPDF` extracts raw per-page text; headers,
   footers, page numbers, and extra whitespace are stripped.
2. **Chunking** — text is split into 500–800 word semantic chunks with a
   50-word overlap, always on sentence boundaries.
3. **Embeddings** — chunks are embedded with `all-MiniLM-L6-v2` and stored
   in a per-document FAISS index.
4. **RAG** — the full PDF is *never* sent to Ollama. Instead, a representative
   sample of chunks is summarized, TF-IDF keywords are extracted, and the
   most relevant chunks are retrieved for quiz generation.
5. **Ollama** — only summary + keywords + relevant chunks are sent to the
   local LLM to generate quiz JSON. Prompts explicitly forbid outside
   knowledge and require rewriting facts into fill-in-the-blank / applied
   phrasing rather than "Define X" style questions.
6. **Answer Evaluation** — pure ML, no LLM call. Combines semantic
   similarity (sentence embeddings + cosine similarity), TF-IDF keyword
   coverage, and concept-term coverage into one understanding score.

## API Reference

### `POST /process-pdf`
Multipart form upload, field name `file` (PDF only).

Response:
```json
{
  "document_id": "a1b2c3...",
  "summary": "...",
  "keywords": ["...", "..."],
  "chunks": [{"chunk_id": 0, "text": "...", "word_count": 612}],
  "num_chunks": 5,
  "embedding_dim": 384
}
```

### `POST /generate-quiz`
```json
{ "document_id": "a1b2c3...", "num_mcq": 6, "num_descriptive": 4 }
```
Returns quiz JSON with `mcq` (6 by default) and `descriptive` (4 by default)
arrays, matching the required schema exactly.

### `POST /evaluate-answer`
```json
{
  "document_id": "a1b2c3...",
  "question": "...",
  "student_answer": "...",
  "reference_answer": "..."
}
```
`relevant_chunk` can be supplied explicitly instead of `document_id` to skip
automatic retrieval. Returns:
```json
{
  "similarity": 89.2,
  "keyword_score": 85.0,
  "concept_score": 91.0,
  "understanding_score": 88.0,
  "feedback": "Good understanding but missed one important concept."
}
```

### `GET` / `POST /health`
```json
{
  "status": "ok",
  "ollama_reachable": true,
  "ollama_model": "qwen3:latest",
  "embedding_model": "all-MiniLM-L6-v2"
}
```

## Notes for the backend team

- This service is stateless across restarts except for the `embeddings/` and
  `cache/` directories, which persist FAISS indexes and document metadata
  keyed by `document_id`. Point these at durable storage (or a shared volume)
  in production.
- All endpoints return JSON only — no HTML, no server-rendered pages.
- No authentication is implemented here; put this service behind your
  existing gateway/auth layer.
