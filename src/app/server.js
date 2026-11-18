require("dotenv").config();

const express = require("express");
const multer = require("multer");
const apiRoutes = require("../routes/apiRoutes");
const postRoutes = require("../routes/postRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(apiRoutes);
app.use(postRoutes);

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      error: "Image file must be smaller than 5 MB"
    });
  }

  res.status(error.status || 500).json({
    success: false,
    error: error.message
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
