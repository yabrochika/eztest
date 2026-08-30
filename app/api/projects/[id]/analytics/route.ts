import { analyticsController } from '@/backend/controllers/analytics/controller';
import { hasPermission } from '@/lib/rbac';

/**
 * GET /api/projects/[id]/analytics
 * In-progress run bars, Friday-week activity, and inventory trend
 * Required permission: projects:read
 */
export const GET = hasPermission(
  async (request, context) => {
    const { id: projectId } = await context!.params;
    return analyticsController.getProjectAnalytics(request, projectId);
  },
  'projects',
  'read'
);
