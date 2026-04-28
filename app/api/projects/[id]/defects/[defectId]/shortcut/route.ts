import { defectController } from '@/backend/controllers/defect/controller';
import { hasPermission } from '@/lib/rbac/hasPermission';

/**
 * POST /api/projects/[id]/defects/[defectId]/shortcut
 * Create a Shortcut story from this defect and persist the link back to the defect.
 * Required permission: defects:update
 */
export const POST = hasPermission(
  async (request, context) => {
    const { defectId } = await context.params;
    return defectController.sendDefectToShortcut(request, defectId);
  },
  'defects',
  'update'
);
