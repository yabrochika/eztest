/*
  Warnings:

  - A unique constraint covering the columns `[projectId,tsId]` on the table `TestSuite` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tsId` to the `TestSuite` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: add tsId column as nullable first so we can backfill
ALTER TABLE "TestSuite" ADD COLUMN "tsId" TEXT;

-- Backfill existing test suites with TS-### format (3-digit zero-padded), numbered per project by createdAt
WITH numbered_suites AS (
  SELECT
    id,
    'TS-' || LPAD(
      ROW_NUMBER() OVER (PARTITION BY "projectId" ORDER BY "createdAt", id)::text,
      3,
      '0'
    ) AS new_ts_id
  FROM "TestSuite"
  WHERE "tsId" IS NULL
)
UPDATE "TestSuite"
SET "tsId" = numbered_suites.new_ts_id
FROM numbered_suites
WHERE "TestSuite".id = numbered_suites.id;

-- Enforce NOT NULL after backfill
ALTER TABLE "TestSuite" ALTER COLUMN "tsId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TestSuite_projectId_tsId_key" ON "TestSuite"("projectId", "tsId");
