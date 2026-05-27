'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, User, Plus, Pencil, Trash2, Play } from 'lucide-react';
import { TestRun } from '../types';
import { ActionMenu } from '@/frontend/reusable-components/menus/ActionMenu';
import { formatDateTime } from '@/lib/date-utils';

interface TestRunsKanbanViewProps {
  testRuns: TestRun[];
  canUpdate: boolean;
  canDelete: boolean;
  canCreate?: boolean;
  onCardClick: (testRun: TestRun) => void;
  onViewDetails: (testRun: TestRun) => void;
  onEdit: (testRun: TestRun) => void;
  onDelete: (testRun: TestRun) => void;
  onCreate?: () => void;
}

/**
 * カンバン列の定義（Notion 風のカラフルなパステル配色）。
 * - NOT_STARTED, PLANNED → Not Started
 * - IN_PROGRESS         → In Progress
 * - PAUSED              → Paused
 * - COMPLETED, CANCELLED → Done
 */
interface KanbanColumnDef {
  key: string;
  title: string;
  statuses: string[];
  /** 列タイトルの色 */
  titleClassName: string;
  /** カード背景（パステル） */
  cardClassName: string;
  /** カードボーダー */
  cardBorderClassName: string;
}

const KANBAN_COLUMNS: KanbanColumnDef[] = [
  {
    key: 'not_started',
    title: 'Not Started',
    statuses: ['NOT_STARTED', 'PLANNED'],
    titleClassName: 'text-rose-300',
    cardClassName: 'bg-rose-500/10 hover:bg-rose-500/15',
    cardBorderClassName: 'border-rose-500/30',
  },
  {
    key: 'in_progress',
    title: 'In Progress',
    statuses: ['IN_PROGRESS'],
    titleClassName: 'text-sky-300',
    cardClassName: 'bg-sky-500/10 hover:bg-sky-500/15',
    cardBorderClassName: 'border-sky-500/30',
  },
  {
    key: 'paused',
    title: 'Paused',
    statuses: ['PAUSED'],
    titleClassName: 'text-amber-300',
    cardClassName: 'bg-amber-500/10 hover:bg-amber-500/15',
    cardBorderClassName: 'border-amber-500/30',
  },
  {
    key: 'done',
    title: 'Done',
    statuses: ['COMPLETED', 'CANCELLED'],
    titleClassName: 'text-emerald-300',
    cardClassName: 'bg-emerald-500/10 hover:bg-emerald-500/15',
    cardBorderClassName: 'border-emerald-500/30',
  },
];

export function TestRunsKanbanView({
  testRuns,
  canUpdate,
  canDelete,
  canCreate = false,
  onCardClick,
  onEdit,
  onDelete,
  onCreate,
}: TestRunsKanbanViewProps) {
  const router = useRouter();

  const grouped = useMemo(() => {
    const map = new Map<string, TestRun[]>();
    for (const col of KANBAN_COLUMNS) {
      map.set(col.key, []);
    }
    for (const run of testRuns) {
      const col = KANBAN_COLUMNS.find((c) => c.statuses.includes(run.status));
      if (col) {
        map.get(col.key)!.push(run);
      }
    }
    return map;
  }, [testRuns]);

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[640px] lg:min-w-0">
        {KANBAN_COLUMNS.map((col) => {
          const items = grouped.get(col.key) ?? [];
          return (
            <div key={col.key} className="flex flex-col min-h-[200px]">
              {/* Column header */}
              <div className="flex items-center justify-between px-1 pb-2 mb-2 border-b border-white/10">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className={`text-sm font-semibold ${col.titleClassName}`}>
                    {col.title}
                  </h3>
                  <span className="text-xs font-medium text-white/40">
                    {items.length}
                  </span>
                </div>
                {canCreate && onCreate ? (
                  <button
                    type="button"
                    onClick={onCreate}
                    className="inline-flex items-center justify-center size-5 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    title="新規テストラン"
                    aria-label="新規テストラン"
                    data-button-name={`Test Runs Kanban - Create (${col.key})`}
                  >
                    <Plus className="size-4" />
                  </button>
                ) : null}
              </div>

              {/* Column body */}
              <div className="flex-1 space-y-2">
                {items.length === 0 ? (
                  <div className="py-6 text-center text-xs text-white/30">
                    なし
                  </div>
                ) : (
                  items.map((testRun) => (
                    <KanbanCard
                      key={testRun.id}
                      testRun={testRun}
                      cardClassName={col.cardClassName}
                      cardBorderClassName={col.cardBorderClassName}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      onCardClick={onCardClick}
                      onViewDetails={(tr) =>
                        router.push(
                          `/projects/${tr.project?.id || ''}/testruns/${tr.id}`
                        )
                      }
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface KanbanCardProps {
  testRun: TestRun;
  cardClassName: string;
  cardBorderClassName: string;
  canUpdate: boolean;
  canDelete: boolean;
  onCardClick: (testRun: TestRun) => void;
  onViewDetails: (testRun: TestRun) => void;
  onEdit: (testRun: TestRun) => void;
  onDelete: (testRun: TestRun) => void;
}

function KanbanCard({
  testRun,
  cardClassName,
  cardBorderClassName,
  canUpdate,
  canDelete,
  onCardClick,
  onViewDetails,
  onEdit,
  onDelete,
}: KanbanCardProps) {
  const assignedUsers =
    testRun.assignedToList && testRun.assignedToList.length > 0
      ? testRun.assignedToList
      : testRun.assignedTo
        ? [testRun.assignedTo]
        : [];
  const assigneeText =
    assignedUsers.length > 0
      ? assignedUsers.map((u) => u.name).join(', ')
      : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onCardClick(testRun)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardClick(testRun);
        }
      }}
      className={`group cursor-pointer rounded-lg border ${cardBorderClassName} ${cardClassName} p-3 transition-colors`}
    >
      <div className="flex items-start gap-2">
        <h4 className="flex-1 text-sm font-semibold text-white leading-snug break-words line-clamp-2">
          {testRun.name}
        </h4>
        <div
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ActionMenu
            items={[
              {
                label: '詳細を見る',
                icon: Play,
                onClick: () => onViewDetails(testRun),
                buttonName: `Kanban Card - View Details (${testRun.name})`,
              },
              {
                label: '編集',
                icon: Pencil,
                onClick: () => onEdit(testRun),
                show: canUpdate,
                buttonName: `Kanban Card - Edit (${testRun.name})`,
              },
              {
                label: '削除',
                icon: Trash2,
                onClick: () => onDelete(testRun),
                variant: 'destructive',
                show: canDelete,
                buttonName: `Kanban Card - Delete (${testRun.name})`,
              },
            ]}
            align="end"
            iconSize="w-3.5 h-3.5"
          />
        </div>
      </div>

      {testRun.description ? (
        <p className="mt-1 text-xs text-white/60 line-clamp-2 break-words">
          {testRun.description}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/50">
        {assigneeText ? (
          <span className="inline-flex items-center gap-1 min-w-0">
            <User className="size-3 shrink-0" />
            <span className="truncate max-w-[120px]">{assigneeText}</span>
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1">
          <Calendar className="size-3 shrink-0" />
          {formatDateTime(testRun.createdAt)}
        </span>
      </div>
    </div>
  );
}
