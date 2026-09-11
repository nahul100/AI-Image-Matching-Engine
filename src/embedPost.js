require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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

async function main() {

  console.log("\nPOST EMBEDDING STARTED\n");

  const post =
    await prisma.post.findUnique({
      where: {
        id: 1
      }
    });

  if (!post) {
    console.log("Post 1 not found.");
    return;
  }

  const text =
    `${post.title}. ${post.content}`;

  console.log(
    `Creating embedding for: ${post.title}`
  );

  const vector =
    await createEmbedding(text);

  await prisma.postEmbedding.upsert({

    where: {
      postId: post.id
    },

    update: {
      vector: JSON.stringify(vector)
    },

    create: {
      postId: post.id,
      vector: JSON.stringify(vector)
    }

  });

  console.log(
    `SUCCESS: Post ${post.id} → ${vector.length} dimensions`
  );

  console.log(
    "\nPOST EMBEDDING COMPLETE\n"
  );
}

main()
  .catch((error) => {

    console.error(
      "POST EMBEDDING ERROR:",
      error.message
    );

    process.exit(1);

  })
  .finally(async () => {

    await prisma.$disconnect();

  });