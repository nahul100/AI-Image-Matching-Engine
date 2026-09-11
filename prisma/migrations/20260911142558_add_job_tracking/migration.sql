-- CreateTable
CREATE TABLE "ProcessingJob" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ApiUsage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "service" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "estimatedCostUsd" REAL NOT NULL DEFAULT 0,
    "jobId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiUsage_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ProcessingJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProcessingJob_jobType_idx" ON "ProcessingJob"("jobType");

-- CreateIndex
CREATE INDEX "ProcessingJob_status_idx" ON "ProcessingJob"("status");

-- CreateIndex
CREATE INDEX "ApiUsage_jobId_idx" ON "ApiUsage"("jobId");

-- CreateIndex
CREATE INDEX "ApiUsage_operation_idx" ON "ApiUsage"("operation");

-- CreateIndex
CREATE INDEX "ApiUsage_createdAt_idx" ON "ApiUsage"("createdAt");
