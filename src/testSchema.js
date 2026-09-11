const assert = require("assert");
const { z } = require("zod");

// Same schema used by the vision pipeline
const ImageSchema = z.object({
  subject: z.string().min(1),
  category: z.string().min(1),
  attributes: z.array(z.string()).min(1),
  caption: z.string().min(1),
  confidence: z.number().min(0).max(1)
});

console.log("\n=== Schema Validation Tests ===\n");

// Test 1: Valid metadata
const validData = {
  subject: "red fox",
  category: "animal",
  attributes: ["orange fur", "wild", "forest"],
  caption: "A red fox standing in a forest",
  confidence: 0.94
};

const validResult = ImageSchema.safeParse(validData);

assert.strictEqual(
  validResult.success,
  true,
  "Valid metadata should pass validation"
);

console.log("PASS: Valid AI metadata is accepted");


// Test 2: Missing subject
const missingSubject = {
  category: "animal",
  attributes: ["wild"],
  caption: "An animal in a forest",
  confidence: 0.90
};

const missingSubjectResult = ImageSchema.safeParse(missingSubject);

assert.strictEqual(
  missingSubjectResult.success,
  false,
  "Missing subject should fail validation"
);

console.log("PASS: Missing subject is rejected");


// Test 3: Invalid confidence
const invalidConfidence = {
  subject: "red fox",
  category: "animal",
  attributes: ["wild"],
  caption: "A red fox",
  confidence: 1.5
};

const invalidConfidenceResult =
  ImageSchema.safeParse(invalidConfidence);

assert.strictEqual(
  invalidConfidenceResult.success,
  false,
  "Confidence above 1 should fail validation"
);

console.log("PASS: Invalid confidence is rejected");


// Test 4: Empty attributes
const emptyAttributes = {
  subject: "red fox",
  category: "animal",
  attributes: [],
  caption: "A red fox",
  confidence: 0.90
};

const emptyAttributesResult =
  ImageSchema.safeParse(emptyAttributes);

assert.strictEqual(
  emptyAttributesResult.success,
  false,
  "Empty attributes should fail validation"
);

console.log("PASS: Empty attributes are rejected");


console.log("\n=== All Schema Tests Passed ===\n");