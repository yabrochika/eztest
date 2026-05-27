-- Keep TestResult rows alive even after the underlying TestCase master record
-- is deleted. The historical evidence remains via `testCaseSnapshot`.
--
-- 1) Drop the existing cascade FK
-- 2) Make `testCaseId` nullable
-- 3) Recreate the FK with ON DELETE SET NULL so deleting a TestCase clears
--    the reference but preserves the TestResult row and its snapshot.

ALTER TABLE "TestResult" DROP CONSTRAINT IF EXISTS "TestResult_testCaseId_fkey";

ALTER TABLE "TestResult" ALTER COLUMN "testCaseId" DROP NOT NULL;

ALTER TABLE "TestResult"
  ADD CONSTRAINT "TestResult_testCaseId_fkey"
  FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
