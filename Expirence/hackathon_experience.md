# 🏆 Our Hackathon Experience

## Tata Hackathon 2026 — Team [TASK]

---

## The Idea

We didn't want to build another "AI quiz generator" that just spits out generic questions from a topic name. Every one of us has sat through a lecture, nodded along, and then completely blanked when actually tested on it — and every teacher we talked to said the same thing from the other side: they have no real way to know if a class understood the material until the exam, by which point it's too late to fix anything.

So we built VerifyEdu around one constraint: every quiz question has to come from what the teacher actually uploaded, not the model's general knowledge — and grading has to measure understanding, not just whether a string matches.

---

## What We Built

A teacher creates a classroom, uploads a lecture PDF, and generates a quiz — 5 MCQs and 2 descriptive questions by default, both counts adjustable. Behind the scenes, the PDF is chunked, embedded, and the most relevant chunks are retrieved and fed to a locally-running LLM (Ollama) to generate questions grounded strictly in that content. Students attempt the quiz, and descriptive answers are scored using a blend of semantic similarity, keyword coverage, and concept coverage — not just keyword matching — to produce a real "understanding score" rather than a flat percentage.

Everything runs locally: Express + Prisma on the backend, a FastAPI microservice handling the RAG pipeline and LLM calls, and a React/Vite frontend tying it together.

---

## Challenges We Faced

### 🐢 Quiz generation was painfully slow

Our first working version took close to a minute to generate a single quiz — bad enough that we genuinely worried it'd kill the demo. Digging into the AI service logs, we found two compounding problems: we were running Qwen3, which is a "thinking" model by default and burns a chunk of every call on hidden reasoning before it writes a single token of actual output; and our `num_predict` token cap was set way too low for 5 MCQs plus 2 descriptive questions with explanations. When the model hit that cap mid-JSON, the response came back truncated, our parser failed, and the service silently retried the entire generation from scratch — so a slow call was sometimes happening *twice*.

We switched to `qwen2.5:7b-instruct` (a non-thinking instruct model) and raised the token limit, which cut generation time down dramatically and killed the retry loop entirely.

### 🎯 Correct answers were being marked wrong

This one was more embarrassing to find than to fix. A student would select the objectively correct MCQ option and still get 0 points. The bug was a field-name mismatch between our two services: the AI microservice returned the correct answer as `correct_answer` (full option text), but the backend's grading logic was checking against `q.correct_option` — a field that didn't exist — and comparing it directly against the student's selected *index*, which is a number, not text. It was failing silently instead of throwing an error, which made it much harder to spot at first.

Fixing it meant resolving the correct option's index by matching it against the actual `options` array, with fallback handling for cases where the model phrased the "correct answer" slightly differently than the option text itself (extra punctuation, a lettered answer like "B" instead of the full string, etc.) instead of relying on a fragile exact match.

### 🧩 Keeping the AI grounded instead of hallucinating

Early on, when we prompted the LLM with just "generate a quiz about X," it happily invented plausible-sounding facts that weren't in the source document at all — which completely defeats the point of a tool meant to measure whether students understood *the actual lecture*. We built a lightweight RAG layer instead: chunk the PDF into overlapping ~500–800 word sections, embed them, and retrieve only the chunks relevant to the quiz being generated, so the model is working from real source text every time rather than free-associating.

---

## What We Learned

- Local LLMs are genuinely usable for structured tasks like this, but only if you actively manage their failure modes — token limits, thinking overhead, and retry logic all have outsized effects on both speed and reliability.
- A silent field mismatch between two services is one of the nastiest bugs to track down, because nothing crashes — it just quietly returns the wrong answer. We're a lot more careful now about keeping our API contracts between the frontend, backend, and AI service explicit.
- Debugging across three different stacks (React, Node/Express, Python/FastAPI) at hackathon speed forces you to get fast at reading logs across all of them at once, not just the one you're most comfortable in.

---

## What's Next for VerifyEdu

- [ ] Multi-document quizzes spanning a full unit instead of a single PDF
- [ ] A teacher-facing analytics view showing class-wide concept gaps, not just individual scores
- [ ] OCR support for scanned/image-based PDFs
- [ ] An optional hosted-LLM mode for classrooms that want to scale beyond a local Ollama instance

---

## Closing Thoughts

We came in with a vague idea about "AI for education" and left with something we'd actually want a teacher to use. The bugs were frustrating in the moment — especially the MCQ grading one, since it made the whole app feel broken right up until we found it — but chasing them down as a team is honestly the part we'll remember most.

*— Team [TASK], Tata Hackathon 2026*
