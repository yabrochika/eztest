import { defectController } from '@/backend/controllers/defect/controller';
import { hasPermission } from '@/lib/rbac/hasPermission';

/**
 * PUT /api/projects/[id]/defects/[defectId]/shortcut/epic
 * Set or clear the Shortcut epic linked to this defect.
 * Body: { epicId: number | null }
 */
export const PUT = hasPermission(
  async (request, context) => {
    const { defectId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      epicId?: number | null;
    };
    return defectController.setDefectShortcutEpic(request, defectId, {
      epicId: body?.epicId ?? null,
    });
  },
  'defects',
  'update'
);
