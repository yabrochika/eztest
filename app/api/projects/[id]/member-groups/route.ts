import { projectController } from '@/backend/controllers/project/controller';
import { hasPermission, hasProjectMemberAccess } from '@/lib/rbac';

/**
 * GET /api/projects/[id]/member-groups
 * Get all member groups of a project
 * Required permission: projects:read
 */
export const GET = hasPermission(
  async (request, context) => {
    const { id } = await context.params;
    return projectController.getProjectMemberGroups(request, id);
  },
  'projects',
  'read'
);

/**
 * POST /api/projects/[id]/member-groups
 * Create a member group in a project
 * Required permission: projects:manage_members
 * Required: User must be ADMIN or a member of the project
 */
export const POST = hasProjectMemberAccess(
  async (request, context) => {
    const { id } = await context.params;
    return projectController.createProjectMemberGroup(request, id);
  },
  'projects',
  'manage_members'
);
