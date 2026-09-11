const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createEmbedding(text) {
  const { GoogleGenAI } = await import("@google/genai");

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text
  });

  return response.embeddings[0].values;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

async function main() {
  const evalFile = path.join(__dirname, "..", "data", "eval.json");

  const evaluationSet = JSON.parse(
    fs.readFileSync(evalFile, "utf8")
  );

  const images = await prisma.image.findMany({
    include: {
      embedding: true
    }
  });

  let correct = 0;

  console.log("\n=== Evaluation Results ===\n");

  for (const item of evaluationSet) {
    const postEmbedding = await createEmbedding(item.post);

    const ranked = images
      .filter(image => image.embedding)
      .map(image => ({
        filename: image.filename,
        score: cosineSimilarity(
          postEmbedding,
          JSON.parse(image.embedding.vector)
        )
      }))
      .sort((a, b) => b.score - a.score);

    const topResult = ranked[0];

    const isCorrect =
      topResult.filename === item.correct_image;

    if (isCorrect) {
      correct++;
    }

    console.log(`Post ${item.id}`);
    console.log(`Expected: ${item.correct_image}`);
    console.log(`Predicted: ${topResult.filename}`);
    console.log(`Score: ${topResult.score.toFixed(4)}`);
    console.log(`Result: ${isCorrect ? "PASS" : "FAIL"}`);
    console.log("--------------------------------");
  }

  const precision = correct / evaluationSet.length;

  console.log("\n=== Final Evaluation ===");
  console.log(`Total posts: ${evaluationSet.length}`);
  console.log(`Correct Top-1 predictions: ${correct}`);
  console.log(`Top-1 Precision: ${(precision * 100).toFixed(2)}%`);

  await prisma.$disconnect();
}

main().catch(async error => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});