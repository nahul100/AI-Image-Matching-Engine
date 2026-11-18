const prisma = require("../config/prisma");

async function upsertAnalyzedImage(filename, data) {
  const image = await prisma.image.upsert({
    where: { filename },
    update: {
      subject: data.subject,
      category: data.category,
      caption: data.caption,
      confidence: data.confidence,
      status: data.status
    },
    create: {
      filename,
      subject: data.subject,
      category: data.category,
      caption: data.caption,
      confidence: data.confidence,
      status: data.status
    }
  });

  await prisma.imageAttribute.deleteMany({ where: { imageId: image.id } });
  await prisma.imageAttribute.createMany({
    data: data.attributes.map((attribute) => ({
      value: attribute,
      imageId: image.id
    }))
  });

  return image;
}

async function findPostWithEmbedding(postId) {
  return prisma.post.findUnique({
    where: { id: postId },
    include: { embedding: true }
  });
}

async function findImagesWithEmbeddings() {
  return prisma.image.findMany({ include: { embedding: true } });
}

async function findPost(postId) {
  return prisma.post.findUnique({ where: { id: postId } });
}

async function createPost(title, content) {
  return prisma.post.create({ data: { title, content } });
}

async function getPost(postId) {
  return prisma.post.findUnique({
    where: { id: postId },
    include: { embedding: true }
  });
}

async function replaceSuggestions(postId, matches) {
  await prisma.suggestion.deleteMany({ where: { postId } });
  return Promise.all(matches.map((match) =>
    prisma.suggestion.create({
      data: {
        postId,
        imageId: match.imageId,
        score: match.score,
        status: match.guard.accepted ? "accepted" : "rejected",
        reason: match.guard.reason
      }
    })
  ));
}

module.exports = {
  findImagesWithEmbeddings,
  findPost,
  findPostWithEmbedding,
  getPost,
  createPost,
  replaceSuggestions,
  upsertAnalyzedImage
};
