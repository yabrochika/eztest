import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/frontend/reusable-elements/avatars/Avatar';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { ButtonPrimary } from '@/frontend/reusable-elements/buttons/ButtonPrimary';
import { ButtonSecondary } from '@/frontend/reusable-elements/buttons/ButtonSecondary';
import { formatDateTime } from '@/lib/date-utils';
import { DetailCard } from '@/frontend/reusable-components/cards/DetailCard';
import { GroupedDataTable, type ColumnDef, type GroupConfig } from '@/frontend/reusable-components/tables/GroupedDataTable';
import { AlertCircle, Plus, Bug, ListChecks, ChevronDown, Trash2 } from 'lucide-react';
import { TestResult, TestCase } from '../types';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { getDynamicBadgeProps } from '@/lib/badge-color-utils';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/frontend/reusable-elements/dropdowns/DropdownMenu';

interface TestCasesListCardProps {
  results: TestResult[];
  testRunStatus: string;
  canUpdate?: boolean;
  canCreate?: boolean;
  projectId: string;
  onAddTestCases: () => void;
  onAddTestSuites: () => void;
  onExecuteTestCase: (testCase: TestCase) => void;
  onCreateDefect?: (testCaseId: string) => void;
  /** テストケースをテストランから除外する */
  onExcludeTestCase?: (testCase: TestCase, currentStatus: string) => void;
  /** 実行済み結果の詳細（コメント・添付）を表示する */
  onViewResult?: (result: TestResult) => void;
  forceShowDefectActions?: boolean;
  getResultIcon: (status?: string) => React.JSX.Element;
}

interface ResultRow {
  id: string;
  testCase: TestCase;
  status: string;
  comment?: string;
  duration?: number;
  executedBy?: { name: string; email?: string; avatar?: string | null };
  executedAt?: string;
  /** 元の TestResult（ビュー表示用）。コメントや添付を参照する。 */
  result: TestResult;
}

export function TestCasesListCard({
  results,
  testRunStatus,
  canUpdate = true,
  canCreate = true,
  projectId,
  onAddTestCases,
  onAddTestSuites,
  onExecuteTestCase,
  onCreateDefect,
  onExcludeTestCase,
  onViewResult,
  forceShowDefectActions = false,
  getResultIcon,
}: TestCasesListCardProps) {
  const router = useRouter();
  const { options: priorityOptions, loading: loadingPriority } = useDropdownOptions('TestCase', 'priority');
  const { options: statusOptions, loading: loadingStatus } = useDropdownOptions('TestResult', 'status');
  const { hasPermission: hasPermissionCheck } = usePermissions();
  
  // Check if user can create defects
  const canCreateDefect = hasPermissionCheck('defects:create');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'FAILED':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'BLOCKED':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'SKIPPED':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'RETEST':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const columns: ColumnDef<ResultRow>[] = [
    {
      key: 'tcId',
      label: 'ID',
      width: '70px',
      render: (row: ResultRow) => (
        <p className="text-xs font-mono text-white/70 truncate">{row.testCase.tcId || '-'}</p>
      ),
    },
    {
      key: 'testCase',
      label: 'テストケース',
      className: 'min-w-0',
      render: (row: ResultRow) => (
        <div className="min-w-0 overflow-hidden">
          <p className="font-medium text-white/90 truncate block">{row.testCase.title}</p>
          {row.comment && (
            <p className="text-xs text-white/60 mt-1 truncate">
              {row.comment}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'estimatedTime',
      label: '実行時間',
      width: '100px',
      render: (row: ResultRow) => {
        const t = row.duration;
        if (t == null || !Number.isFinite(t)) return <span className="text-white/70 text-sm">-</span>;
        const h = Math.floor(t / 3600);
        const m = Math.floor((t % 3600) / 60);
        const s = t % 60;
        return (
          <span className="text-white/70 text-sm font-mono">
            {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
          </span>
        );
      },
    },
    {
      key: 'priority',
      label: '優先度',
      width: '90px',
      render: (row: ResultRow) => {
        const badgeProps = getDynamicBadgeProps(row.testCase.priority, priorityOptions);
        const priorityLabel = !loadingPriority && priorityOptions.length > 0
          ? priorityOptions.find(opt => opt.value === row.testCase.priority)?.label || row.testCase.priority
          : row.testCase.priority;
        return (
          <Badge 
            variant="outline" 
            className={`text-xs px-2 py-0.5 ${badgeProps.className}`}
            style={badgeProps.style}
          >
            {priorityLabel}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      label: 'ステータス',
      width: '120px',
      render: (row: ResultRow) => {
        const badgeProps = getDynamicBadgeProps(row.status, statusOptions);
        const label = !loadingStatus && statusOptions.length > 0
          ? statusOptions.find(opt => opt.value === row.status)?.label || row.status
          : row.status;
        return (
          <div className="flex items-center gap-2">
            {row.status !== 'FAILED' && getResultIcon(row.status)}
            <Badge
              variant="outline"
              className={`text-xs px-2 py-0.5 ${badgeProps.className}`}
              style={badgeProps.style}
            >
              {label}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'executedBy',
      label: '実行者',
      width: '70px',
      align: 'center',
      render: (row: ResultRow) => {
        const user = row.executedBy;
        if (!user?.name) {
          return <span className="text-white/50 text-sm">-</span>;
        }
        const initials = user.name
          .trim()
          .split(/\s+/)
          .map((part) => part.charAt(0))
          .join('')
          .slice(0, 2)
          .toUpperCase();
        return (
          <div className="flex items-center justify-center" title={user.name}>
            <Avatar className="size-7">
              {user.avatar ? (
                <AvatarImage src={user.avatar} alt={user.name} />
              ) : null}
              <AvatarFallback className="text-[10px]">
                {initials || '?'}
              </AvatarFallback>
            </Avatar>
          </div>
        );
      },
    },
    {
      key: 'executedAt',
      label: '日時',
      width: '140px',
      render: (row: ResultRow) => (
        <span className="text-white/70 text-sm">
          {row.executedAt
            ? formatDateTime(row.executedAt)
            : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'アクション',
      width: '175px',
      render: (row: ResultRow) => (
        <div className="flex items-center gap-1 justify-end">
          {(testRunStatus === 'IN_PROGRESS' || forceShowDefectActions) && (
            <>
              {testRunStatus === 'IN_PROGRESS' && canUpdate && (
                <Button
                  variant="glass"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExecuteTestCase(row.testCase);
                  }}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-7 w-7 p-0 inline-flex items-center justify-center text-base leading-none"
                  title={row.status && row.status !== 'SKIPPED' ? '結果を更新' : 'テストケースを実行'}
                  aria-label={row.status && row.status !== 'SKIPPED' ? '結果を更新' : 'テストケースを実行'}
                  buttonName={`Test Cases List Card - ${row.status && row.status !== 'SKIPPED' ? 'Update' : 'Execute'} (${row.testCase.title || row.testCase.id})`}
                >
                  ▶
                </Button>
              )}
              {row.status === 'FAILED' && canCreateDefect && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <ButtonSecondary
                      size="sm"
                      className="inline-flex items-center justify-center gap-0.5 h-7 px-1.5 text-base leading-none"
                      title="欠陥アクション"
                      aria-label="欠陥アクション"
                      buttonName={`Test Cases List Card - Defect Actions (${row.testCase.title || row.testCase.id})`}
                    >
                      <span aria-hidden="true">👾</span>
                      <ChevronDown className="w-3 h-3" />
                    </ButtonSecondary>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {onCreateDefect && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateDefect(row.testCase.id);
                        }}
                      >
                        <Bug className="w-4 h-4 mr-2" />
                        欠陥を作成
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onExecuteTestCase(row.testCase);
                      }}
                    >
                      <ListChecks className="w-4 h-4 mr-2" />
                      欠陥を選択
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
          {onExcludeTestCase &&
            canUpdate &&
            testRunStatus !== 'COMPLETED' &&
            testRunStatus !== 'CANCELLED' && (
              <Button
                variant="glass"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onExcludeTestCase(row.testCase, row.status);
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0 inline-flex items-center justify-center"
                title="このテストケースをテストランから除外"
                aria-label="このテストケースをテストランから除外"
                buttonName={`Test Cases List Card - Exclude (${row.testCase.title || row.testCase.id})`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
        </div>
      ),
    },
  ];

  // Group by Module
  const groupConfig: GroupConfig<ResultRow> = {
    getGroupId: (row) => row.testCase.module?.id || 'no-module',
    getGroupName: (groupId) => {
      if (groupId === 'no-module') return 'モジュールなし';
      const result = tableData.find(r => r.testCase.module?.id === groupId);
      return result?.testCase.module?.name || 'モジュールなし';
    },
    getGroupCount: (groupId) => {
      return tableData.filter(r => (r.testCase.module?.id || 'no-module') === groupId).length;
    },
  };

  const tableData: ResultRow[] = (results || [])
    .filter((result) => result.testCase)
    .map((result) => ({
      id: result.testCase.id,
      testCase: result.testCase,
      status: result.status,
      comment: result.comment,
      duration: result.duration,
      executedBy: result.executedBy,
      executedAt: result.executedAt,
      result,
    }));

  /**
   * 実行済みテストケース（コメント/添付ファイルが記録され得る行）かを判定する。
   * NOT_STARTED や、コメントが無い空の SKIPPED プレースホルダーは未実行として扱う。
   */
  const isExecutedRow = (row: ResultRow): boolean => {
    if (!row.status || row.status === 'NOT_STARTED') return false;
    if (row.status === 'SKIPPED' && !row.comment && !(row.result.attachments?.length)) {
      return false;
    }
    return true;
  };

  /** モジュール名の末尾の数字を取得（並び替え用）。なければ no-module は末尾にするため Infinity、数字なしは 0 */
  const getModuleSortKey = (row: ResultRow): number => {
    const name = row.testCase.module?.name;
    if (!name || !row.testCase.module?.id) return Number.POSITIVE_INFINITY; // モジュールなしは最後
    const matches = name.match(/\d+/g);
    if (!matches || matches.length === 0) return 0;
    const lastNum = parseInt(matches[matches.length - 1], 10);
    return Number.isNaN(lastNum) ? 0 : lastNum;
  };

  // IN_PROGRESS時はRTC-ID昇順のフラットリスト、それ以外はモジュールグループ表示
  const isInProgress = testRunStatus === 'IN_PROGRESS';

  const tableDataSorted = isInProgress
    ? [...tableData].sort((a, b) => {
        const aId = a.testCase.rtcId || '';
        const bId = b.testCase.rtcId || '';
        // RTC-IDがない行は末尾に
        if (!aId && bId) return 1;
        if (aId && !bId) return -1;
        return aId.localeCompare(bId, undefined, { numeric: true });
      })
    : [...tableData].sort((a, b) => {
        const keyA = getModuleSortKey(a);
        const keyB = getModuleSortKey(b);
        if (keyA !== keyB) return keyA - keyB;
        return (a.testCase.rtcId || '').localeCompare(b.testCase.rtcId || '', undefined, { numeric: true });
      });

  return (
    <DetailCard
      title={`テストケース (${results?.length || 0})`}
      contentClassName=""
      headerAction={
        results && results.length > 0 && canCreate ? (
          <div className="flex gap-2 flex-wrap justify-end">
            <Button
              variant="glass"
              size="sm"
              onClick={onAddTestSuites}
              disabled={testRunStatus === 'COMPLETED' || testRunStatus === 'CANCELLED'}
            >
              <Plus className="w-4 h-4 mr-2" />
              テストスイートを追加
            </Button>
            <Button
              variant="glass"
              size="sm"
              onClick={onAddTestCases}
              disabled={testRunStatus === 'COMPLETED' || testRunStatus === 'CANCELLED'}
            >
              <Plus className="w-4 h-4 mr-2" />
              テストケースを追加
            </Button>
          </div>
        ) : undefined
      }
    >
      {!results || results.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">このテストランにテストケースはありません</p>
          {canCreate && (
            <div className="flex gap-2 justify-center flex-wrap">
              <ButtonPrimary
                size="default"
                onClick={onAddTestCases}
                disabled={testRunStatus === 'COMPLETED' || testRunStatus === 'CANCELLED'}
              >
                <Plus className="w-4 h-4 mr-2" />
                テストケースを追加
              </ButtonPrimary>
              <Button
                variant="glass"
                size="default"
                onClick={onAddTestSuites}
                disabled={testRunStatus === 'COMPLETED' || testRunStatus === 'CANCELLED'}
              >
                <Plus className="w-4 h-4 mr-2" />
                テストスイートを追加
              </Button>
            </div>
          )}
        </div>
      ) : (
        <GroupedDataTable
          data={tableDataSorted}
          columns={columns}
          grouped={!isInProgress}
          groupConfig={groupConfig}
          defaultExpanded={true}
          onRowClick={(row) => {
            // 実行済み行はコメント・添付ファイルを読み取り専用で表示。
            // 未実行（NOT_STARTED 等）の行はこれまで通りテストケース詳細ページへ遷移する。
            if (onViewResult && isExecutedRow(row)) {
              onViewResult(row.result);
              return;
            }
            router.push(`/projects/${projectId}/testcases/${row.testCase.id}`);
          }}
          gridTemplateColumns="70px 1fr 100px 90px 120px 70px 140px 175px"
          emptyMessage="テストケースはありません"
        />
      )}
    </DetailCard>
  );
}
