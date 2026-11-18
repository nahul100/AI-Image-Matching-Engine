require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createEmbedding(text) {

  const { GoogleGenAI } =
    await import("@google/genai");

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  const response =
    await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text
    });

  return response.embeddings[0].values;
}

async function main() {

  console.log("\nPOST EMBEDDING JOB STARTED\n");

  // Find post
  const post =
    await prisma.post.findUnique({
      where: {
        id: 1
      }
    });

  if (!post) {
    throw new Error("Post 1 not found");
  }

  // Create processing job
  const job =
    await prisma.processingJob.create({
      data: {
        jobType: "post_embedding",
        status: "running",
        totalItems: 1,
        startedAt: new Date()
      }
    });

  console.log(`Job ID: ${job.id}`);
  console.log(`Post: ${post.title}`);

  try {

    const text =
      `${post.title}. ${post.content}`;

    const vector =
      await createEmbedding(text);

    // Track API call
    await prisma.apiUsage.create({
      data: {
        service: "Google Gemini",
        model: "gemini-embedding-001",
        operation: "post_embedding",
        estimatedCostUsd:
          Number(
            process.env.EMBEDDING_COST_PER_CALL_USD || 0
          ),
        jobId: job.id
      }
    });

    // Save embedding
    await prisma.postEmbedding.upsert({

      where: {
        postId: post.id
      },

      update: {
        vector: JSON.stringify(vector)
      },

      create: {
        postId: post.id,
        vector: JSON.stringify(vector)
      }

    });

    // Update job
    await prisma.processingJob.update({

      where: {
        id: job.id
      },

      data: {

        completed: 1,

        status: "completed",

        completedAt: new Date()

      }

    });

    console.log(
      `SUCCESS: Post ${post.id} → ${vector.length} dimensions`
    );

    console.log(
      `Job ${job.id} → completed`
    );

    console.log(
      "\nPOST EMBEDDING COMPLETE\n"
    );

  } catch (error) {

    await prisma.processingJob.update({

      where: {
        id: job.id
      },

      data: {

        failed: 1,

        status: "failed",

        completedAt: new Date()

      }

    });

    throw error;
  }
}

main()

  .catch((error) => {

    console.error(
      "POST EMBEDDING ERROR:",
      error.message
    );

    process.exit(1);

  })

  .finally(async () => {

    await prisma.$disconnect();

  });