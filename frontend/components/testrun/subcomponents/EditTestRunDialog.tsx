'use client';

import { useEffect, useState } from 'react';
import { BaseDialog, BaseDialogField, BaseDialogConfig } from '@/frontend/reusable-components/dialogs/BaseDialog';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { parseMultiValueField, serializeMultiValueField } from '../utils/multiValueField';
import { MultiSelectCheckboxField } from './MultiSelectCheckboxField';

interface ProjectMember {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface EditTestRunDialogProps {
  projectId: string;
  testRun: {
    id: string;
    name: string;
    description?: string;
    environment?: string;
    verificationEnvironment?: string;
    verificationEnvironmentNote?: string | null;
    version?: string;
    platform?: string;
    device?: string;
    assignedToIds?: string[];
    assignedToList?: Array<{
      id: string;
      name: string;
      email: string;
      avatar?: string;
    }>;
    assignedTo?: {
      id: string;
    };
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTestRunUpdated: (updatedTestRun: { id: string; name: string }) => void;
}

export function EditTestRunDialog({
  projectId,
  testRun,
  open,
  onOpenChange,
  onTestRunUpdated,
}: EditTestRunDialogProps) {
  const [key, setKey] = useState(0);
  const { options: environmentOptions } = useDropdownOptions('TestRun', 'environment');
  const { options: verificationEnvironmentOptions } = useDropdownOptions(
    'TestRun',
    'verificationEnvironment'
  );
  const [memberOptions, setMemberOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (open && testRun) {
      setKey((prev) => prev + 1);
    }
  }, [open, testRun]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/members`);
        if (response.ok) {
          const data = await response.json();
          const members: ProjectMember[] = data.data || [];
          setMemberOptions(
            members.map((m) => ({
              value: m.user.id,
              label: m.user.name || m.user.email,
            }))
          );
        }
      } catch {
        // Failed to fetch members - select will only show placeholder
      }
    };

    if (projectId) {
      fetchMembers();
    }
  }, [projectId]);

  // テスター割り当ての初期値を assignedToIds / assignedToList / 旧 assignedTo の順で解決
  const initialAssignedIds = (() => {
    if (testRun?.assignedToIds && testRun.assignedToIds.length > 0) {
      return testRun.assignedToIds;
    }
    if (testRun?.assignedToList && testRun.assignedToList.length > 0) {
      return testRun.assignedToList.map((u) => u.id);
    }
    if (testRun?.assignedTo?.id) {
      return [testRun.assignedTo.id];
    }
    return [];
  })();

  const fields: BaseDialogField[] = [
    {
      name: 'name',
      label: 'テストラン名',
      placeholder: '例: ログイン機能 - ビルド #123',
      type: 'text',
      required: true,
      minLength: 3,
      maxLength: 255,
      cols: 2,
      defaultValue: testRun?.name || '',
    },
    {
      name: 'environment',
      label: '環境',
      type: 'custom',
      required: true,
      defaultValue: serializeMultiValueField(parseMultiValueField(testRun?.environment)) || '',
      customRender: (value, onChange) => (
        <MultiSelectCheckboxField
          fieldName="environment"
          value={value}
          onChange={onChange}
          options={environmentOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
          emptyLabel="環境を1つ以上選択してください"
        />
      ),
      validate: (value) =>
        parseMultiValueField(value).length === 0 ? '環境を1つ以上選択してください' : undefined,
      cols: 2,
    },
    {
      name: 'verificationEnvironment',
      label: '検証環境',
      type: 'custom',
      defaultValue:
        serializeMultiValueField(parseMultiValueField(testRun?.verificationEnvironment)) || '',
      customRender: (value, onChange) => (
        <MultiSelectCheckboxField
          fieldName="verificationEnvironment"
          value={value}
          onChange={onChange}
          options={verificationEnvironmentOptions.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          emptyLabel="未選択"
        />
      ),
      cols: 2,
    },
    {
      name: 'verificationEnvironmentNote',
      label: '検証環境メモ',
      placeholder: '例: https://stg.example.com / iPhone 15 Pro / build #1234',
      type: 'textarea',
      rows: 3,
      cols: 2,
      maxLength: 500,
      defaultValue: testRun?.verificationEnvironmentNote || '',
    },
    {
      name: 'assignedToIds',
      label: 'テスター割り当て',
      type: 'custom',
      defaultValue: serializeMultiValueField(initialAssignedIds) || '',
      customRender: (value, onChange) => (
        <MultiSelectCheckboxField
          fieldName="assigned-to"
          value={value}
          onChange={onChange}
          options={memberOptions}
          emptyLabel="未割り当て"
        />
      ),
      cols: 2,
    },
    {
      name: 'platform',
      label: 'プラットフォーム',
      type: 'custom',
      defaultValue: serializeMultiValueField(parseMultiValueField(testRun?.platform)) || '',
      customRender: (value, onChange) => (
        <MultiSelectCheckboxField
          fieldName="platform"
          value={value}
          onChange={onChange}
          options={[
            { value: 'Web', label: 'Web' },
            { value: 'Web(SP)', label: 'Web(SP)' },
            { value: 'iOS Native', label: 'iOS Native' },
            { value: 'Android Native', label: 'Android Native' },
          ]}
          emptyLabel="未選択"
        />
      ),
      cols: 1,
    },
    {
      name: 'device',
      label: '端末',
      type: 'custom',
      defaultValue: serializeMultiValueField(parseMultiValueField(testRun?.device)) || '',
      customRender: (value, onChange) => (
        <MultiSelectCheckboxField
          fieldName="device"
          value={value}
          onChange={onChange}
          options={[
            { value: 'iPhone', label: 'iPhone' },
            { value: 'Android', label: 'Android' },
            { value: 'PC', label: 'PC' },
            { value: 'Chrome', label: 'Chrome' },
            { value: 'Safari', label: 'Safari' },
          ]}
          emptyLabel="未選択"
        />
      ),
      cols: 1,
    },
    {
      name: 'version',
      label: 'バージョン',
      placeholder: '例: v1.2.3',
      type: 'text',
      maxLength: 100,
      cols: 2,
      defaultValue: testRun?.version || '',
    },
    {
      name: 'description',
      label: '説明',
      placeholder: 'テストランの説明を入力',
      type: 'textarea',
      rows: 3,
      cols: 2,
      maxLength: 250,
      defaultValue: testRun?.description || '',
    },
  ];

  const handleSubmit = async (formData: Record<string, string>) => {
    if (!testRun) {
      throw new Error('編集対象のテストランが見つかりません');
    }

    const selectedEnvironments = parseMultiValueField(formData.environment);
    const selectedVerificationEnvironments = parseMultiValueField(
      formData.verificationEnvironment
    );
    const selectedAssignees = parseMultiValueField(formData.assignedToIds);
    const selectedPlatforms = parseMultiValueField(formData.platform);
    const selectedDevices = parseMultiValueField(formData.device);

    if (selectedEnvironments.length === 0) {
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
        environment: selectedEnvironments,
        verificationEnvironment: selectedVerificationEnvironments,
        // Send empty string (not undefined) so the backend treats it as an explicit clear.
        verificationEnvironmentNote: formData.verificationEnvironmentNote ?? '',
        version: formData.version || undefined,
        assignedToIds: selectedAssignees.length > 0 ? selectedAssignees : undefined,
        platform: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
        device: selectedDevices.length > 0 ? selectedDevices : undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'テストランの更新に失敗しました');
    }

    return data.data;
  };

  const config: BaseDialogConfig = {
    title: 'テストランを編集',
    description: 'テストラン情報を更新します。',
    fields,
    submitLabel: '更新する',
    cancelLabel: 'キャンセル',
    triggerOpen: open,
    onOpenChange,
    onSubmit: handleSubmit,
    onSuccess: (result) => {
      if (result && testRun) {
        const updated = result as { id: string; name: string };
        onTestRunUpdated({ id: updated.id || testRun.id, name: updated.name || testRun.name });
      }
    },
    disablePersistence: true,
    submitButtonName: 'Edit Test Run Dialog - Update',
    cancelButtonName: 'Edit Test Run Dialog - Cancel',
  };

  return <BaseDialog key={key} {...config} />;
}

export type { EditTestRunDialogProps };
