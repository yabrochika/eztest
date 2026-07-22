'use client';

import { BaseDialog, BaseDialogConfig } from '@/frontend/reusable-components/dialogs/BaseDialog';
import { TestRun } from '../types';

interface DuplicateTestRunDialogProps {
  testRun: TestRun | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 入力された新しいテストラン名（ブランチ名）を受け取り複製を実行する。失敗時は throw すること。 */
  onDuplicate: (newName: string) => Promise<void>;
}

export type { DuplicateTestRunDialogProps };

/**
 * テストランを新しい名前（ブランチ名）で複製するためのダイアログ。
 * 名前入力欄のみを持ち、デフォルトで「{元の名前} (コピー)」を提示する。
 * 親コンポーネント側では、source の testRun が変わるたびに `key` を切り替えて
 * 再マウントすることで、デフォルト名が常に最新のテストランに追従するようにする。
 */
export function DuplicateTestRunDialog({
  testRun,
  open,
  onOpenChange,
  onDuplicate,
}: DuplicateTestRunDialogProps) {
  if (!testRun) {
    return null;
  }

  const defaultName = `${testRun.name} (コピー)`;

  const config: BaseDialogConfig<void> = {
    title: 'テストランを複製',
    description:
      '新しいテストラン名（ブランチ名）を入力してください。元のテストランの設定とテストケースを引き継ぎ、テスト結果は未実行の状態で作成されます。',
    triggerOpen: open,
    onOpenChange,
    disablePersistence: true,
    submitLabel: '複製',
    cancelLabel: 'キャンセル',
    fields: [
      {
        name: 'name',
        label: 'テストラン名',
        placeholder: '新しいテストラン名',
        type: 'text',
        required: true,
        minLength: 3,
        maxLength: 255,
        defaultValue: defaultName,
      },
    ],
    onSubmit: async (formData) => {
      await onDuplicate(formData.name.trim());
    },
    submitButtonName: 'Duplicate Test Run Dialog - Duplicate',
    cancelButtonName: 'Duplicate Test Run Dialog - Cancel',
  };

  return <BaseDialog<void> {...config} />;
}
