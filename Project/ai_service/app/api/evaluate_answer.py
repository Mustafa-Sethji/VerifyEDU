"""
POST /evaluate-answer

Pure ML evaluation (no Ollama). If relevant_chunk is not supplied but a
document_id is, the most relevant stored chunk is retrieved automatically
using the question as the retrieval query.
"""

from fastapi import APIRouter, HTTPException

from app.models.schemas import EvaluateAnswerRequest, EvaluateAnswerResponse
from app.services import evaluation_service, rag_service

router = APIRouter()


@router.post("/evaluate-answer", response_model=EvaluateAnswerResponse)
async def evaluate_answer(request: EvaluateAnswerRequest):
    relevant_chunk = request.relevant_chunk or ""

    if not relevant_chunk and request.document_id:
        try:
            top_chunks = rag_service.retrieve_relevant_chunks(
                document_id=request.document_id, query=request.question, top_k=1
            )
            relevant_chunk = top_chunks[0] if top_chunks else ""
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    result = evaluation_service.evaluate_answer(
        question=request.question,
        student_answer=request.student_answer,
        reference_answer=request.reference_answer,
        relevant_chunk=relevant_chunk,
    )

    return EvaluateAnswerResponse(**result)
