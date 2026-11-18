const fs = require("fs");
const path = require("path");
const imageRepository = require("../repositories/imageRepository");
const geminiService = require("./geminiService");
const { checkMismatch } = require("../matching/mismatchGuard");

function cosineSimilarity(a, b) {
  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  if (!magnitudeA || !magnitudeB) return 0;
  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

async function matchText(query) {
  const queryEmbedding = await geminiService.createEmbedding(query);
  const vectorFile = path.join(__dirname, "..", "..", "data", "image_vectors.json");
  const metadataFile = path.join(__dirname, "..", "..", "data", "images.json");
  const vectors = JSON.parse(fs.readFileSync(vectorFile, "utf8"));
  const metadata = JSON.parse(fs.readFileSync(metadataFile, "utf8"));

  return vectors
    .map((image) => {
      const item = metadata.find((entry) => entry.filename === image.filename);
      const result = {
        filename: image.filename,
        text: image.text,
        score: Number(cosineSimilarity(queryEmbedding, image.embedding).toFixed(4))
      };
      const guard = checkMismatch(query, item || { subject: "", category: "" });
      return { ...result, guard };
    })
    .sort((a, b) => b.score - a.score);
}

async function analyzeAndMatchUpload(imagePath, mimetype) {
  const buffer = fs.readFileSync(imagePath);
  const analysis = await geminiService.analyzeUploadedImage(buffer, mimetype);
  const query = [
    analysis.subject,
    analysis.category,
    analysis.description,
    ...(analysis.tags || [])
  ].join(". ");
  const matches = await matchText(query);
  return { analysis, matches };
}

async function matchPost(postId) {
  const post = await imageRepository.findPostWithEmbedding(postId);
  if (!post) throw new Error("Post not found");
  if (!post.embedding) throw new Error("Post does not have an embedding");

  const postVector = JSON.parse(post.embedding.vector);
  const images = await imageRepository.findImagesWithEmbeddings();
  const results = images
    .filter((image) => image.embedding)
    .map((image) => {
      const score = cosineSimilarity(postVector, JSON.parse(image.embedding.vector));
      return {
        imageId: image.id,
        filename: image.filename,
        subject: image.subject,
        category: image.category,
        score: Number(score.toFixed(4))
      };
    })
    .sort((a, b) => b.score - a.score);

  return results;
}

module.exports = {
  analyzeAndMatchUpload,
  cosineSimilarity,
  matchPost,
  matchText
};
