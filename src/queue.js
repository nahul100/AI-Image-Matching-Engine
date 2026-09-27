const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
});

const imageQueue = new Queue("image-processing", {
  connection
});

module.exports = {
  connection,
  imageQueue
};