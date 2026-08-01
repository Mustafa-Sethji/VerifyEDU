"""
POST /process-pdf

Receives an uploaded PDF, extracts and cleans its text, chunks it,
generates embeddings, builds a FAISS index, and returns a grounded
summary, keywords, and the chunk list.
"""

import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.models.schemas import ProcessPdfResponse, ChunkOut
from app.services import pdf_service, chunking_service, embedding_service, rag_service
from app.utils.document_cache import save_document_meta

router = APIRouter()


@router.post("/process-pdf", response_model=ProcessPdfResponse)
async def process_pdf(file: UploadFile = File(...)):
    if file.content_type not in ("application/pdf", "application/x-pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        cleaned_text = pdf_service.extract_and_clean_text(file_bytes)
    except pdf_service.PdfExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    chunks = chunking_service.chunk_text(cleaned_text)
    if not chunks:
        raise HTTPException(status_code=422, detail="Could not derive any chunks from the document.")

    document_id = uuid.uuid4().hex
    embeddings = embedding_service.build_and_store_index(document_id, chunks)

    summary = rag_service.summarize_document(chunks)
    keywords = rag_service.extract_document_keywords(cleaned_text)
    save_document_meta(document_id, summary=summary, keywords=keywords)

    chunk_records = chunking_service.build_chunk_records(chunks)

    return ProcessPdfResponse(
        document_id=document_id,
        summary=summary,
        keywords=keywords,
        chunks=[ChunkOut(**record) for record in chunk_records],
        num_chunks=len(chunks),
        embedding_dim=int(embeddings.shape[1]),
    )
