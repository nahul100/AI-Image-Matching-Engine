require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const inputFile = path.join(
  __dirname,
  "..",
  "data",
  "images.json"
);

const outputFile = path.join(
  __dirname,
  "..",
  "data",
  "image_vectors.json"
);


// ================================
// CREATE EMBEDDING
// ================================

async function createEmbedding(text, jobId) {

  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {

    try {

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

      // Record successful API call
      await prisma.apiUsage.create({
        data: {
          service: "Google Gemini",
          model: "gemini-embedding-001",
          operation: "image_embedding",
          estimatedCostUsd:
            Number(
              process.env.EMBEDDING_COST_PER_CALL_USD || 0
            ),
          jobId
        }
      });

      return response.embeddings[0].values;

    } catch (error) {

      const message = error.message || "";

      const temporary =
        message.includes("503") ||
        message.includes("429") ||
        message.includes("500") ||
        message.includes("Service Unavailable");

      if (temporary && attempt < maxRetries) {

        await prisma.processingJob.update({
          where: {
            id: jobId
          },
          data: {
            retries: {
              increment: 1
            }
          }
        });

        const waitTime = attempt * 3000;

        console.log(
          `RETRY: embedding - attempt ${attempt + 1}/${maxRetries}`
        );

        await new Promise(
          (resolve) =>
            setTimeout(resolve, waitTime)
        );

      } else {

        throw error;

      }
    }
  }
}


// ================================
// MAIN BATCH
// ================================

async function main() {

  console.log(
    "\nIMAGE EMBEDDING BATCH STARTED\n"
  );

  const images = JSON.parse(
    fs.readFileSync(inputFile, "utf8")
  );

  // Create processing job
  const job =
    await prisma.processingJob.create({

      data: {

        jobType:
          "image_embedding",

        status:
          "running",

        totalItems:
          images.length,

        startedAt:
          new Date()

      }

    });

  console.log(
    `Job ID: ${job.id}`
  );

  console.log(
    `Total images: ${images.length}\n`
  );


  const results = [];

  let failed = 0;


  for (const image of images) {

    console.log(
      `Embedding: ${image.filename}`
    );

    const text = [
      image.subject,
      image.category,
      image.caption,
      ...image.attributes
    ].join(". ");


    try {

      const vector =
        await createEmbedding(
          text,
          job.id
        );

      results.push({

        filename:
          image.filename,

        text,

        embedding:
          vector

      });


      await prisma.processingJob.update({

        where: {
          id: job.id
        },

        data: {
          completed: {
            increment: 1
          }
        }

      });


      console.log(
        `SUCCESS: ${image.filename} → ${vector.length} dimensions`
      );


    } catch (error) {

      failed++;

      await prisma.processingJob.update({

        where: {
          id: job.id
        },

        data: {
          failed: {
            increment: 1
          }
        }

      });


      console.log(
        `FAILED: ${image.filename} - ${error.message}`
      );

    }

  }


  // Save vectors
  fs.writeFileSync(
    outputFile,
    JSON.stringify(
      results,
      null,
      2
    )
  );


  // Complete job
  await prisma.processingJob.update({

    where: {
      id: job.id
    },

    data: {

      status:
        failed === 0
          ? "completed"
          : "completed_with_errors",

      completedAt:
        new Date()

    }

  });


  console.log(
    "\nEMBEDDING CHECKPOINT"
  );

  console.log(
    `job_id=${job.id}`
  );

  console.log(
    `images_embedded=${results.length}`
  );

  console.log(
    `failed=${failed}`
  );

  console.log(
    "Output: data/image_vectors.json\n"
  );


  await prisma.$disconnect();

}


main()
  .catch(async (error) => {

    console.error(
      "BATCH ERROR:",
      error
    );

    await prisma.$disconnect();

    process.exit(1);

  });