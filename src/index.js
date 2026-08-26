const express = require("express");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { findMatches } = require("./matcher");

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
//multer file filter to allow only JPG, JPEG, and PNG image files
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
// ANALYZE UPLOADED IMAGE
// ================================
async function analyzeUploadedImage(imagePath, mimetype) {

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
    message: "AI Image Matching Engine API is running"
  });
});


// ================================
// TEXT QUERY MATCH
// ================================
app.get("/match", (req, res) => {

  const query = req.query.query;

  if (!query) {
    return res.status(400).json({
      success: false,
      error: "Please provide a query"
    });
  }

  try {

    const matches =
      findMatches(query);

    const bestMatch =
      matches[0];

    if (
      !bestMatch ||
      bestMatch.score < 0.1
    ) {
      return res.json({
        success: true,
        message:
          "No confident match found",
        query
      });
    }

    res.json({
      success: true,
      query,
      best_match: bestMatch,
      matches
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// ================================
// UPLOAD + ANALYZE + MATCH
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

      // 1. Gemini analyzes uploaded image
      const analysis =
        await analyzeUploadedImage(
          req.file.path,
          req.file.mimetype
        );

      console.log(
        "AI Analysis:",
        analysis
      );

      // 2. Convert analysis into searchable text
      const query = [
        analysis.subject,
        analysis.category,
        analysis.description,
        ...analysis.tags
      ].join(" ");

      // 3. Match against existing images
      const matches =
        findMatches(query);
// Delete temporary uploaded image
        fs.unlinkSync(req.file.path);
      // 4. Return result
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

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

//error handler
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "Image file must be smaller than 5 MB"
      });
    }
  }

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  next();
});
// ================================
// START SERVER
// ================================
app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});