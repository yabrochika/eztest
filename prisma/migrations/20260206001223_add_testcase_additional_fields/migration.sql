-- AlterTable
ALTER TABLE "TestCase" ADD COLUMN     "automation" TEXT,
ADD COLUMN     "environment" TEXT,
ADD COLUMN     "evidence" TEXT,
ADD COLUMN     "flowId" TEXT,
ADD COLUMN     "layer" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "rtcId" TEXT,
ADD COLUMN     "target" TEXT,
ADD COLUMN     "testType" TEXT;

-- CreateIndex
CREATE INDEX "TestCase_layer_idx" ON "TestCase"("layer");

-- CreateIndex
CREATE INDEX "TestCase_testType_idx" ON "TestCase"("testType");

-- CreateIndex
CREATE INDEX "TestCase_environment_idx" ON "TestCase"("environment");

-- CreateIndex
CREATE INDEX "TestCase_target_idx" ON "TestCase"("target");
