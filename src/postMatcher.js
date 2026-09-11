const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();


// =================================
// COSINE SIMILARITY
// =================================

function cosineSimilarity(a, b) {

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {

    dotProduct += a[i] * b[i];

    magnitudeA += a[i] * a[i];

    magnitudeB += b[i] * b[i];

  }

  if (
    magnitudeA === 0 ||
    magnitudeB === 0
  ) {
    return 0;
  }

  return (
    dotProduct /
    (
      Math.sqrt(magnitudeA) *
      Math.sqrt(magnitudeB)
    )
  );
}


// =================================
// MATCH POST TO IMAGES
// =================================

async function matchPost(postId) {

  const post =
    await prisma.post.findUnique({

      where: {
        id: postId
      },

      include: {
        embedding: true
      }

    });


  if (!post) {
    throw new Error("Post not found");
  }


  if (!post.embedding) {
    throw new Error(
      "Post does not have an embedding"
    );
  }


  const postVector =
    JSON.parse(post.embedding.vector);


  const images =
    await prisma.image.findMany({

      include: {
        embedding: true
      }

    });


  const results = [];


  for (const image of images) {

    if (!image.embedding) {
      continue;
    }


    const imageVector =
      JSON.parse(image.embedding.vector);


    const score =
      cosineSimilarity(
        postVector,
        imageVector
      );


    results.push({

      imageId: image.id,

      filename: image.filename,

      subject: image.subject,

      category: image.category,

      score: Number(
        score.toFixed(4)
      )

    });

  }


  results.sort(
    (a, b) => b.score - a.score
  );


  return results;

}


module.exports = {
  matchPost
};