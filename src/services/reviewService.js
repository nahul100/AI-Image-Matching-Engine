const reviewRepository = require("../review/review");

function inspect(filename) {
  return reviewRepository.inspectReview(filename);
}

function setDecision(filename, decision, reason) {
  return reviewRepository.saveReview(filename, decision, reason);
}

module.exports = { inspect, setDecision };
