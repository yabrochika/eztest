import { testCaseController } from '@/backend/controllers/testcase/controller';
import { hasPermission } from '@/lib/rbac';

/**
 * GET /api/testcases/[id]/testruns
 * このテストケースを含むテストラン一覧を取得する
 * （アクティブなテストランから順に返却。各テストランの現在の結果も含む）
 * Required permission: testcases:read
 */
export const GET = hasPermission(
  async (request, context) => {
    const { id } = await context!.params;
    return testCaseController.getTestRunsForTestCase(request, id);
  },
  'testcases',
  'read'
);
