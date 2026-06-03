-- AlterTable
-- Defect に Shortcut 連携用カラムを追加（追加のみ・データ損失なし）
ALTER TABLE "Defect" ADD COLUMN     "shortcutStoryId" INTEGER,
ADD COLUMN     "shortcutStoryUrl" TEXT,
ADD COLUMN     "shortcutEpicId" INTEGER,
ADD COLUMN     "shortcutEpicName" TEXT;
