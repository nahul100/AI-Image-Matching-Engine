require("dotenv").config();

const { imageQueue } = require("./queue");

async function addJob() {
  const job = await imageQueue.add(
    "test-image",
    {
      filename: "fox.jpg"
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000
      },
      removeOnComplete: 100,
      removeOnFail: 100
    }
  );

  console.log(`Job added: ${job.id}`);

  process.exit(0);
}

addJob();