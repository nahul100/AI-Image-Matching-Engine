const assert = require("assert");
const fs = require("fs");
const path = require("path");

const { checkMismatch } = require("./mismatchGuard");
const { cosineSimilarity } = require("./matcher");

console.log("\n=== Automated Tests ===\n");

// --------------------------------------------------
// Test 1: Mismatch Guard
// --------------------------------------------------

const foxPost =
  "The behavior of red foxes in the wild.";

const wolfImage = {
  subject: "gray wolf",
  category: "animal"
};

const mismatchResult = checkMismatch(foxPost, wolfImage);

assert.strictEqual(
  mismatchResult.accepted,
  false,
  "Wolf image should be rejected for a fox post"
);

console.log("PASS: Mismatch guard rejects wolf for fox post");


// --------------------------------------------------
// Test 2: Correct Subject Accepted
// --------------------------------------------------

const foxImage = {
  subject: "red fox",
  category: "animal"
};

const matchResult = checkMismatch(foxPost, foxImage);

assert.strictEqual(
  matchResult.accepted,
  true,
  "Fox image should be accepted for a fox post"
);

console.log("PASS: Mismatch guard accepts fox for fox post");


// --------------------------------------------------
// Test 3: Cosine Similarity
// --------------------------------------------------

const vectorA = [1, 0, 0];
const vectorB = [1, 0, 0];

const similarity = cosineSimilarity(vectorA, vectorB);

assert.strictEqual(
  similarity,
  1,
  "Identical vectors should have similarity 1"
);

console.log("PASS: Cosine similarity correctly identifies identical vectors");


// --------------------------------------------------
// Test 4: Different Vectors
// --------------------------------------------------

const vectorC = [1, 0, 0];
const vectorD = [0, 1, 0];

const differentSimilarity = cosineSimilarity(vectorC, vectorD);

assert.strictEqual(
  differentSimilarity,
  0,
  "Orthogonal vectors should have similarity 0"
);

console.log("PASS: Cosine similarity correctly identifies unrelated vectors");


// --------------------------------------------------
// Test 5: Evaluation Dataset Exists
// --------------------------------------------------

const evalFile = path.join(
  __dirname,
  "..",
  "data",
  "eval.json"
);

assert.strictEqual(
  fs.existsSync(evalFile),
  true,
  "Evaluation dataset should exist"
);

const evaluationSet = JSON.parse(
  fs.readFileSync(evalFile, "utf8")
);

assert.ok(
  evaluationSet.length >= 10,
  "Evaluation dataset must contain at least 10 posts"
);

console.log("PASS: Evaluation dataset contains at least 10 posts");


console.log("\n=== All Automated Tests Passed ===\n");