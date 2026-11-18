require("dotenv").config();// Load environment variables from .env file

const { imageQueue } = require("./queue");

async function addJob() {
  const job = await imageQueue.add(// Add a new job to the image processing queue
    "test-image",
    {
      filename: "fox.jpg"// Specify the filename of the image to be processed
    },
    {
      attempts: 3,// Retry the job up to 3 times if it fails.
      backoff: {// Configure retry behavior for failed jobs
        type: "exponential",// Use exponential backoff for retries
        delay: 2000
      },
      removeOnComplete: 100,// Remove completed jobs from the queue after 100 jobs
      removeOnFail: 100// Remove failed jobs from the queue after 100 jobs
    }
  );

  console.log(`Job added: ${job.id}`);

  process.exit(0);
}

addJob();