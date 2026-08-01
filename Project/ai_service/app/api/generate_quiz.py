"""
POST /generate-quiz

Looks up the cached summary/keywords for a document_id (produced by
/process-pdf), retrieves grounded chunks, and generates a quiz via Ollama.
"""

from fastapi import APIRouter, HTTPException

from app.models.schemas import GenerateQuizRequest, QuizResponse
from app.services import quiz_service, ollama_service
from app.utils.document_cache import load_document_meta

router = APIRouter()


@router.post("/generate-quiz", response_model=QuizResponse)
async def generate_quiz(request: GenerateQuizRequest):
    meta = load_document_meta(request.document_id)
    if meta is None:
        raise HTTPException(
            status_code=404,
            detail=f"No processed document found for document_id={request.document_id}. "
            "Call /process-pdf first.",
        )

    try:
        quiz = quiz_service.generate_quiz(
            document_id=request.document_id,
            summary=meta["summary"],
            keywords=meta["keywords"],
            num_mcq=request.num_mcq,
            num_descriptive=request.num_descriptive,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ollama_service.OllamaError as exc:
        raise HTTPException(status_code=502, detail=f"Ollama error: {exc}") from exc
    except quiz_service.QuizGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return quiz
