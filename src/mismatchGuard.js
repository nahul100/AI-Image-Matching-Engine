function checkMismatch(postText, image) {

  const post = postText.toLowerCase();

  const subject = image.subject.toLowerCase();

  // Fox post vs non-fox animal
  if (
    post.includes("fox") &&
    !subject.includes("fox")
  ) {
    return {
      accepted: false,
      reason: `Animal category mismatch: expected fox, detected ${image.subject}`
    };
  }

  // Wolf post vs non-wolf animal
  if (
    post.includes("wolf") &&
    !subject.includes("wolf")
  ) {
    return {
      accepted: false,
      reason: `Animal category mismatch: expected wolf, detected ${image.subject}`
    };
  }

  // Dog post vs non-dog animal
  if (
    post.includes("dog") &&
    !subject.includes("dog")
  ) {
    return {
      accepted: false,
      reason: `Animal category mismatch: expected dog, detected ${image.subject}`
    };
  }

  // Cat post vs non-cat animal
  if (
    post.includes("cat") &&
    !subject.includes("cat")
  ) {
    return {
      accepted: false,
      reason: `Animal category mismatch: expected cat, detected ${image.subject}`
    };
  }

  // Bear post vs non-bear animal
  if (
    post.includes("bear") &&
    !subject.includes("bear")
  ) {
    return {
      accepted: false,
      reason: `Animal category mismatch: expected bear, detected ${image.subject}`
    };
  }

  return {
    accepted: true,
    reason: "No obvious subject mismatch detected"
  };
}

module.exports = {
  checkMismatch
};