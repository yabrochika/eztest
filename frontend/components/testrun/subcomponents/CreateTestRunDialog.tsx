'use client';

import { useState, useEffect } from 'react';
import { BaseDialog, BaseDialogField, BaseDialogConfig } from '@/frontend/reusable-components/dialogs/BaseDialog';
import { TestRun } from '../types';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { parseMultiValueField, serializeMultiValueField } from '../utils/multiValueField';
import { MultiSelectCheckboxField } from './MultiSelectCheckboxField';
import { Checkbox } from '@/frontend/reusable-elements/checkboxes/Checkbox';

interface ProjectMember {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

// プラットフォーム ⇄ 端末 の双方向リンク定義
const PLATFORM_TO_DEVICE: Record<string, string> = {
  'iOS Native': 'iPhone',
  'Android Native': 'Android',
};
const DEVICE_TO_PLATFORM: Record<string, string> = {
  iPhone: 'iOS Native',
  Android: 'Android Native',
};

function syncLinkedField(
  prevSource: string[],
  nextSource: string[],
  currentTarget: string[],
  link: Record<string, string>
): string[] | null {
  const added = nextSource.filter((v) => !prevSource.includes(v));
  const removed = prevSource.filter((v) => !nextSource.includes(v));

  let target = [...currentTarget];
  let changed = false;

  for (const v of added) {
    const linked = link[v];
    if (linked && !target.includes(linked)) {
      target.push(linked);
      changed = true;
    }
  }

  for (const v of removed) {
    const linked = link[v];
    if (linked && target.includes(linked)) {
      target = target.filter((item) => item !== linked);
      changed = true;
    }
  }

  return changed ? target : null;
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
  const { options: verificationEnvironmentOptions } = useDropdownOptions(
    'TestRun',
    'verificationEnvironment'
  );

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
      name: 'verificationEnvironment',
      label: '検証環境',
      type: 'custom',
      defaultValue: '',
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
      customRender: (value, onChange, ctx) => (
        <MultiSelectCheckboxField
          fieldName="platform"
          value={value}
          onChange={(nextValue) => {
            // プラットフォームの選択を反映
            onChange(nextValue);

            if (!ctx) {
              return;
            }

            // iOS Native ⇄ iPhone, Android Native ⇄ Android を双方向で連動させる
            const nextDevices = syncLinkedField(
              parseMultiValueField(value),
              parseMultiValueField(nextValue),
              parseMultiValueField(ctx.formData.device),
              PLATFORM_TO_DEVICE
            );

            if (nextDevices !== null) {
              ctx.setFieldValue('device', serializeMultiValueField(nextDevices) || '');
            }
          }}
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
      customRender: (value, onChange, ctx) => (
        <MultiSelectCheckboxField
          fieldName="device"
          value={value}
          onChange={(nextValue) => {
            // 端末の選択を反映
            onChange(nextValue);

            if (!ctx) {
              return;
            }

            // iPhone ⇄ iOS Native, Android ⇄ Android Native を双方向で連動させる
            const nextPlatforms = syncLinkedField(
              parseMultiValueField(value),
              parseMultiValueField(nextValue),
              parseMultiValueField(ctx.formData.platform),
              DEVICE_TO_PLATFORM
            );

            if (nextPlatforms !== null) {
              ctx.setFieldValue('platform', serializeMultiValueField(nextPlatforms) || '');
            }
          }}
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
    const selectedVerificationEnvironments = parseMultiValueField(
      formData.verificationEnvironment
    );
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
        verificationEnvironment:
          selectedVerificationEnvironments.length > 0 ? selectedVerificationEnvironments : undefined,
        verificationEnvironmentNote: formData.verificationEnvironmentNote?.trim() || undefined,
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
