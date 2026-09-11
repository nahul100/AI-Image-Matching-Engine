-- CreateTable
CREATE TABLE "Image" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ImageAttribute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "imageId" INTEGER NOT NULL,
    CONSTRAINT "ImageAttribute_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImageEmbedding" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vector" TEXT NOT NULL,
    "imageId" INTEGER NOT NULL,
    CONSTRAINT "ImageEmbedding_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PostEmbedding" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vector" TEXT NOT NULL,
    "postId" INTEGER NOT NULL,
    CONSTRAINT "PostEmbedding_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "score" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "postId" INTEGER NOT NULL,
    "imageId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Suggestion_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Suggestion_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "decision" TEXT NOT NULL,
    "reason" TEXT,
    "imageId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Image_filename_key" ON "Image"("filename");

-- CreateIndex
CREATE INDEX "Image_category_idx" ON "Image"("category");

-- CreateIndex
CREATE INDEX "Image_subject_idx" ON "Image"("subject");

-- CreateIndex
CREATE INDEX "ImageAttribute_value_idx" ON "ImageAttribute"("value");

-- CreateIndex
CREATE INDEX "ImageAttribute_imageId_idx" ON "ImageAttribute"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "ImageEmbedding_imageId_key" ON "ImageEmbedding"("imageId");

-- CreateIndex
CREATE INDEX "Post_title_idx" ON "Post"("title");

-- CreateIndex
CREATE UNIQUE INDEX "PostEmbedding_postId_key" ON "PostEmbedding"("postId");

-- CreateIndex
CREATE INDEX "Suggestion_postId_idx" ON "Suggestion"("postId");

-- CreateIndex
CREATE INDEX "Suggestion_imageId_idx" ON "Suggestion"("imageId");

-- CreateIndex
CREATE INDEX "Suggestion_score_idx" ON "Suggestion"("score");

-- CreateIndex
CREATE INDEX "Review_imageId_idx" ON "Review"("imageId");

-- CreateIndex
CREATE INDEX "Review_decision_idx" ON "Review"("decision");
