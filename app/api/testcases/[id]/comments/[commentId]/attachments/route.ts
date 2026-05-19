import { testCaseController } from '@/backend/controllers/testcase/controller';
import { hasPermission } from '@/lib/rbac';

export const POST = hasPermission(
  async (request, context) => {
    const { commentId } = await context!.params;
    const body = await request.json();
    return testCaseController.createCommentAttachment(request, commentId, body);
  },
  'testcases',
  'read'
);
