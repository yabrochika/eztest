'use client';

import { BaseDialog, BaseDialogField, BaseDialogConfig } from '@/frontend/reusable-components/dialogs/BaseDialog';
import { TestRun } from '../types';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';

interface EditTestRunDialogProps {
  projectId: string;
  testRun: TestRun;
  triggerOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTestRunUpdated: (testRun: TestRun) => void;
}

export function EditTestRunDialog({
  projectId,
  testRun,
  triggerOpen,
  onOpenChange,
  onTestRunUpdated,
}: EditTestRunDialogProps) {
  const { options: environmentOptions } = useDropdownOptions('TestRun', 'environment');

  const fields: BaseDialogField[] = [
    {
      name: 'name',
      label: 'テストラン名',
      placeholder: '例: ログイン機能 - ビルド #123',
      type: 'text',
      required: true,
      minLength: 3,
      maxLength: 50,
      cols: 2,
      defaultValue: testRun.name,
    },
    {
      name: 'environment',
      label: '環境',
      type: 'select',
      placeholder: '環境を選択',
      required: true,
      defaultValue: testRun.environment || 'none',
      options: [
        { value: 'none', label: '環境を選択' },
        ...environmentOptions.map(opt => ({ value: opt.value, label: opt.label })),
      ],
      cols: 2,
    },
    {
      name: 'description',
      label: '説明',
      placeholder: 'テストランの説明を入力',
      type: 'textarea',
      rows: 3,
      cols: 2,
      maxLength: 250,
      defaultValue: testRun.description || '',
    },
  ];

  const handleSubmit = async (formData: Record<string, string>) => {
    if (formData.environment === 'none' || !formData.environment) {
      throw new Error('環境を選択してください');
    }

    const response = await fetch(`/api/projects/${projectId}/testruns/${testRun.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        description: formData.description || undefined,
        environment: formData.environment,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'テストランの更新に失敗しました');
    }

    return data.data;
  };

  const config: BaseDialogConfig<TestRun> = {
    title: 'テストランを編集',
    description: 'テストラン情報を更新します。',
    fields,
    submitLabel: '保存',
    cancelLabel: 'キャンセル',
    triggerOpen,
    onOpenChange,
    onSubmit: handleSubmit,
    onSuccess: (updatedTestRun) => {
      if (updatedTestRun) {
        onTestRunUpdated(updatedTestRun);
      }
    },
    submitButtonName: 'Edit Test Run Dialog - Save',
    cancelButtonName: 'Edit Test Run Dialog - Cancel',
    disablePersistence: true,
    formPersistenceKey: `edit-test-run-${testRun.id}`,
  };

  return <BaseDialog {...config} />;
}

export type { EditTestRunDialogProps };
