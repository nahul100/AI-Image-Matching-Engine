const fs = require("fs");
const path = require("path");

const reviewFile = path.join(
  __dirname,
  "..",
  "data",
  "reviews.json"
);

function loadReviews() {
  return JSON.parse(
    fs.readFileSync(reviewFile, "utf8")
  );
}

function saveReviews(reviews) {
  fs.writeFileSync(
    reviewFile,
    JSON.stringify(reviews, null, 2)
  );
}

function inspectReview(filename) {

  const reviews = loadReviews();

  const review = reviews.find(
    (item) => item.filename === filename
  );

  if (!review) {
    return null;
  }

  return review;
}

function saveReview(
  filename,
  decision,
  reason = ""
) {

  const reviews = loadReviews();

  const existingIndex =
    reviews.findIndex(
      (item) => item.filename === filename
    );

  const review = {
    filename,
    decision,
    reason,
    reviewed_at:
      new Date().toISOString()
  };

  if (existingIndex >= 0) {
    reviews[existingIndex] = review;
  } else {
    reviews.push(review);
  }

  saveReviews(reviews);

  return review;
}

module.exports = {
  inspectReview,
  saveReview
};