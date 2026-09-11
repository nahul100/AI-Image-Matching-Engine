const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

const imagesFile = path.join(
  __dirname,
  "..",
  "data",
  "images.json"
);

const vectorsFile = path.join(
  __dirname,
  "..",
  "data",
  "image_vectors.json"
);

async function main() {

  console.log("\nDATABASE SEED STARTED\n");

  const images = JSON.parse(
    fs.readFileSync(imagesFile, "utf8")
  );

  const vectors = JSON.parse(
    fs.readFileSync(vectorsFile, "utf8")
  );

  for (const image of images) {

    console.log(`Importing: ${image.filename}`);

    const vectorData = vectors.find(
      (item) =>
        item.filename === image.filename
    );

    const createdImage =
      await prisma.image.upsert({

        where: {
          filename: image.filename
        },

        update: {
          subject: image.subject,
          category: image.category,
          caption: image.caption,
          confidence: image.confidence,
          status: image.status
        },

        create: {
          filename: image.filename,
          subject: image.subject,
          category: image.category,
          caption: image.caption,
          confidence: image.confidence,
          status: image.status
        }

      });

    // Remove old attributes before recreating them
    await prisma.imageAttribute.deleteMany({
      where: {
        imageId: createdImage.id
      }
    });

    for (const attribute of image.attributes) {

      await prisma.imageAttribute.create({

        data: {
          value: attribute,
          imageId: createdImage.id
        }

      });

    }

    // Store embedding
    if (vectorData) {

      await prisma.imageEmbedding.upsert({

        where: {
          imageId: createdImage.id
        },

        update: {
          vector:
            JSON.stringify(
              vectorData.embedding
            )
        },

        create: {
          imageId: createdImage.id,
          vector:
            JSON.stringify(
              vectorData.embedding
            )
        }

      });

    }

    console.log(
      `SUCCESS: ${image.filename}`
    );
  }

  console.log(
    "\nDATABASE SEED COMPLETE\n"
  );
}

main()
  .catch((error) => {

    console.error(
      "SEED ERROR:",
      error
    );

    process.exit(1);

  })
  .finally(async () => {

    await prisma.$disconnect();

  });