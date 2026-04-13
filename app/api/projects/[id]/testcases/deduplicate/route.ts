import { testCaseController } from '@/backend/controllers/testcase/controller';
import { hasPermission } from '@/lib/rbac/hasPermission';

export const DELETE = hasPermission(
  async (request, context) => {
    const { id: projectId } = await context.params;
    return testCaseController.removeDuplicateTestCases(request, projectId);
  },
  'testcases',
  'delete'
);
