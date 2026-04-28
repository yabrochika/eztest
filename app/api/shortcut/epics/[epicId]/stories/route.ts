import { defectController } from '@/backend/controllers/defect/controller';
import { hasPermission } from '@/lib/rbac/hasPermission';

/**
 * GET /api/shortcut/epics/:epicId/stories
 * List Shortcut stories under the given epic.
 */
export const GET = hasPermission(
  async (request, context) => {
    const { epicId } = await context.params;
    const epicIdNum = Number(epicId);
    if (!Number.isFinite(epicIdNum)) {
      return { error: 'Invalid epicId', status: 400 };
    }
    return defectController.listShortcutStoriesForEpic(epicIdNum);
  },
  'defects',
  'read'
);
