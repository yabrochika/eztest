-- Add a JSON snapshot of the test case captured at the moment the test case
-- is added to a test run. Existing rows remain NULL and will fall back to the
-- live master test case data on read.
ALTER TABLE "TestResult"
ADD COLUMN "testCaseSnapshot" JSONB;
