const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { z } = require("zod");

const ImageSchema = z.object({
  subject: z.string().min(1),
  category: z.string().min(1),
  attributes: z.array(z.string()).min(1),
  caption: z.string().min(1),
  confidence: z.number().min(0).max(1)
});

function isTemporaryError(error) {
  const message = error.message || "";

  return (
    message.includes("503") ||
    message.includes("429") ||
    message.includes("500")
  );
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processImage(imagePath) {
  // const imagePath = path.join(
  //   __dirname,
  //   "..",
  //   "images",
  //   filename
  // );

  console.log(`Processing image: ${imagePath}`);

  const imageBuffer = fs.readFileSync(imagePath);

  const { GoogleGenerativeAI } =
    require("@google/generative-ai");

  const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
  );

  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash"
  });

  const prompt = `
Analyze this image and return ONLY valid JSON.

Required fields:
- subject
- category
- attributes
- caption
- confidence

confidence must be a number between 0 and 1.
`;

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Gemini attempt ${attempt}/${maxAttempts}`);

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: "image/jpeg"
          }
        }
      ]);

      const text = result.response.text();

      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleaned);

      const validated = ImageSchema.parse(parsed);
      

      const status =
  validated.confidence < 0.70
    ? "low_confidence"
    : "approved";

const image = await prisma.image.upsert({
  where: {
    filename: path.basename(imagePath)
  },
  update: {
    subject: validated.subject,
    category: validated.category,
    caption: validated.caption,
    confidence: validated.confidence,
    status
  },
  create: {
    filename: path.basename(imagePath),
    subject: validated.subject,
    category: validated.category,
    caption: validated.caption,
    confidence: validated.confidence,
    status
  }
});

await prisma.imageAttribute.deleteMany({
  where: {
    imageId: image.id
  }
});

await prisma.imageAttribute.createMany({
  data: validated.attributes.map((attribute) => ({
    value: attribute,
    imageId: image.id
  }))
});

console.log(`Saved ${image.filename} to database`);

      console.log(
        `Confidence: ${validated.confidence} (${status})`
      );

      return validated;

    } catch (error) {

      console.log(
        `Attempt ${attempt} failed: ${error.message}`
      );

      if (
        !isTemporaryError(error) ||
        attempt === maxAttempts
      ) {
        throw error;
      }

      const delay = 2000 * attempt;

      console.log(
        `Retrying in ${delay / 1000} seconds...`
      );

      await sleep(delay);
    }
  }
}

module.exports = {
  processImage
};