import { defectController } from '@/backend/controllers/defect/controller';
import { hasPermission } from '@/lib/rbac/hasPermission';

/**
 * POST /api/projects/[id]/defects/[defectId]/shortcut/stories/[storyId]/attach
 * Attach defect info (description + attachments) to the target Shortcut story
 * and add a "Bug" label (and set story_type to bug).
 */
export const POST = hasPermission(
  async (request, context) => {
    const { defectId, storyId } = await context.params;
    const storyIdNum = Number(storyId);
    if (!Number.isFinite(storyIdNum)) {
      return { error: 'Invalid storyId', status: 400 };
    }
    return defectController.attachDefectToShortcutStory(request, defectId, storyIdNum);
  },
  'defects',
  'update'
);
