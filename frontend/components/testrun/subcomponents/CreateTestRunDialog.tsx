'use client';

import { useState, useEffect } from 'react';
import { BaseDialog, BaseDialogField, BaseDialogConfig } from '@/frontend/reusable-components/dialogs/BaseDialog';
import { TestRun } from '../types';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { parseMultiValueField } from '../utils/multiValueField';
import { MultiSelectCheckboxField } from './MultiSelectCheckboxField';

interface ProjectMember {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

// チーム選択チェックボックスの定義（label: 表示名、members: 該当する user.name）
const TESTER_TEAMS: Array<{ key: string; label: string; members: string[] }> = [
  {
    key: 'qa',
    label: 'QAチーム',
    members: ['いちむら', '下向仁', '春日井亮火', 'Misa Yamada', '野口裕太'],
  },
];

interface CreateTestRunDialogProps {
  projectId: string;
  triggerOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTestRunCreated: (testRun: TestRun) => void;
  /**
   * 事前にテストランへ含めたいテストスイート ID 群。
   * 指定された場合、テストスイート配下のテストケースが自動的に追加される。
   */
  testSuiteIds?: string[];
  /**
   * テストラン名の初期値（テストスイートから作成する際にスイート名を引き継ぐなど）。
   */
  defaultName?: string;
}

export function CreateTestRunDialog({
  projectId,
  triggerOpen,
  onOpenChange,
  onTestRunCreated,
  testSuiteIds,
  defaultName,
}: CreateTestRunDialogProps) {
  // Fetch dynamic dropdown options
  const { options: environmentOptions } = useDropdownOptions('TestRun', 'environment');

  // Fetch project members for tester assignment
  const [memberOptions, setMemberOptions] = useState<{ value: string; label: string }[]>([]);

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
      defaultValue: defaultName,
    },
    {
      name: 'environment',
      label: '環境',
      type: 'custom',
      required: true,
      defaultValue: '',
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
      name: 'assignedToIds',
      label: 'テスター割り当て',
      type: 'custom',
      defaultValue: '',
      customRender: (value, onChange) => {
        const selectedIds = parseMultiValueField(value);

        // 各チームについて、メンバー名 → 既知のユーザーID 群に解決する。
        // ローカル/環境によってメンバーが揃わなくても UI は常に表示し、
        // 見つかったメンバーのみ切り替える。
        const teams = TESTER_TEAMS.map((team) => {
          const memberIds = team.members
            .map((name) => memberOptions.find((m) => m.label === name)?.value)
            .filter((id): id is string => Boolean(id));
          return { ...team, memberIds };
        });

        const toggleTeam = (memberIds: string[], allSelected: boolean) => {
          if (memberIds.length === 0) {
            return;
          }
          const next = allSelected
            ? selectedIds.filter((id) => !memberIds.includes(id))
            : Array.from(new Set([...selectedIds, ...memberIds]));
          onChange(serializeMultiValueField(next) || '');
        };

        return (
          <div className="space-y-2">
            {teams.length > 0 && (
              <div className="rounded-md border border-[#334155] bg-[#0f172a] p-3">
                <p className="mb-2 text-xs text-white/50">
                  チームをチェックすると、そのメンバーが自動で選択されます
                </p>
                <div className="flex flex-wrap gap-3">
                  {teams.map((team) => {
                    const id = `tester-team-${team.key}-checkbox`;
                    const found = team.memberIds.length;
                    const total = team.members.length;
                    const allSelected =
                      found > 0 &&
                      team.memberIds.every((memberId) => selectedIds.includes(memberId));
                    const disabled = found === 0;
                    return (
                      <div
                        key={team.key}
                        className="flex items-center gap-2 text-sm text-white/90"
                        title={
                          disabled
                            ? `${team.label} の対象メンバーがプロジェクトに存在しません`
                            : found < total
                              ? `${team.label} の対象 ${total} 名中、このプロジェクトには ${found} 名のみ`
                              : undefined
                        }
                      >
                        <Checkbox
                          id={id}
                          variant="glass"
                          checked={allSelected}
                          disabled={disabled}
                          onCheckedChange={() => toggleTeam(team.memberIds, allSelected)}
                        />
                        <label
                          htmlFor={id}
                          className={`select-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                          {team.label}
                          {found < total && (
                            <span className="ml-1 text-xs text-white/40">
                              ({found}/{total})
                            </span>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <MultiSelectCheckboxField
              fieldName="assigned-to"
              value={value}
              onChange={onChange}
              options={memberOptions}
              emptyLabel="未割り当て"
            />
          </div>
        );
      },
      cols: 2,
    },
    {
      name: 'platform',
      label: 'プラットフォーム',
      type: 'custom',
      defaultValue: '',
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
      defaultValue: '',
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
    },
    {
      name: 'description',
      label: '説明',
      placeholder: 'テストランの説明を入力',
      type: 'textarea',
      rows: 3,
      cols: 2,
      maxLength: 250,
    },
  ];

  const handleSubmit = async (formData: Record<string, string>) => {
    const selectedEnvironments = parseMultiValueField(formData.environment);
    const selectedAssignees = parseMultiValueField(formData.assignedToIds);
    const selectedPlatforms = parseMultiValueField(formData.platform);
    const selectedDevices = parseMultiValueField(formData.device);

    // Validate environment is selected
    if (selectedEnvironments.length === 0) {
      throw new Error('環境を選択してください');
    }

    const response = await fetch(`/api/projects/${projectId}/testruns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        description: formData.description || undefined,
        environment: selectedEnvironments,
        version: formData.version || undefined,
        assignedToIds: selectedAssignees.length > 0 ? selectedAssignees : undefined,
        platform: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
        device: selectedDevices.length > 0 ? selectedDevices : undefined,
        executionType: 'MANUAL',
        testSuiteIds: testSuiteIds && testSuiteIds.length > 0 ? testSuiteIds : undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'テストランの作成に失敗しました');
    }

    return data.data;
  };

  const config: BaseDialogConfig<TestRun> = {
    title: 'テストランを作成',
    description: 'テストケースを実行し、結果を記録するための新しいテストランを作成します。',
    fields,
    submitLabel: 'テストランを作成',
    cancelLabel: 'キャンセル',
    triggerOpen,
    onOpenChange,
    onSubmit: handleSubmit,
    onSuccess: (testRun) => {
      if (testRun) {
        onTestRunCreated(testRun);
      }
    },
    submitButtonName: 'Create Test Run Dialog - Create Test Run',
    cancelButtonName: 'Create Test Run Dialog - Cancel',
    // 事前指定値（テストスイート起点の作成）がある場合は永続化値で上書きしない
    disablePersistence: !!defaultName || !!(testSuiteIds && testSuiteIds.length > 0),
  };

  return <BaseDialog {...config} />;
}

export type { CreateTestRunDialogProps };
