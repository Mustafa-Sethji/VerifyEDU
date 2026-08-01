"""
Text-cleaning utilities.

Removes extraction artifacts commonly introduced by PDF -> text conversion:
extra whitespace, repeated headers/footers, and page numbers.
"""

import re
from collections import Counter
from typing import List


PAGE_NUMBER_PATTERN = re.compile(r"^\s*(page\s*)?\d{1,4}\s*(/\s*\d{1,4})?\s*$", re.IGNORECASE)


def _normalize_whitespace(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _detect_repeated_lines(pages: List[str], min_occurrence_ratio: float = 0.4) -> set:
    """
    Lines that repeat near-identically across a large fraction of pages are
    almost always headers or footers, so we mark them for removal.
    """
    line_counts = Counter()
    for page in pages:
        seen_this_page = set()
        for raw_line in page.split("\n"):
            line = raw_line.strip()
            if not line or len(line) > 120:
                continue
            if line not in seen_this_page:
                line_counts[line] += 1
                seen_this_page.add(line)

    if not pages:
        return set()

    threshold = max(2, int(len(pages) * min_occurrence_ratio))
    return {line for line, count in line_counts.items() if count >= threshold}


def clean_pages(pages: List[str]) -> str:
    """
    Given raw per-page text extracted from a PDF, strip headers, footers,
    page numbers, and normalize whitespace, then join into one document.
    """
    repeated_lines = _detect_repeated_lines(pages)

    cleaned_pages = []
    for page in pages:
        kept_lines = []
        for raw_line in page.split("\n"):
            line = raw_line.strip()
            if not line:
                continue
            if line in repeated_lines:
                continue
            if PAGE_NUMBER_PATTERN.match(line):
                continue
            kept_lines.append(line)
        cleaned_pages.append(" ".join(kept_lines))

    joined = "\n\n".join(p for p in cleaned_pages if p)
    return _normalize_whitespace(joined)


def split_into_sentences(text: str) -> List[str]:
    """
    Lightweight sentence splitter (no heavy NLP dependency required).
    Good enough for chunk-boundary decisions; not intended for linguistic analysis.
    """
    text = text.strip()
    if not text:
        return []
    # Split on sentence-ending punctuation followed by whitespace + capital/number/quote,
    # while avoiding common abbreviations like "e.g." or "Fig."
    sentence_endings = re.compile(r"(?<!\b[A-Z])(?<![A-Za-z]\.[A-Za-z]\.)(?<=[.!?])\s+(?=[A-Z0-9\"'])")
    sentences = sentence_endings.split(text)
    return [s.strip() for s in sentences if s.strip()]
