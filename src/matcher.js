const fs = require("fs");
const path = require("path");

const dataFile = path.join(
  __dirname,
  "..",
  "data",
  "images.json"
);

// Simple keyword-based similarity for MVP
function calculateScore(query, image) {
  const queryWords = query
    .toLowerCase()
    .split(/\W+/)
    .filter(Boolean);

  const imageText = [
    image.subject,
    image.category,
    image.description,
    ...image.tags
  ]
    .join(" ")
    .toLowerCase();

  let matches = 0;

  for (const word of queryWords) {
    if (imageText.includes(word)) {
      matches++;
    }
  }

  return matches / queryWords.length;
}

function findMatches(query) {
  const images = JSON.parse(
    fs.readFileSync(dataFile, "utf8")
  );

  const matches = images
    .map((image) => ({
      filename: image.filename,
      subject: image.subject,
      category: image.category,
      description: image.description,
      score: Number(
        calculateScore(query, image).toFixed(2)
      )
    }))
    .sort((a, b) => b.score - a.score);

  return matches;
}

module.exports = {
  findMatches
};