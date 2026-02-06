'use client';

import { BaseConfirmDialog, BaseConfirmDialogConfig } from '@/frontend/reusable-components/dialogs/BaseConfirmDialog';
import { TestCase } from '../types';

interface DeleteTestCaseDialogProps {
  open: boolean;
  testCase: TestCase | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function DeleteTestCaseDialog({
  open,
  testCase,
  onOpenChange,
  onConfirm,
}: DeleteTestCaseDialogProps) {
  if (!testCase) return null;

  const config: BaseConfirmDialogConfig = {
    title: 'テストケースを削除',
    description: `「${testCase.title}」を削除してもよろしいですか？この操作は取り消せません。`,
    submitLabel: '削除',
    cancelLabel: 'キャンセル',
    triggerOpen: open,
    onOpenChange,
    onSubmit: onConfirm,
    destructive: true,
    dialogName: 'Delete Test Case Dialog (Detail)',
    submitButtonName: 'Delete Test Case Dialog (Detail) - Delete',
    cancelButtonName: 'Delete Test Case Dialog (Detail) - Cancel',
  };

  return <BaseConfirmDialog {...config} />;
}
