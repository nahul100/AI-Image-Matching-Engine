const express = require("express");
const fs = require("fs");
const upload = require("../config/upload");
const { imageQueue } = require("../queue/queue");
const matchingService = require("../services/matchingService");
const reviewService = require("../services/reviewService");

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({ message: "AI Image Matching Engine API is running" });
});

router.get("/match", async (req, res, next) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({
        error: "Query is required. Example: /match?q=red fox"
      });
    }

    const checked = await matchingService.matchText(query);
    const accepted = checked.filter((item) => item.guard.accepted);
    const rejected = checked.filter((item) => !item.guard.accepted);
    const confident = accepted.filter((item) => item.score >= 0.50);

    res.json({
      query,
      best_match: confident[0] || null,
      matches: confident.slice(0, 3),
      rejected: rejected.map(({ filename, score, guard }) => ({
        filename,
        score,
        reason: guard.reason
      })),
      message: confident.length ? "Confident image match found" : "No confident match"
    });
  } catch (error) {
    next(error);
  }
});

router.get("/jobs/:id", async (req, res, next) => {
  try {
    const job = await imageQueue.getJob(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({
      jobId: job.id,
      name: job.name,
      state: await job.getState(),
      progress: job.progress,
      data: job.data,
      result: job.returnvalue || null,
      failedReason: job.failedReason || null
    });
  } catch (error) {
    next(error);
  }
});

router.post("/upload-match", upload.single("image"), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "Please upload an image using the field name 'image'"
    });
  }

  try {
    const result = await matchingService.analyzeAndMatchUpload(
      req.file.path,
      req.file.mimetype
    );
    fs.unlinkSync(req.file.path);
    res.json({
      success: true,
      uploaded_image: req.file.filename,
      analysis: result.analysis,
      best_match: result.matches[0] || null,
      matches: result.matches.slice(0, 3)
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(error);
  }
});

router.get("/review/:filename", (req, res) => {
  const review = reviewService.inspect(req.params.filename);
  if (!review) return res.status(404).json({ error: "No review found for this image" });
  res.json({ success: true, review });
});

router.post("/review/:filename/approve", (req, res) => {
  const review = reviewService.setDecision(
    req.params.filename,
    "approved",
    req.body.reason || "Approved by reviewer"
  );
  res.json({ success: true, review });
});

router.post("/review/:filename/reject", (req, res) => {
  const review = reviewService.setDecision(
    req.params.filename,
    "rejected",
    req.body.reason || "Rejected by reviewer"
  );
  res.json({ success: true, review });
});

router.post("/images/process", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Image file is required" });
    const job = await imageQueue.add(
      "process-image",
      { filename: req.file.path },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 100
      }
    );
    res.status(202).json({
      message: "Image queued for background processing",
      jobId: job.id,
      filename: req.file.filename
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
