import { defectController } from '@/backend/controllers/defect/controller';
import { hasPermission } from '@/lib/rbac/hasPermission';

/**
 * GET /api/shortcut/resolve/:id
 * Resolve an ambiguous Shortcut Public ID (could be epic id or story id).
 * Returns: { kind: 'epic'|'story'|'unknown', epicId, epicName, storyId, storyName, appUrl }
 */
export const GET = hasPermission(
  async (request, context) => {
    const { id } = await context.params;
    const idNum = Number(id);
    if (!Number.isFinite(idNum)) {
      return { error: 'Invalid id', status: 400 };
    }
    return defectController.resolveShortcutId(idNum);
  },
  'defects',
  'read'
);
