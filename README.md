# AI Image Relevance & Auto-Tagging Engine

A backend image relevance and auto-tagging system. First, a vision model analyzes images and produces structured metadata, which I validate using Zod. I then generate embeddings and use cosine similarity for semantic matching between blog posts and images. To prevent semantically incorrect recommendations, I implemented a mismatch guard based on the detected subject and similarity threshold.

For processing large numbers of images, I implemented BullMQ with Redis Cloud. Instead of making the API wait for expensive AI operations, the API creates a background job and immediately returns a job ID. A separate worker consumes the job, calls the vision model, validates the result, and stores it in PostgreSQL/SQLite through Prisma. I also added retries, job status tracking, and API cost tracking. This architecture is similar to production systems because API requests and resource-intensive background workloads are separated and workers can be scaled independently.
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

## Scaling Using Redis Queue
I can horizontally scale my background processing by running multiple instances of the same worker. Redis acts as the shared queue, and BullMQ coordinates which worker processes each job. I don't need to create separate worker files.

                              Redis 
                    ┌───────────┼───────────┐
                    ↓           ↓           ↓
                 Worker 1    Worker 2    Worker 3
                  2 jobs      2 jobs      2 jobs
                 at once     at once     at once