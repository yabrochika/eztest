-- AlterTable (IF NOT EXISTS: domain は 20260205 で追加済みの可能性あり)
ALTER TABLE "TestCase" ADD COLUMN IF NOT EXISTS "domain" TEXT;
ALTER TABLE "TestCase" ADD COLUMN IF NOT EXISTS "functionName" TEXT;
