-- Add optional verificationEnvironment field to test runs (検証環境)
ALTER TABLE "TestRun"
ADD COLUMN IF NOT EXISTS "verificationEnvironment" TEXT;

-- Index for filtering by verification environment
CREATE INDEX IF NOT EXISTS "TestRun_verificationEnvironment_idx"
ON "TestRun"("verificationEnvironment");
