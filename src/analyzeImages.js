require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { z } = require("zod");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3.6-flash"
});

const imagesDir = path.join(__dirname, "..", "images");
const outputFile = path.join(
  __dirname,
  "..",
  "data",
  "images.json"
);

// ===============================
// Schema
// ===============================

const ImageSchema = z.object({
  subject: z.string().min(1),
  category: z.string().min(1),
  attributes: z.array(z.string()).min(1),
  caption: z.string().min(1),
  confidence: z.number().min(0).max(1)
});

// ===============================
// Convert image to Gemini format
// ===============================

function imageToGenerativePart(filePath) {
  const imageData = fs.readFileSync(filePath).toString("base64");

  const extension = path.extname(filePath).toLowerCase();

  let mimeType = "image/jpeg";

  if (extension === ".png") {
    mimeType = "image/png";
  }

  return {
    inlineData: {
      data: imageData,
      mimeType
    }
  };
}

// ===============================
// Wait helper
// ===============================

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ===============================
// Analyze one image with retry
// ===============================

async function analyzeImage(filePath) {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const imagePart = imageToGenerativePart(filePath);

      const prompt = `
Analyze this image and return ONLY valid JSON.

Use exactly this structure:

{
  "subject": "main subject",
  "category": "animal",
  "attributes": ["attribute 1", "attribute 2", "attribute 3"],
  "caption": "A short description of the image",
  "confidence": 0.94
}

Rules:
- subject must identify the main visible subject.
- category should describe the broad category.
- attributes should contain useful visual characteristics.
- caption should briefly describe the image.
- confidence must be a number between 0 and 1.
- Do not guess when the image is unclear.
- Return JSON only.
`;

      const result = await model.generateContent([
        prompt,
        imagePart
      ]);

      const text = result.response.text();

      // Remove possible markdown code fences
      const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleanedText);

      // Validate with Zod
      const validated = ImageSchema.parse(parsed);

      // Low-confidence flag
      const status =
        validated.confidence < 0.70
          ? "low_confidence"
          : "accepted";

      return {
        ...validated,
        status
      };

    } catch (error) {

      const errorMessage = error.message || "";

      const isTemporaryError =
        errorMessage.includes("503") ||
        errorMessage.includes("429") ||
        errorMessage.includes("500") ||
        errorMessage.includes("Service Unavailable");

      if (isTemporaryError && attempt < maxRetries) {

        const waitTime = attempt * 3000;

        console.log(
          `RETRY: ${path.basename(filePath)} - attempt ${attempt + 1}/${maxRetries} after ${waitTime / 1000}s`
        );

        await wait(waitTime);

      } else {
        throw error;
      }
    }
  }
}

// ===============================
// Main batch processing
// ===============================

async function main() {

  console.log("\nIMAGE CLASSIFICATION STARTED\n");

  const files = fs
    .readdirSync(imagesDir)
    .filter((file) =>
      [".jpg", ".jpeg", ".png"].includes(
        path.extname(file).toLowerCase()
      )
    );

  const results = [];

  let accepted = 0;
  let lowConfidence = 0;
  let failed = 0;

  for (const file of files) {

    const filePath = path.join(imagesDir, file);

    console.log(`Analyzing: ${file}`);

    try {

      const analysis = await analyzeImage(filePath);

      results.push({
        filename: file,
        ...analysis
      });

      if (analysis.status === "low_confidence") {
        lowConfidence++;
      } else {
        accepted++;
      }

      console.log(
        `SUCCESS: ${file} → ${analysis.status}`
      );

    } catch (error) {

      failed++;

      console.log(
        `FAILED: ${file} - ${error.message}`
      );
    }
  }

  // Save results
  fs.writeFileSync(
    outputFile,
    JSON.stringify(results, null, 2)
  );

  console.log("\nCLASSIFICATION CHECKPOINT");
  console.log(`images_processed=${results.length}`);
  console.log(`accepted=${accepted}`);
  console.log(`low_confidence=${lowConfidence}`);
  console.log(`failed=${failed}`);
  console.log(`Output: data/images.json\n`);
}

main();