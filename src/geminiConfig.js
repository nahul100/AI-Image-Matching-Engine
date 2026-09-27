const GEMINI_VISION_MODEL =
  process.env.GEMINI_VISION_MODEL || "gemini-1.5-flash";

const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

module.exports = {
  GEMINI_VISION_MODEL,
  GEMINI_EMBEDDING_MODEL
};
