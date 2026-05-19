import { testCaseController } from '@/backend/controllers/testcase/controller';
import { hasPermission } from '@/lib/rbac';

export const GET = hasPermission(
  async (request, context) => {
    const { id } = await context!.params;
    return testCaseController.getTestCaseComments(request, id);
  },
  'testcases',
  'read'
);

export const POST = hasPermission(
  async (request, context) => {
    const { id } = await context!.params;
    const body = await request.json();
    return testCaseController.addTestCaseComment(request, id, body);
  },
  'testcases',
  'read'
);
