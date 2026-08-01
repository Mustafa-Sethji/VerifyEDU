"""
Small JSON-file cache for per-document derived metadata (summary, keywords)
so that /generate-quiz only needs a document_id, without recomputing the
summary or re-sending the PDF.
"""

import json
from typing import Optional, TypedDict, List

from app.config import CACHE_DIR


class DocumentMeta(TypedDict):
    summary: str
    keywords: List[str]


def _meta_path(document_id: str):
    return CACHE_DIR / f"{document_id}.meta.json"


def save_document_meta(document_id: str, summary: str, keywords: List[str]) -> None:
    with open(_meta_path(document_id), "w", encoding="utf-8") as f:
        json.dump({"summary": summary, "keywords": keywords}, f)


def load_document_meta(document_id: str) -> Optional[DocumentMeta]:
    path = _meta_path(document_id)
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
