const fs = require("fs");
const path = require("path");
const { z } = require("zod");
const imageRepository = require("../repositories/imageRepository");
const geminiService = require("./geminiService");

const ImageSchema = z.object({
  subject: z.string().min(1),
  category: z.string().min(1),
  attributes: z.array(z.string()).min(1),
  caption: z.string().min(1),
  confidence: z.number().min(0).max(1)
});

function isTemporaryError(error) {
  const message = error.message || "";
  return ["503", "429", "500", "Service Unavailable"]
    .some((value) => message.includes(value));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processImage(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const parsed = await geminiService.analyzeImage(imageBuffer);
      const validated = ImageSchema.parse(parsed);
      const status = validated.confidence < 0.70 ? "low_confidence" : "approved";

      await imageRepository.upsertAnalyzedImage(path.basename(imagePath), {
        ...validated,
        status
      });

      return validated;
    } catch (error) {
      if (!isTemporaryError(error) || attempt === 3) {
        throw error;
      }
      await sleep(2000 * attempt);
    }
  }
}

module.exports = { processImage };
