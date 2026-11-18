require("dotenv").config();

const { Worker } = require("bullmq");
const { connection } = require("./queue");
const { processImage } = require("../processing/processImage");

const worker = new Worker(
  "image-processing",

  async (job) => {
  console.log(`Processing job ${job.id}`);
  console.log(`Image: ${job.data.filename}`);

  await job.updateProgress(10);

  const result = await processImage(job.data.filename);

  await job.updateProgress(100);

  console.log(`Job ${job.id} completed`);

  return result;
},

  {
    connection,
    concurrency: 2
  }
);

worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.log(`❌ Job ${job?.id} failed: ${err.message}`);
});

console.log("🚀 Image processing worker started");