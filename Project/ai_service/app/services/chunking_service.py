"""
Service 2 - Chunking

Splits cleaned document text into semantic chunks of 500-800 words with a
50-word overlap between consecutive chunks. Sentences are never split in
half: chunk boundaries always fall on sentence boundaries.
"""

from typing import List

from app.config import CHUNK_MIN_WORDS, CHUNK_MAX_WORDS, CHUNK_OVERLAP_WORDS
from app.utils.text_cleaning import split_into_sentences


def chunk_text(
    text: str,
    min_words: int = CHUNK_MIN_WORDS,
    max_words: int = CHUNK_MAX_WORDS,
    overlap_words: int = CHUNK_OVERLAP_WORDS,
) -> List[str]:
    """
    Greedily accumulate sentences into chunks until the target word-count
    window [min_words, max_words] is reached, then start the next chunk by
    overlapping the last `overlap_words` words of the previous chunk.
    """
    sentences = split_into_sentences(text)
    if not sentences:
        return []

    sentence_word_counts = [len(s.split()) for s in sentences]

    chunks: List[str] = []
    current_sentences: List[str] = []
    current_word_count = 0
    i = 0

    while i < len(sentences):
        sentence = sentences[i]
        sentence_words = sentence_word_counts[i]

        current_sentences.append(sentence)
        current_word_count += sentence_words
        i += 1

        reached_target = current_word_count >= min_words
        is_last_sentence = i >= len(sentences)

        if reached_target or is_last_sentence:
            chunk_text_value = " ".join(current_sentences).strip()
            if chunk_text_value:
                chunks.append(chunk_text_value)

            if is_last_sentence:
                break

            # Build overlap: walk backwards from the end of current_sentences
            # collecting whole sentences until we have >= overlap_words words.
            overlap_sentences: List[str] = []
            overlap_word_count = 0
            for sent in reversed(current_sentences):
                overlap_sentences.insert(0, sent)
                overlap_word_count += len(sent.split())
                if overlap_word_count >= overlap_words:
                    break

            current_sentences = list(overlap_sentences)
            current_word_count = overlap_word_count

    return chunks


def build_chunk_records(chunks: List[str]) -> List[dict]:
    """
    Attach a stable numeric ID and word count to each chunk for API responses
    and downstream embedding storage.
    """
    return [
        {"chunk_id": idx, "text": chunk, "word_count": len(chunk.split())}
        for idx, chunk in enumerate(chunks)
    ]
