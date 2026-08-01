"""
POST /health

Checks whether Ollama is reachable and reports configured model names.
(Exposed as POST per the service spec; the backend team may also wish to
mirror this at GET /health — see main.py.)
"""

from fastapi import APIRouter

from app.config import OLLAMA_MODEL, EMBEDDING_MODEL_NAME
from app.models.schemas import HealthResponse
from app.services import ollama_service

router = APIRouter()


def _build_health_response() -> HealthResponse:
    reachable = ollama_service.is_reachable()
    return HealthResponse(
        status="ok" if reachable else "degraded",
        ollama_reachable=reachable,
        ollama_model=OLLAMA_MODEL,
        embedding_model=EMBEDDING_MODEL_NAME,
    )


@router.post("/health", response_model=HealthResponse)
async def health_post():
    return _build_health_response()


@router.get("/health", response_model=HealthResponse)
async def health_get():
    return _build_health_response()
