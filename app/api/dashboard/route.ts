import { dashboardController } from '@/backend/controllers/dashboard/controller';
import { hasPermission } from '@/lib/rbac';

/**
 * GET /api/dashboard
 * TestRail-style home dashboard: activity, projects, and assigned work
 * Required permission: projects:read
 */
export const GET = hasPermission(
  async (request) => {
    return dashboardController.getDashboard(request);
  },
  'projects',
  'read'
);
