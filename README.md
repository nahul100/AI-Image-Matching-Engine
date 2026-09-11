# AI Image Relevance & Auto-Tagging Engine

An AI-powered backend system that analyzes images, generates structured metadata, creates semantic embeddings, and recommends relevant images for blog posts.

The system uses vision-based classification, vector embeddings, semantic similarity, mismatch protection, background processing, review workflows, and automated evaluation.

---

## Features

- AI-powered image classification
- Structured metadata validation using Zod
- Confidence scoring for image analysis
- Automatic image caption and attribute generation
- Semantic image embeddings
- Semantic matching between blog posts and images
- Mismatch guard for incorrect recommendations
- Background processing with retry handling
- Processing job and API usage tracking
- Image recommendation API
- Review and approval/rejection workflow
- Automated tests
- Evaluation dataset with Top-1 precision measurement
- SQLite database using Prisma

---

## System Architecture

```text
                    ┌─────────────────────┐
                    │       Images        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Background Job       │
                    │ Image Classification │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Gemini Vision     │
                    │       Model         │
                    └──────────┬──────────┘
                               │
                               ▼
             ┌──────────────────────────────────┐
             │ Structured Metadata Validation   │
             │ subject / category / attributes  │
             │ caption / confidence             │
             └───────────────┬──────────────────┘
                             │
                             ▼
                    ┌─────────────────────┐
                    │   Image Metadata    │
                    │      Database       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Gemini Embeddings   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Image Vector Store │
                    └──────────┬──────────┘
                               │
                               │
        ┌────────────────────┐ │
        │     Blog Post      │ │
        └─────────┬──────────┘ │
                  │            │
                  ▼            │
        ┌────────────────────┐ │
        │ Post Embedding     │ │
        └─────────┬──────────┘ │
                  │            │
                  └──────┬─────┘
                         ▼
              ┌─────────────────────┐
              │ Semantic Similarity │
              │      Ranking        │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Mismatch Guard    │
              │                     │
              │ subject/category    │
              │ similarity threshold│
              │ confidence checks   │
              └──────────┬──────────┘
                         │
                    ┌────┴────┐
                    │         │
                    ▼         ▼
               Good Match   No Match
                    │         │
                    ▼         ▼
              Recommendation Explanation
                    │
                    ▼
              Review / Approval
```
## Tech Stack

- **Runtime:** Node.js
- **Backend:** Express.js
- **AI Vision:** Google Gemini Vision
- **Embeddings:** Google Gemini Embedding
- **Validation:** Zod
- **Database:** SQLite
- **ORM:** Prisma
- **File Upload:** Multer
- **Language:** JavaScript
- **API Testing:** PowerShell / REST API
- **Testing:** Node.js built-in `assert`

<img width="1536" height="1024" alt="ChatGPT Image Sep 11, 2026, 09_46_23 PM" src="https://github.com/user-attachments/assets/5d2bb437-5166-41c0-bfb7-4d217e07d51e" />
