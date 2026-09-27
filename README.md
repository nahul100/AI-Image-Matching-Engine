# AI Image Relevance & Auto-Tagging Engine

An AI-powered backend system that analyzes images, generates structured metadata, creates semantic embeddings, and recommends relevant images for blog posts.

The system combines vision-based classification, structured output validation, semantic embeddings, similarity ranking, mismatch protection, background processing, retry handling, database persistence, human review, and automated evaluation.

---

## Features

- AI-powered image classification
- Structured metadata validation using Zod
- Confidence scoring for image analysis
- Automatic image caption and attribute generation
- Semantic image embeddings
- Semantic embeddings for blog posts
- Semantic matching between blog posts and images
- Cosine-similarity-based image ranking
- Mismatch guard for incorrect recommendations
- Similarity threshold filtering
- Low-confidence image flagging
- Background image processing with BullMQ
- Redis-based job queue
- Redis Cloud support
- Worker-based asynchronous processing
- Retry and exponential backoff handling
- Background job status tracking
- Job progress tracking
- API usage and estimated cost tracking
- Image metadata persistence using Prisma
- Image recommendation API
- Review and approval/rejection workflow
- Automated tests
- Evaluation dataset
- Top-1 precision evaluation
- SQLite database
- REST API

---

## System Architecture

```text
                         ┌─────────────────────┐
                         │       Image         │
                         │       Upload        │
                         └──────────┬──────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     │                             │
                     ▼                             ▼
          ┌─────────────────────┐       ┌─────────────────────┐
          │ Synchronous Workflow│       │ Background Workflow │
          │   /upload-match     │       │ /images/process     │
          └──────────┬──────────┘       └──────────┬──────────┘
                     │                             │
                     │                             ▼
                     │                  ┌─────────────────────┐
                     │                  │      BullMQ         │
                     │                  └──────────┬──────────┘
                     │                             │
                     │                             ▼
                     │                  ┌─────────────────────┐
                     │                  │    Redis Cloud      │
                     │                  └──────────┬──────────┘
                     │                             │
                     │                             ▼
                     │                  ┌─────────────────────┐
                     │                  │ Background Worker   │
                     │                  └──────────┬──────────┘
                     │                             │
                     └──────────────┬──────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    Gemini Vision    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                  ┌──────────────────────────────────┐
                  │ Structured Metadata Validation   │
                  │                                  │
                  │ subject                          │
                  │ category                         │
                  │ attributes                       │
                  │ caption                          │
                  │ confidence                       │
                  └───────────────┬──────────────────┘
                                  │
                                  ▼
                         ┌─────────────────────┐
                         │   Prisma + SQLite   │
                         │                     │
                         │ Image               │
                         │ Attributes          │
                         │ Embeddings          │
                         │ Jobs                │
                         │ API Usage           │
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
               ┌────────────────────┘
               │
               ▼
      ┌─────────────────────┐
      │      Blog Post      │
      └──────────┬──────────┘
                 │
                 ▼
      ┌─────────────────────┐
      │   Post Embedding    │
      └──────────┬──────────┘
                 │
                 ▼
      ┌─────────────────────┐
      │ Semantic Similarity │
      │       Ranking       │
      └──────────┬──────────┘
                 │
                 ▼
      ┌─────────────────────┐
      │    Mismatch Guard   │
      │                     │
      │ Subject/category    │
      │ Similarity threshold│
      │ Confidence checks   │
      └──────────┬──────────┘
                 │
            ┌────┴────┐
            │         │
            ▼         ▼
       Good Match   No Match
            │         │
            ▼         ▼
     Recommendation  Explanation
            │
            ▼
      Review Workflow
            │
       ┌────┴─────┐
       │          │
       ▼          ▼
    Approve     Reject
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
- **Queue:** BullMQ
- **Queue Storage:** Redis / Redis Cloud
- **Language:** JavaScript
- **API Testing:** PowerShell / REST API
- **Testing:** Node.js built-in `assert`

## Production-Oriented Design
The project demonstrates several production-oriented backend concepts:
- Asynchronous background processing
- Queue-based architecture
- Redis-backed job management
- Worker processes
- Retry handling
- Exponential backoff
- Job progress tracking
- Job status APIs
- Structured AI outputs
- Schema validation
- Confidence thresholds
- Database persistence
- API usage tracking
- Human-in-the-loop review
- Semantic vector search
- Automated evaluation

