const express = require("express");
const postService = require("../services/postService");

const router = express.Router();

router.post("/posts", async (req, res, next) => {
  try {
    const post = await postService.createPost(req.body.title, req.body.content);
    res.status(201).json({ success: true, post });
  } catch (error) {
    next(error);
  }
});

router.get("/posts/:id", async (req, res, next) => {
  try {
    const post = await postService.getPost(Number(req.params.id));
    res.json({ success: true, post });
  } catch (error) {
    next(error);
  }
});

router.get("/posts/:id/matches", async (req, res, next) => {
  try {
    const postId = Number(req.params.id);
    if (Number.isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }
    const result = await postService.matchPost(postId);
    res.json({
      success: true,
      post_id: postId,
      best_match: result.bestMatch,
      matches: result.matches,
      rejected: result.rejected,
      message: result.bestMatch ? "Confident image match found" : "No confident match",
      suggestions: result.suggestions
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
