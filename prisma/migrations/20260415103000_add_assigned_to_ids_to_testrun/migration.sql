-- Add column to store multi-assignee IDs for test runs.
ALTER TABLE "TestRun"
ADD COLUMN "assignedToIds" TEXT;
