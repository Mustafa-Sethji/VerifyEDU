"""
Quiz generation orchestration.

Combines Service 4 (RAG context) + Service 5 (Ollama) + strict prompt rules
to produce quiz JSON matching app.models.schemas.QuizResponse, with
validation and one retry on malformed output.
"""

import json
import re
from typing import List

from pydantic import ValidationError

from app.config import NUM_MCQ_QUESTIONS, NUM_DESCRIPTIVE_QUESTIONS, RAG_TOP_K_CHUNKS
from app.models.schemas import QuizResponse
from app.prompts.quiz_prompt import build_quiz_prompt, QUIZ_SYSTEM_PROMPT
from app.services import rag_service, ollama_service


class QuizGenerationError(Exception):
    """Raised when the LLM fails to produce valid quiz JSON after retries."""


def _strip_code_fences(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _parse_quiz_json(raw_text: str) -> QuizResponse:
    cleaned = _strip_code_fences(raw_text)
    # Some local models wrap JSON in extra prose despite instructions;
    # try to isolate the outermost JSON object as a fallback.
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if not match:
            raise
        data = json.loads(match.group(0))

    return QuizResponse(**data)


def generate_quiz(
    document_id: str,
    summary: str,
    keywords: List[str],
    num_mcq: int = None,
    num_descriptive: int = None,
) -> QuizResponse:
    """
    Generate a quiz grounded in the document's retrieved chunks. Retries
    once with a corrective instruction if the model's output isn't valid
    JSON matching the required schema.
    """
    num_mcq = num_mcq if num_mcq is not None else NUM_MCQ_QUESTIONS
    num_descriptive = num_descriptive if num_descriptive is not None else NUM_DESCRIPTIVE_QUESTIONS

    relevant_chunks = rag_service.build_quiz_context(
        document_id=document_id,
        summary=summary,
        keywords=keywords,
        top_k=RAG_TOP_K_CHUNKS,
    )

    prompt = build_quiz_prompt(
        summary=summary,
        keywords=keywords,
        relevant_chunks=relevant_chunks,
        num_mcq=num_mcq,
        num_descriptive=num_descriptive,
    )

    last_error = None
    for attempt in range(2):
        raw_output = ollama_service.generate(
            prompt=prompt,
            system=QUIZ_SYSTEM_PROMPT,
            temperature=0.4,
            json_mode=True,
        )
        try:
            return _parse_quiz_json(raw_output)
        except (json.JSONDecodeError, ValidationError) as exc:
            last_error = exc
            prompt = (
                prompt
                + "\n\nYour previous response was not valid JSON matching the required "
                "schema. Return ONLY the JSON object, with no extra text."
            )

    raise QuizGenerationError(f"Model failed to produce valid quiz JSON: {last_error}")
