import { testCaseController } from '@/backend/controllers/testcase/controller';
import { hasPermission } from '@/lib/rbac';

export const DELETE = hasPermission(
  async (request, context) => {
    const { id, commentId } = await context!.params;
    return testCaseController.deleteTestCaseComment(request, id, commentId);
  },
  'testcases',
  'read'
);
