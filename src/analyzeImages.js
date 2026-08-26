const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { z } = require("zod");

dotenv.config();

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-3.6-flash"
});

const imagesDir = path.join(__dirname, "..", "images");
const dataDir = path.join(__dirname, "..", "data");
const outputFile = path.join(dataDir, "images.json");

const ImageSchema = z.object({
  subject: z.string(),
  category: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  confidence: z.number().min(0).max(1)
});

async function analyzeImage(filename) {
  const imagePath = path.join(imagesDir, filename);

  const imageBuffer = fs.readFileSync(imagePath);

  const imageBase64 = imageBuffer.toString("base64");

  const mimeType =
    filename.endsWith(".png")
      ? "image/png"
      : "image/jpeg";

  const prompt = `
Analyze this image and return ONLY valid JSON.

Use exactly this structure:

{
  "subject": "main subject",
  "category": "broad category",
  "description": "short description of the image",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.95
}

Rules:
- confidence must be a number between 0 and 1
- tags must be an array of strings
- do not use markdown
- do not include explanations outside the JSON
`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: imageBase64,
        mimeType
      }
    }
  ]);

  const responseText = result.response.text();

  const cleanText = responseText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const parsedData = JSON.parse(cleanText);

  const validatedData =
    ImageSchema.parse(parsedData);

  return {
    filename,
    ...validatedData
  };
}

async function main() {
  console.log("\nANALYZING IMAGES...\n");

  const files = fs.readdirSync(imagesDir);

  const imageFiles = files.filter((file) =>
    /\.(jpg|jpeg|png)$/i.test(file)
  );

  const results = [];

  for (const file of imageFiles) {
    try {
      console.log(`Analyzing: ${file}`);

      const result =
        await analyzeImage(file);

      results.push(result);

      console.log(
        `SUCCESS: ${file}`
      );

    } catch (error) {
      console.error(
        `FAILED: ${file} - ${error.message}`
      );
    }
  }

  fs.mkdirSync(dataDir, {
    recursive: true
  });

  fs.writeFileSync(
    outputFile,
    JSON.stringify(
      results,
      null,
      2
    )
  );

  console.log("\nCHECKPOINT");
  console.log(
    `images_processed=${results.length}`
  );

  console.log(
    `Output saved to: data/images.json`
  );
}

main();