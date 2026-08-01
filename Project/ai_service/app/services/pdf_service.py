"""
Service 1 - PDF Processing

Extracts raw text per page from an uploaded PDF using PyMuPDF (fitz),
then delegates cleaning (removing headers/footers/page numbers and
normalizing whitespace) to app.utils.text_cleaning.
"""

from typing import List

import fitz  # PyMuPDF

from app.utils.text_cleaning import clean_pages


class PdfExtractionError(Exception):
    """Raised when a PDF cannot be opened or contains no extractable text."""


def extract_pages(file_bytes: bytes) -> List[str]:
    """
    Open a PDF from raw bytes and return a list of per-page raw text strings.
    """
    try:
        document = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as exc:  # PyMuPDF raises its own exception types
        raise PdfExtractionError(f"Could not open PDF: {exc}") from exc

    pages = []
    try:
        for page in document:
            pages.append(page.get_text("text"))
    finally:
        document.close()

    if not any(p.strip() for p in pages):
        raise PdfExtractionError(
            "No extractable text found in PDF (it may be a scanned/image-only document)."
        )

    return pages


def extract_and_clean_text(file_bytes: bytes) -> str:
    """
    Full Service 1 pipeline: extract per-page text, then clean it
    (strip headers, footers, page numbers, extra whitespace).
    """
    pages = extract_pages(file_bytes)
    return clean_pages(pages)
