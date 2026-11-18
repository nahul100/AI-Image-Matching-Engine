const { GoogleGenerativeAI } = require("@google/generative-ai");

async function createEmbedding(text) {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text
  });

  return response.embeddings[0].values;
}

async function analyzeImage(imageBuffer, mimetype) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
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

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: mimetype || "image/jpeg"
      }
    }
  ]);

  const cleaned = result.response.text()
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

async function analyzeUploadedImage(imageBuffer, mimetype) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
  const prompt = `
Analyze this image.
Return ONLY valid JSON in exactly this format:
{
  "subject": "main subject",
  "category": "broad category",
  "description": "short description",
  "tags": ["tag1", "tag2", "tag3"]
}
Do not use markdown.
Do not include any explanation outside JSON.
`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: mimetype || "image/jpeg"
      }
    }
  ]);
  const cleaned = result.response.text()
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

module.exports = {
  analyzeImage,
  analyzeUploadedImage,
  createEmbedding
};
