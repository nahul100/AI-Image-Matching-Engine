const express = require("express");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { rankImages } = require("./matcher");
const { checkMismatch } = require("./mismatchGuard");
const {inspectReview,saveReview} = require("./review");

dotenv.config();

const app = express();

app.use(express.json());

const PORT = 3001;


// ================================
// MULTER UPLOAD SETUP
// ================================

const uploadDir = path.join(
  __dirname,
  "..",
  "uploads"
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      `${Date.now()}-${file.originalname}`;

    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, JPEG, and PNG image files are allowed"
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});


// ================================
// GEMINI SETUP
// ================================

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-3.6-flash"
});


// ================================
// EMBEDDING MODEL
// ================================

async function createEmbedding(text) {

  const { GoogleGenAI } =
    await import("@google/genai");

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  const response =
    await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text
    });

  return response.embeddings[0].values;
}


// ================================
// ANALYZE UPLOADED IMAGE
// ================================

async function analyzeUploadedImage(
  imagePath,
  mimetype
) {

  const imageBuffer =
    fs.readFileSync(imagePath);

  const imageBase64 =
    imageBuffer.toString("base64");

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

  const result =
    await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimetype
        }
      }
    ]);

  const responseText =
    result.response.text();

  const cleanText =
    responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

  return JSON.parse(cleanText);
}


// ================================
// HOME ROUTE
// ================================

app.get("/", (req, res) => {

  res.json({
    message:
      "AI Image Matching Engine API is running"
  });

});


// ================================
// SEMANTIC TEXT QUERY MATCH
// ================================

app.get("/match", async (req, res) => {

  try {

    const query = req.query.q;

    if (!query) {
      return res.status(400).json({
        error:
          "Query is required. Example: /match?q=red fox"
      });
    }

    console.log(
      `Creating embedding for query: ${query}`
    );

    // 1. Create embedding for the post/query
    const queryEmbedding =
      await createEmbedding(query);

    // 2. Get semantic ranking
    const rankedImages =
      rankImages(queryEmbedding);

    // 3. Apply mismatch guard
    const checkedImages =
      rankedImages.map((image) => {

        // image_vectors.json doesn't contain subject,
        // so load it from images.json
        const imageMetadata =
          JSON.parse(
            fs.readFileSync(
              path.join(
                __dirname,
                "..",
                "data",
                "images.json"
              ),
              "utf8"
            )
          );

        const metadata =
          imageMetadata.find(
            (item) =>
              item.filename === image.filename
          );

        const guard =
          checkMismatch(query, metadata);

        return {
          ...image,
          guard
        };

      });

    // 4. Separate accepted and rejected images
    const accepted =
      checkedImages.filter(
        (image) => image.guard.accepted
      );

    const rejected =
      checkedImages.filter(
        (image) => !image.guard.accepted
      );

    // 5. Apply confidence threshold
    const similarityThreshold = 0.50;

    const confidentMatches =
      accepted.filter(
        (image) =>
          image.score >= similarityThreshold
      );

    // 6. Return result
    res.json({

      query,

      best_match:
        confidentMatches.length > 0
          ? confidentMatches[0]
          : null,

      matches:
        confidentMatches.slice(0, 3),

      rejected: rejected.map(
        (image) => ({
          filename: image.filename,
          score: image.score,
          reason: image.guard.reason
        })
      ),

      message:
        confidentMatches.length > 0
          ? "Confident image match found"
          : "No confident match"

    });

  } catch (error) {

    console.error(
      "MATCH ERROR:",
      error.message
    );

    res.status(500).json({

      error:
        "Failed to perform semantic matching",

      details:
        error.message

    });

  }

});
// ================================
// UPLOAD + ANALYZE + SEMANTIC MATCH
// ================================

app.post(
  "/upload-match",

  upload.single("image"),

  async (req, res) => {

    if (!req.file) {

      return res.status(400).json({

        success: false,

        error:
          "Please upload an image using the field name 'image'"

      });

    }

    try {

      console.log(
        `Analyzing uploaded image: ${req.file.filename}`
      );


      // ------------------------------
      // 1. Analyze uploaded image
      // ------------------------------

      const analysis =
        await analyzeUploadedImage(
          req.file.path,
          req.file.mimetype
        );

      console.log(
        "AI Analysis:",
        analysis
      );


      // ------------------------------
      // 2. Create searchable text
      // ------------------------------

      const query = [

        analysis.subject,

        analysis.category,

        analysis.description,

        ...analysis.tags

      ].join(". ");


      // ------------------------------
      // 3. Create embedding
      // ------------------------------

      const queryEmbedding =
        await createEmbedding(query);


      // ------------------------------
      // 4. Semantic ranking
      // ------------------------------

      const matches =
        rankImages(queryEmbedding);


      // ------------------------------
      // 5. Delete temporary image
      // ------------------------------

      fs.unlinkSync(req.file.path);


      // ------------------------------
      // 6. Return result
      // ------------------------------

      res.json({

        success: true,

        uploaded_image:
          req.file.filename,

        analysis,

        best_match:
          matches[0],

        matches:
          matches.slice(0, 3)

      });

    } catch (error) {

      console.error(error);

      // Clean up uploaded file if it still exists
      if (
        req.file &&
        fs.existsSync(req.file.path)
      ) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({

        success: false,

        error: error.message

      });

    }

  }
);
// ================================
// REVIEW API
// ================================

// Inspect review decision
app.get("/review/:filename", (req, res) => {

  const review =
    inspectReview(req.params.filename);

  if (!review) {
    return res.status(404).json({
      error: "No review found for this image"
    });
  }

  res.json({
    success: true,
    review
  });

});


// Approve image
app.post(
  "/review/:filename/approve",
  (req, res) => {

    const review =
      saveReview(
        req.params.filename,
        "approved",
        req.body.reason || "Approved by reviewer"
      );

    res.json({
      success: true,
      review
    });

  }
);


// Reject image
app.post(
  "/review/:filename/reject",
  (req, res) => {

    const review =
      saveReview(
        req.params.filename,
        "rejected",
        req.body.reason || "Rejected by reviewer"
      );

    res.json({
      success: true,
      review
    });

  }
);

// ================================
// ERROR HANDLER
// ================================

app.use(
  (error, req, res, next) => {

    if (
      error instanceof multer.MulterError
    ) {

      if (
        error.code === "LIMIT_FILE_SIZE"
      ) {

        return res.status(400).json({

          success: false,

          error:
            "Image file must be smaller than 5 MB"

        });

      }

    }

    if (error) {

      return res.status(400).json({

        success: false,

        error:
          error.message

      });

    }

    next();

  }
);


// ================================
// START SERVER
// ================================

app.listen(PORT, () => {

  console.log(
    `Server running on http://localhost:${PORT}`
  );

});