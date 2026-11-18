const imageRepository = require("../repositories/imageRepository");
const matchingService = require("./matchingService");
const { checkMismatch } = require("../matching/mismatchGuard");

async function createPost(title, content) {
  if (!title || !content) {
    const error = new Error("title and content are required");
    error.status = 400;
    throw error;
  }
  return imageRepository.createPost(title, content);
}

async function getPost(postId) {
  const post = await imageRepository.getPost(postId);
  if (!post) {
    const error = new Error("Post not found");
    error.status = 404;
    throw error;
  }
  return post;
}

async function matchPost(postId) {
  const post = await imageRepository.findPost(postId);
  if (!post) {
    const error = new Error("Post not found");
    error.status = 404;
    throw error;
  }

  const matches = await matchingService.matchPost(postId);
  const checkedMatches = matches.map((match) => ({
    ...match,
    guard: checkMismatch(`${post.title}. ${post.content}`, {
      subject: match.subject,
      category: match.category
    })
  }));

  const confidentMatches = checkedMatches.filter((match) =>
    match.guard.accepted && match.score >= 0.50);

  return {
    postId,
    bestMatch: confidentMatches[0] || null,
    matches: confidentMatches.slice(0, 3),
    rejected: checkedMatches
      .filter((match) => !match.guard.accepted)
      .map((match) => ({
        filename: match.filename,
        score: match.score,
        reason: match.guard.reason
      })),
    suggestions: await imageRepository.replaceSuggestions(postId,
      checkedMatches.slice(0, 5))
  };
}

module.exports = {
  createPost,
  getPost,
  matchPost
};
