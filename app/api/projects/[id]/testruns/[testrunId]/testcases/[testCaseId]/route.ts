import { testRunController } from '@/backend/controllers/testrun/controller';
import { hasPermission } from '@/lib/rbac/hasPermission';

/**
 * DELETE /api/projects/[id]/testruns/[testrunId]/testcases/[testCaseId]
 * 指定したテストケースをテストランから除外する（TestResult を削除）。
 * 削除権限ではなく、テストランの更新権限で許可する。
 */
export const DELETE = hasPermission(
  async (_request, context) => {
    const { testrunId, testCaseId } = await context.params;
    return testRunController.removeTestCaseFromTestRun(testrunId, testCaseId);
  },
  'testruns',
  'update'
);
