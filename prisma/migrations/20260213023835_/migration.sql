/*
  Warnings:

  - You are about to drop the column `automation` on the `TestCase` table. All the data in the column will be lost.
  - You are about to drop the column `environment` on the `TestCase` table. All the data in the column will be lost.
  - You are about to drop the column `featureCategory` on the `TestCase` table. All the data in the column will be lost.
  - You are about to drop the column `functionName` on the `TestCase` table. All the data in the column will be lost.
  - You are about to drop the column `moduleCategory` on the `TestCase` table. All the data in the column will be lost.
  - You are about to drop the column `target` on the `TestCase` table. All the data in the column will be lost.
  - You are about to drop the column `executionType` on the `TestRun` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "TestCase_domain_idx";

-- DropIndex
DROP INDEX "TestCase_environment_idx";

-- DropIndex
DROP INDEX "TestCase_featureCategory_idx";

-- DropIndex
DROP INDEX "TestCase_function_idx";

-- DropIndex
DROP INDEX "TestCase_layer_idx";

-- DropIndex
DROP INDEX "TestCase_moduleCategory_idx";

-- DropIndex
DROP INDEX "TestCase_target_idx";

-- DropIndex
DROP INDEX "TestCase_testType_idx";

-- DropIndex
DROP INDEX "TestRun_executionType_idx";

-- AlterTable
ALTER TABLE "TestCase" DROP COLUMN "automation",
DROP COLUMN "environment",
DROP COLUMN "featureCategory",
DROP COLUMN "functionName",
DROP COLUMN "moduleCategory",
DROP COLUMN "target";

-- AlterTable
ALTER TABLE "TestRun" DROP COLUMN "executionType";
