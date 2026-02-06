-- AlterTable
ALTER TABLE "TestCase" ADD COLUMN     "featureCategory" TEXT,
ADD COLUMN     "moduleCategory" TEXT;

-- CreateIndex
CREATE INDEX "TestCase_moduleCategory_idx" ON "TestCase"("moduleCategory");

-- CreateIndex
CREATE INDEX "TestCase_featureCategory_idx" ON "TestCase"("featureCategory");
