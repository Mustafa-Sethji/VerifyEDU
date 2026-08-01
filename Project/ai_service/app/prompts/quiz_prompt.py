"""
Prompt templates for quiz generation.

The prompt is deliberately strict: it forbids outside-knowledge questions
and instructs the model to rewrite facts into fill-in-the-blank / applied
phrasing rather than dictionary-style "Define X" questions.
"""

QUIZ_SYSTEM_PROMPT = """You are an exam question generator. You create quiz questions \
STRICTLY grounded in the provided document context. You never introduce facts, \
definitions, or examples that are not explicitly present in the given context. \
You always respond with valid JSON only — no markdown fences, no commentary, no preamble."""


def build_quiz_prompt(
    summary: str,
    keywords: list,
    relevant_chunks: list,
    num_mcq: int,
    num_descriptive: int,
) -> str:
    keywords_str = ", ".join(keywords) if keywords else "none extracted"
    chunks_str = "\n\n".join(f"[Chunk {i+1}]\n{chunk}" for i, chunk in enumerate(relevant_chunks))

    return f"""Using ONLY the material below, generate a quiz.

=== DOCUMENT SUMMARY ===
{summary}

=== KEY TERMS ===
{keywords_str}

=== RELEVANT DOCUMENT CHUNKS ===
{chunks_str}

=== RULES ===
1. Every question's answer MUST exist explicitly inside the document chunks above.
2. NEVER ask about outside knowledge, even if it seems related.
3. Do NOT write dictionary-style "Define X" or "What is X?" questions.
   Instead rewrite the fact into a fill-in-the-blank or applied statement, e.g.:
   - Bad: "What is a process?"
   - Good: "According to the uploaded document, an operating system consists of multiple ______."
   - Bad: "Define Bias."
   - Good: "Which statement correctly explains the role of bias according to the uploaded document?"
4. Generate exactly {num_mcq} multiple-choice questions, each with exactly 4 options
   where only one is correct according to the document.
5. Generate exactly {num_descriptive} descriptive questions, each with a reference
   answer taken directly from the document content.
6. Assign a difficulty of "easy", "medium", or "hard" to every question.
7. Provide a short explanation for each MCQ referencing why the correct answer is correct.

=== OUTPUT FORMAT ===
Return ONLY valid JSON matching exactly this structure, with no extra text:
{{
  "mcq": [
    {{
      "question": "",
      "options": ["", "", "", ""],
      "correct_answer": "",
      "difficulty": "",
      "explanation": ""
    }}
  ],
  "descriptive": [
    {{
      "question": "",
      "reference_answer": "",
      "difficulty": ""
    }}
  ]
}}
"""


SUMMARY_SYSTEM_PROMPT = """You are a precise technical summarizer. You summarize ONLY the \
content given to you, without adding outside knowledge. You respond with plain text only."""


def build_summary_prompt(chunks: list) -> str:
    joined = "\n\n".join(chunks)
    return f"""Summarize the following document content in 4-6 concise sentences. \
Only use information present in the text below. Do not add outside knowledge.

=== CONTENT ===
{joined}

=== SUMMARY ===
"""
