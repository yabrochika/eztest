import { defectController } from '@/backend/controllers/defect/controller';
import { hasPermission } from '@/lib/rbac/hasPermission';

/**
 * GET /api/shortcut/epics
 * List Shortcut epics accessible by the configured API token.
 */
export const GET = hasPermission(
  async () => {
    return defectController.listShortcutEpics();
  },
  'defects',
  'read'
);
