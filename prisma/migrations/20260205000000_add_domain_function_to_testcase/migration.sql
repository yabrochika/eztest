-- AlterTable
ALTER TABLE "TestCase" ADD COLUMN     "domain" TEXT,
ADD COLUMN     "function" TEXT;

-- CreateIndex
CREATE INDEX "TestCase_domain_idx" ON "TestCase"("domain");

-- CreateIndex
CREATE INDEX "TestCase_function_idx" ON "TestCase"("function");
