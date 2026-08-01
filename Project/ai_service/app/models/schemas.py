"""
Pydantic schemas shared across the API layer.
These define the exact JSON contracts the backend team will integrate against.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# /process-pdf
# ---------------------------------------------------------------------------

class ChunkOut(BaseModel):
    chunk_id: int
    text: str
    word_count: int


class ProcessPdfResponse(BaseModel):
    document_id: str
    summary: str
    keywords: List[str]
    chunks: List[ChunkOut]
    num_chunks: int
    embedding_dim: int


# ---------------------------------------------------------------------------
# /generate-quiz
# ---------------------------------------------------------------------------

class GenerateQuizRequest(BaseModel):
    document_id: str = Field(..., description="ID returned by /process-pdf")
    num_mcq: Optional[int] = Field(default=None, ge=0, le=20)
    num_descriptive: Optional[int] = Field(default=None, ge=0, le=20)


class MCQItem(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    difficulty: str
    explanation: str


class DescriptiveItem(BaseModel):
    question: str
    reference_answer: str
    difficulty: str


class QuizResponse(BaseModel):
    mcq: List[MCQItem]
    descriptive: List[DescriptiveItem]


# ---------------------------------------------------------------------------
# /evaluate-answer
# ---------------------------------------------------------------------------

class EvaluateAnswerRequest(BaseModel):
    document_id: Optional[str] = Field(
        default=None,
        description="If provided, the most relevant stored chunk is retrieved automatically.",
    )
    question: str
    student_answer: str
    reference_answer: str
    relevant_chunk: Optional[str] = Field(
        default=None,
        description="Optional explicit context chunk; overrides document_id retrieval.",
    )


class EvaluateAnswerResponse(BaseModel):
    similarity: float
    keyword_score: float
    concept_score: float
    understanding_score: float
    feedback: str


# ---------------------------------------------------------------------------
# /health
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str
    ollama_reachable: bool
    ollama_model: str
    embedding_model: str
