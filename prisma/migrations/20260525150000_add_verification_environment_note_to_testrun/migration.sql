-- Add optional free-text verificationEnvironmentNote field to test runs (検証環境メモ)
ALTER TABLE "TestRun"
ADD COLUMN IF NOT EXISTS "verificationEnvironmentNote" TEXT;
