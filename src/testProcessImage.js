require("dotenv").config();

const { processImage } = require("./processImage");

async function test() {
  try {
    const result = await processImage("fox.jpg");

    console.log("\nFinal result:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Processing failed:", error.message);
  }
}

test();