-- Planned schedule dates for each test run (independent of actual start/complete)
ALTER TABLE "TestRun"
ADD COLUMN IF NOT EXISTS "scheduledStartAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "scheduledEndAt" TIMESTAMP(3);
