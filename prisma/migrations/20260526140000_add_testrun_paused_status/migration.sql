-- Add new PAUSED status for TestRun and update COMPLETED label to DONE.
-- カンバンビュー対応のため、テストランのステータス選択肢を整理する。

-- 1) PAUSED を追加（既に存在する場合は何もしない）
INSERT INTO "DropdownOption" ("id", "entity", "field", "value", "label", "order", "isActive", "createdAt", "updatedAt")
VALUES (
  'cuid_testrun_status_paused',
  'TestRun',
  'status',
  'PAUSED',
  'PAUSED',
  4,
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("entity", "field", "value") DO NOTHING;

-- 2) COMPLETED のラベルを DONE に変更、order を 5 に
UPDATE "DropdownOption"
SET "label" = 'DONE', "order" = 5, "updatedAt" = NOW()
WHERE "entity" = 'TestRun' AND "field" = 'status' AND "value" = 'COMPLETED';

-- 3) CANCELLED の order を 6 に下げて末尾に
UPDATE "DropdownOption"
SET "order" = 6, "updatedAt" = NOW()
WHERE "entity" = 'TestRun' AND "field" = 'status' AND "value" = 'CANCELLED';
