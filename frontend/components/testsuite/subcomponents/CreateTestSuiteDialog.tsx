'use client';

import { BaseDialog, BaseDialogField, BaseDialogConfig } from '@/frontend/reusable-components/dialogs/BaseDialog';
import { TestSuite } from '../types';

export interface CreateTestSuiteDialogProps {
  projectId: string;
  testSuites: TestSuite[];
  triggerOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTestSuiteCreated: (suite: TestSuite) => void;
}

export function CreateTestSuiteDialog({
  projectId,
  testSuites,
  triggerOpen,
  onOpenChange,
  onTestSuiteCreated,
}: CreateTestSuiteDialogProps) {
  // Get parent suite options - only root level suites
  const parentOptions = testSuites
    .filter(s => !s.parentId)
    .map((suite) => ({
      value: suite.id,
      label: suite.name,
    }));

  const fields: BaseDialogField[] = [
    {
      name: 'name',
      label: 'テストスイート名',
      placeholder: 'Authentication Tests',
      type: 'text',
      required: true,
      minLength: 3,
      maxLength: 50,
    },
    {
      name: 'description',
      label: 'Description',
      placeholder: 'Brief description of the test suite...',
      type: 'textarea',
      rows: 3,
      maxLength: 250,
    },
    {
      name: 'parentId',
      label: 'Parent Suite',
      type: 'select',
      placeholder: 'Select parent suite',
      defaultValue: 'none',
      options: [
        { value: 'none', label: 'None (Root Level)' },
        ...parentOptions,
      ],
    },
  ];

  const handleSubmit = async (formData: Record<string, string>) => {
    // 親スイートID は select の「親なし」値（'none'）／未入力（''）／削除済みID の混入を
    // 防ぐため、現在表示中の根スイート一覧に含まれている時のみ送信する。
    const parentIdRaw = (formData.parentId ?? '').trim();
    const validParentId =
      parentIdRaw && parentIdRaw !== 'none' && parentOptions.some((o) => o.value === parentIdRaw)
        ? parentIdRaw
        : undefined;

    const response = await fetch(`/api/projects/${projectId}/testsuites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        description: formData.description || undefined,
        parentId: validParentId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Failed to create test suite');
    }

    return data.data;
  };

  const config: BaseDialogConfig<TestSuite> = {
    title: 'テストスイートを作成',
    description: 'テストケースをスイートにまとめて、テストを整理しやすくします。',
    fields,
    submitLabel: 'テストスイートを作成',
    cancelLabel: 'キャンセル',
    triggerOpen,
    onOpenChange,
    onSubmit: handleSubmit,
    onSuccess: (suite) => {
      if (suite) {
        onTestSuiteCreated(suite);
      }
    },
    submitButtonName: 'Create Test Suite Dialog - Create Test Suite',
    cancelButtonName: 'Create Test Suite Dialog - Cancel',
  };

  return <BaseDialog {...config} />;
}
