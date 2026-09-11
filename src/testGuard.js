const { checkMismatch } =
  require("./mismatchGuard");

const foxPost =
  "The behavior of red foxes";

const wolfImage = {
  subject: "grey wolf",
  category: "animal"
};

const foxImage = {
  subject: "red fox",
  category: "animal"
};

console.log(
  "Wolf result:",
  checkMismatch(foxPost, wolfImage)
);

console.log(
  "Fox result:",
  checkMismatch(foxPost, foxImage)
);