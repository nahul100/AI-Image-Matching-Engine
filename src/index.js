const express = require("express");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { findMatches } = require("./matcher");

dotenv.config();

const app = express();

app.use(express.json());

const PORT = 3001;

// Gemini setup
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-3.6-flash"
});

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Image Matching Engine API is running"
  });
});

// Test Gemini
app.get("/test-ai", async (req, res) => {
  try {
    const result = await model.generateContent(
      "Reply with exactly: Gemini connection successful"
    );

    const response = result.response.text();

    res.json({
      success: true,
      response
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Match images
app.get("/match", (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.status(400).json({
      success: false,
      error: "Please provide a query"
    });
  }

  try {
    const matches = findMatches(query);

    const bestMatch = matches[0];

    if (!bestMatch || bestMatch.score < 0.1) {
      return res.json({
        success: true,
        message: "No confident match found",
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
app.get("/hello", (req, res) => {
  res.send("Hello route works");
});
app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});