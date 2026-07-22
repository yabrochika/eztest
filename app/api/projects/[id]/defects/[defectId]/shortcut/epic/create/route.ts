import { defectController } from '@/backend/controllers/defect/controller';
import { hasPermission } from '@/lib/rbac/hasPermission';

/**
 * POST /api/projects/[id]/defects/[defectId]/shortcut/epic/create
 * Create a brand-new Shortcut epic and attach this defect as a story under it.
 * Body: { name: string }
 */
export const POST = hasPermission(
  async (request, context) => {
    const { defectId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { name?: string };
    return defectController.createShortcutEpicForDefect(request, defectId, {
      name: body?.name,
    });
  },
  'defects',
  'update'
);
