-- AlterTable
ALTER TABLE "TestSuite" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'NOT_STARTED';

-- CreateIndex
CREATE INDEX "TestSuite_status_idx" ON "TestSuite"("status");
