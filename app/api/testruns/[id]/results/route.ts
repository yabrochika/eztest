import { testRunController } from '@/backend/controllers/testrun/controller';
import { hasPermission } from '@/lib/rbac';

/**
 * POST /api/testruns/[id]/results
 * Add a test result to a test run
 * Required permission: testruns:update
 */
export const POST = hasPermission(
  async (request, context) => {
    const { id } = await context!.params;
    const body = await request.json();
    return testRunController.addTestResult(body, id, request.userInfo.id);
  },
  'testruns',
  'update'
);

/**
 * PATCH /api/testruns/[id]/results
 * Partially update an existing test result
 * 送信されたフィールドだけを更新し、未送信の executedAt は維持する。
 * Required permission: testruns:update
 */
export const PATCH = hasPermission(
  async (request, context) => {
    const { id } = await context!.params;
    const body = await request.json();
    return testRunController.updateTestResult(body, id, request.userInfo.id);
  },
  'testruns',
  'update'
);
