const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();


// =================================
// CREATE BLOG POST
// =================================

router.post("/posts", async (req, res) => {

  try {

    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: "title and content are required"
      });
    }

    const post = await prisma.post.create({
      data: {
        title,
        content
      }
    });

    res.status(201).json({
      success: true,
      post
    });

  } catch (error) {

    console.error(
      "POST CREATION ERROR:",
      error.message
    );

    res.status(500).json({
      error: "Failed to create post"
    });

  }

});


// =================================
// GET BLOG POST
// =================================

router.get("/posts/:id", async (req, res) => {

  try {

    const post =
      await prisma.post.findUnique({
        where: {
          id: Number(req.params.id)
        },
        include: {
          embedding: true
        }
      });

    if (!post) {
      return res.status(404).json({
        error: "Post not found"
      });
    }

    res.json({
      success: true,
      post
    });

  } catch (error) {

    res.status(500).json({
      error: "Failed to retrieve post"
    });

  }

});


module.exports = router;