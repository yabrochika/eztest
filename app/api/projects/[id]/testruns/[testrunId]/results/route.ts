import { testRunController } from '@/backend/controllers/testrun/controller';
import { hasPermission } from '@/lib/rbac/hasPermission';

/**
 * POST /api/projects/[id]/testruns/[testrunId]/results
 * Add a test result to a test run
 */
export const POST = hasPermission(
  async (request, context) => {
    const { testrunId } = await context.params;
    const body = await request.json();
    return testRunController.addTestResult(body, testrunId, request.userInfo.id);
  },
  'testruns',
  'update'
);

/**
 * PATCH /api/projects/[id]/testruns/[testrunId]/results
 * Partially update an existing test result (階層型パス対応)。
 * 送信されたフィールドだけを更新し、未送信の executedAt は維持する。
 */
export const PATCH = hasPermission(
  async (request, context) => {
    const { testrunId } = await context.params;
    const body = await request.json();
    return testRunController.updateTestResult(body, testrunId, request.userInfo.id);
  },
  'testruns',
  'update'
);

