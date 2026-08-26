import { z } from 'zod';

const stringOrStringArraySchema = z.union([z.string(), z.array(z.string().min(1))]);

const scheduleDateSchema = z
  .union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    z.string().datetime(),
    z.null(),
  ])
  .optional();

/**
 * Create Test Run Schema
 */
export const createTestRunSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(255, 'Name must not exceed 255 characters')
    .trim(),
  description: z.string().optional(),
  executionType: z.enum(['MANUAL', 'AUTOMATION']).optional(),
  assignedToId: z.string().min(1, 'Invalid user ID format').optional(),
  assignedToIds: z.array(z.string().min(1, 'Invalid user ID format')).optional(),
  environment: stringOrStringArraySchema.optional(),
  verificationEnvironment: stringOrStringArraySchema.optional(),
  verificationEnvironmentNote: z
    .string()
    .max(500, 'Verification environment note must not exceed 500 characters')
    .optional(),
  version: z.string().max(100, 'Version must not exceed 100 characters').optional(),
  platform: stringOrStringArraySchema.optional(),
  device: stringOrStringArraySchema.optional(),
  status: z.string().optional(),
  testCaseIds: z.array(z.string().min(1)).optional(),
  testSuiteIds: z.array(z.string().min(1)).optional(),
  scheduledStartAt: scheduleDateSchema,
  scheduledEndAt: scheduleDateSchema,
});

/**
 * Update Test Run Schema
 */
export const updateTestRunSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(255, 'Name must not exceed 255 characters')
    .trim()
    .optional(),
  description: z.string().optional(),
  executionType: z.enum(['MANUAL', 'AUTOMATION']).optional(),
  status: z.string().optional(),
  assignedToId: z.string().min(1, 'Invalid user ID format').optional(),
  assignedToIds: z.array(z.string().min(1, 'Invalid user ID format')).optional(),
  environment: stringOrStringArraySchema.optional(),
  verificationEnvironment: stringOrStringArraySchema.optional(),
  verificationEnvironmentNote: z
    .string()
    .max(500, 'Verification environment note must not exceed 500 characters')
    .optional(),
  version: z.string().max(100, 'Version must not exceed 100 characters').optional(),
  platform: stringOrStringArraySchema.optional(),
  device: stringOrStringArraySchema.optional(),
  scheduledStartAt: scheduleDateSchema,
  scheduledEndAt: scheduleDateSchema,
});

/**
 * 検証実施日時(executedAt)の入力を許容する共通スキーマ。
 * ISO8601 文字列(例: "2026-06-10T09:00:00.000Z")を受け取り Date に変換する。
 * 実際に検証した日時を後から正確に記録できるようにするため。
 */
const executedAtSchema = z
  .string()
  .datetime({ message: 'executedAt must be an ISO8601 datetime string (e.g. 2026-06-10T09:00:00.000Z)' })
  .transform((value) => new Date(value));

/**
 * Add Test Result Schema
 */
export const addTestResultSchema = z.object({
  testCaseId: z.string().min(1, 'Test case ID is required'),
  status: z.enum(['NOT_STARTED', 'PASSED', 'FAILED', 'BLOCKED', 'SKIPPED', 'RETEST']),
  duration: z.number().optional(),
  comment: z.string().optional(),
  errorMessage: z.string().optional(),
  stackTrace: z.string().optional(),
  // Override the executor (defaults to the authenticated user when omitted).
  executedById: z.string().min(1).optional(),
  // 実行者のみを更新する（既存のステータス・コメント・実行日時等は変更しない）。
  // 一括実行者登録などで、未実行のテストケースの実行日時を進めたくない場合に使う。
  executorOnly: z.boolean().optional(),
  // 検証実施日時を明示指定する。未指定時は投稿時刻(new Date())が使われる。
  executedAt: executedAtSchema.optional(),
});

/**
 * Patch Test Result Schema (部分更新)
 *
 * 既存の TestResult を識別する `testCaseId` のみ必須。
 * 送信されたフィールドだけを更新し、未送信フィールド（特に executedAt）は維持する。
 * 「コメントだけ直したい」ケースで、再投稿により executedAt が投稿時刻へ
 * 上書きされてしまう問題を解消するために用いる。
 */
export const patchTestResultSchema = z
  .object({
    testCaseId: z.string().min(1, 'Test case ID is required'),
    status: z.enum(['NOT_STARTED', 'PASSED', 'FAILED', 'BLOCKED', 'SKIPPED', 'RETEST']).optional(),
    duration: z.number().optional(),
    comment: z.string().optional(),
    errorMessage: z.string().optional(),
    stackTrace: z.string().optional(),
    executedById: z.string().min(1).optional(),
    executedAt: executedAtSchema.optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.duration !== undefined ||
      data.comment !== undefined ||
      data.errorMessage !== undefined ||
      data.stackTrace !== undefined ||
      data.executedById !== undefined ||
      data.executedAt !== undefined,
    {
      message:
        'At least one updatable field (status, duration, comment, errorMessage, stackTrace, executedById, executedAt) must be provided',
    }
  );

/**
 * Send Test Run Report Schema
 */
export const sendTestRunReportSchema = z.object({
  // Optional: Could add specific recipients or options in the future
  includeDefectAssignees: z.boolean().optional().default(true),
  includeAdmins: z.boolean().optional().default(true),
  includeProjectManagers: z.boolean().optional().default(true),
});

/**
 * Type exports
 */
export type CreateTestRunInput = z.infer<typeof createTestRunSchema>;
export type UpdateTestRunInput = z.infer<typeof updateTestRunSchema>;
export type AddTestResultInput = z.infer<typeof addTestResultSchema>;
export type PatchTestResultInput = z.infer<typeof patchTestResultSchema>;
export type SendTestRunReportInput = z.infer<typeof sendTestRunReportSchema>;
