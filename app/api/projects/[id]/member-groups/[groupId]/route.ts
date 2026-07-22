import { projectController } from '@/backend/controllers/project/controller';
import { hasProjectMemberAccess } from '@/lib/rbac';

/**
 * PATCH /api/projects/[id]/member-groups/[groupId]
 * Update a member group in a project (rename and/or replace members)
 * Required permission: projects:manage_members
 * Required: User must be ADMIN or a member of the project
 */
export const PATCH = hasProjectMemberAccess(
  async (request, context) => {
    const { id, groupId } = await context.params;
    return projectController.updateProjectMemberGroup(request, id, groupId);
  },
  'projects',
  'manage_members'
);

/**
 * DELETE /api/projects/[id]/member-groups/[groupId]
 * Delete a member group in a project
 * Required permission: projects:manage_members
 * Required: User must be ADMIN or a member of the project
 */
export const DELETE = hasProjectMemberAccess(
  async (request, context) => {
    const { id, groupId } = await context.params;
    return projectController.deleteProjectMemberGroup(request, id, groupId);
  },
  'projects',
  'manage_members'
);
