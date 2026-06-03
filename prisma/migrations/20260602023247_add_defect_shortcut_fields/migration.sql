-- Add Shortcut integration fields to Defect.
-- These columns exist in schema.prisma but were never migrated, so the
-- database was missing them. Prisma includes them in the RETURNING clause of
-- `defect.create()`, which caused every defect creation to fail with P2022
-- ("column Defect.shortcutStoryId does not exist").
ALTER TABLE "Defect" ADD COLUMN     "shortcutEpicId" INTEGER,
ADD COLUMN     "shortcutEpicName" TEXT,
ADD COLUMN     "shortcutStoryId" INTEGER,
ADD COLUMN     "shortcutStoryUrl" TEXT;
