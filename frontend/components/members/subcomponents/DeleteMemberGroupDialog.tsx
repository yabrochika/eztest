'use client';

import { BaseConfirmDialog, BaseConfirmDialogConfig } from '@/frontend/reusable-components/dialogs/BaseConfirmDialog';

interface DeleteMemberGroupDialogProps {
  group: { id: string; name: string } | null;
  triggerOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export type { DeleteMemberGroupDialogProps };

/**
 * Confirmation dialog for deleting a member group
 */
export function DeleteMemberGroupDialog({
  group,
  triggerOpen,
  onOpenChange,
  onConfirm,
}: DeleteMemberGroupDialogProps) {
  if (!group) return null;

  const content = (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
      <p className="font-semibold mb-2">この操作により:</p>
      <ul className="list-disc list-inside space-y-1">
        <li>グループが削除されます</li>
        <li>グループ内のメンバーの所属情報が削除されます</li>
        <li>プロジェクトメンバー自体は削除されません</li>
      </ul>
    </div>
  );

  const config: BaseConfirmDialogConfig = {
    title: 'グループを削除',
    description: `${group.name} を削除してもよろしいですか？`,
    content,
    submitLabel: '削除',
    cancelLabel: 'キャンセル',
    triggerOpen,
    onOpenChange,
    onSubmit: onConfirm,
    destructive: true,
  };

  return <BaseConfirmDialog {...config} />;
}
