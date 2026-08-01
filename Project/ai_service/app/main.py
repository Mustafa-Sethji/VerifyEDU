"""
VERIFYedu AI Service - FastAPI application entry point.

This is an independent AI/ML microservice. It has no authentication,
no database, no frontend, and no user/classroom management — the
backend team integrates with it purely over REST/JSON.

Run with:
    uvicorn app.main:app --reload --port 8001
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api import process_pdf, generate_quiz, evaluate_answer, health

app = FastAPI(
    title="VERIFYedu AI Service",
    description="Independent AI/ML microservice: PDF ingestion, RAG-grounded quiz "
    "generation, and ML-based answer evaluation. No auth, no database, no frontend.",
    version="1.0.0",
)

app.include_router(process_pdf.router, tags=["Processing"])
app.include_router(generate_quiz.router, tags=["Quiz"])
app.include_router(evaluate_answer.router, tags=["Evaluation"])
app.include_router(health.router, tags=["Health"])


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal AI service error: {str(exc)}"},
    )


@app.get("/")
async def root():
    return {
        "service": "VERIFYedu AI Service",
        "status": "running",
        "endpoints": ["/process-pdf", "/generate-quiz", "/evaluate-answer", "/health"],
    }
