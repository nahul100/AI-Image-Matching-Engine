const fs = require("fs");
const path = require("path");

const vectorsFile = path.join(
  __dirname,
  "..",
  "data",
  "image_vectors.json"
);

// Cosine similarity
function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return (
    dotProduct /
    (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))
  );
}

// Rank images against a query embedding
function rankImages(queryEmbedding) {
  const images = JSON.parse(
    fs.readFileSync(vectorsFile, "utf8")
  );

  return images
    .map((image) => ({
      filename: image.filename,
      text: image.text,
      score: Number(
        cosineSimilarity(
          queryEmbedding,
          image.embedding
        ).toFixed(4)
      )
    }))
    .sort((a, b) => b.score - a.score);
}

module.exports = {
  cosineSimilarity,
  rankImages
};