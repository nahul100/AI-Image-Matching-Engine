require("dotenv").config();

const fs = require("fs");
const path = require("path");

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

// Load ESM package from CommonJS
async function getAI() {
  const { GoogleGenAI } = await import("@google/genai");

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });
}

async function createEmbedding(ai, text) {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text
  });

  return response.embeddings[0].values;
}

async function main() {

  console.log("\nIMAGE EMBEDDING STARTED\n");

  const ai = await getAI();

  const images = JSON.parse(
    fs.readFileSync(inputFile, "utf8")
  );

  const results = [];

  for (const image of images) {

    console.log(`Embedding: ${image.filename}`);

    const text = [
      image.subject,
      image.category,
      image.caption,
      ...image.attributes
    ].join(". ");

    try {

      const vector = await createEmbedding(ai, text);

      results.push({
        filename: image.filename,
        text,
        embedding: vector
      });

      console.log(
        `SUCCESS: ${image.filename} → ${vector.length} dimensions`
      );

    } catch (error) {

      console.log(
        `FAILED: ${image.filename} - ${error.message}`
      );
    }
  }

  fs.writeFileSync(
    outputFile,
    JSON.stringify(results, null, 2)
  );

  console.log("\nEMBEDDING CHECKPOINT");
  console.log(`images_embedded=${results.length}`);
  console.log(`Output: data/image_vectors.json\n`);
}

main();