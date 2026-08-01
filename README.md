<div align="center">

# ✨ VerifyEdu

### AI-Powered Classroom & Understanding Verification Platform

*Upload a lecture PDF. Get an AI-generated quiz in seconds. Know exactly how well your students actually understood it.*

[![Node.js](https://img.shields.io/badge/Backend-Express.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/AI_Service-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Ollama](https://img.shields.io/badge/LLM-Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 🎯 What is VerifyEdu?

VerifyEdu closes the gap between "I taught it" and "they got it."

A teacher creates a classroom and uploads a lecture PDF. VerifyEdu reads the document, runs it through a local LLM (via Ollama), and generates a mixed quiz — multiple choice **and** descriptive/applied questions — grounded entirely in that document's content. Students attempt the quiz, and instead of a single pass/fail score, they get a real **understanding score** built from semantic similarity, keyword coverage, and concept coverage between their answer and the source material.

No cloud LLM API keys. No sending student data anywhere. Everything — quiz generation, grading, and evaluation — runs locally.

---

## 🧠 How It Works

```
┌─────────────┐      1. Upload PDF       ┌──────────────────┐
│   Teacher    │ ───────────────────────▶ │   Express Backend │
└─────────────┘                          └────────┬──────────┘
                                                     │ stores + forwards
                                                     ▼
                                          ┌──────────────────┐
                                          │   AI Microservice │
                                          │     (FastAPI)     │
                                          │                    │
                                          │  • Chunk PDF text  │
                                          │  • Embed chunks    │
                                          │  • RAG retrieval   │
                                          │  • Ollama generate │
                                          └────────┬──────────┘
                                                     │ 5 MCQ + 2 descriptive
                                                     ▼
┌─────────────┐   2. Attempt Quiz        ┌──────────────────┐
│   Student    │ ◀─────────────────────── │   React Frontend  │
└──────┬──────┘                          └──────────────────┘
       │ 3. Submit answers
       ▼
┌────────────────────────────────────────────────────────┐
│  MCQ  → exact-match grading against reference document │
│  Descriptive → Semantic similarity + keyword coverage     │
│               + concept coverage → Understanding Score  │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Features

| | |
|---|---|
| 🏫 **Classrooms** | Teachers create classrooms; students join with a code |
| 📄 **PDF Ingestion** | Upload lecture material, auto-chunked and embedded for retrieval |
| 🤖 **AI Quiz Generation** | Local LLM (Qwen 2.5, via Ollama) generates MCQ + descriptive questions grounded in the uploaded document — no hallucinated content |
| 🎚️ **Configurable Quizzes** | Teachers control MCQ count and descriptive question count per quiz |
| ✅ **Accurate MCQ Grading** | Robust answer matching handles text, lettered, and loosely-formatted correct answers |
| 📊 **Understanding Score** | Descriptive answers scored via semantic similarity (sentence embeddings) + TF-IDF keyword coverage + concept-term coverage — not just keyword matching |
| 📈 **Analytics & History** | Students and teachers track quiz performance over time |
| 🔔 **Notifications** | In-app notifications for classroom activity |
| 🔐 **Auth** | JWT-based auth with Teacher/Student roles |

---

## 🏗️ Tech Stack

**Frontend** — React 18 · Vite · Tailwind CSS · React Router · Chart.js · Lucide Icons

**Backend** — Node.js · Express · Prisma ORM · SQLite · JWT · Multer (file uploads)

**AI Service** — FastAPI · Ollama (Qwen 2.5 7B Instruct) · Sentence-Transformers (`all-MiniLM-L6-v2`) · FAISS · scikit-learn · PyMuPDF

---

## 📂 Project Structure

```
VerifyEdu/
├── frontend/          # React + Vite client
│   └── src/
│       ├── pages/         # Dashboard, Classroom, Quiz Attempt, Results, etc.
│       ├── components/    # Shared UI components (Navbar, Sidebar, cards)
│       ├── context/        # Auth & Notification context providers
│       └── services/       # API client layer
│
├── backend/            # Express REST API
│   ├── controllers/       # Route logic (auth, classroom, quiz, results)
│   ├── routes/             # Express routers
│   ├── prisma/             # Prisma schema & migrations
│   ├── middleware/         # Auth guards, error handling
│   └── services/           # AI-service client
│
└── ai_service/         # FastAPI microservice
    └── app/
        ├── services/       # PDF chunking, embeddings, RAG, quiz generation, evaluation
        ├── prompts/         # LLM prompt templates
        ├── models/          # Pydantic schemas
        └── config.py        # Central config (model, weights, chunk sizes)
```

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **[Ollama](https://ollama.com/download)** installed and running locally

### 1. Pull the LLM

```bash
ollama pull qwen2.5:7b-instruct
```

### 2. AI Microservice

```bash
cd ai_service
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt --break-system-packages

uvicorn app.main:app --reload --port 8001
```

### 3. Backend

```bash
cd backend
npm install

npx prisma generate
npx prisma db push

npm run dev      # nodemon, auto-restarts on save
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Open the app

```
http://localhost:5173
```

> All three services need to be running simultaneously for the app to work end-to-end: Ollama (background), AI service (`:8001`), backend (`:5001`), frontend (`:5173`).

---

## 🔬 The Understanding Score

Descriptive answers aren't graded with a simple keyword match. Each submission is scored on three signals, weighted and combined:

- **Semantic Similarity** — cosine similarity between sentence embeddings of the student's answer and the reference material
- **Keyword Coverage** — TF-IDF overlap of key terms from the source document
- **Concept Coverage** — overlap of extracted concept-terms, rewarding genuine understanding over verbatim copying

The combined score is what powers the per-student "understanding level" shown in analytics — a more honest signal than a raw quiz percentage.

---

## 👥 Team

Team name- TASK //

Team name-  Mustafa Sethjiwala,
            Subham Kumar Gupta,
            Sneha Arya

## 🏆 Built For

Tata Hackathon 2026
# VerifyEDU
