'use client';

import { useMemo, useState } from 'react';
import { Calendar, User, Plus, Pencil, Trash2, Play, CheckCircle2, ArrowRightLeft, Copy } from 'lucide-react';
import { TestRun } from '../types';
import { ActionMenu, type ActionMenuItem } from '@/frontend/reusable-components/menus/ActionMenu';
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
  onDuplicate?: (testRun: TestRun) => void;
  onCreate?: () => void;
  /** カードのドロップ／メニュー操作でステータスを変更する */
  onStatusChange?: (testRun: TestRun, newStatus: string) => void;
}

/**
 * カンバン列の定義（Notion 風のカラフルなパステル配色）。
 * - NOT_STARTED, PLANNED → Not Started
 * - IN_PROGRESS         → In Progress
 * - PAUSED              → Paused
 * - Regression test updated → Regression test updated
 * - COMPLETED, CANCELLED → Done
 *
 * `primaryStatus` はこの列にカードをドロップ／移動したときに設定するステータス。
 */
interface KanbanColumnDef {
  key: string;
  title: string;
  statuses: string[];
  /** この列へ移動したときに設定するステータス */
  primaryStatus: string;
  /** 列タイトルの色 */
  titleClassName: string;
  /** カード背景（パステル） */
  cardClassName: string;
  /** カードボーダー */
  cardBorderClassName: string;
  /** ドラッグオーバー時のハイライト */
  dropActiveClassName: string;
}

const KANBAN_COLUMNS: KanbanColumnDef[] = [
  {
    key: 'not_started',
    title: 'Not Started',
    statuses: ['NOT_STARTED', 'PLANNED'],
    primaryStatus: 'NOT_STARTED',
    titleClassName: 'text-rose-300',
    cardClassName: 'bg-rose-500/10 hover:bg-rose-500/15',
    cardBorderClassName: 'border-rose-500/30',
    dropActiveClassName: 'bg-rose-500/10 ring-1 ring-rose-400/40',
  },
  {
    key: 'in_progress',
    title: 'In Progress',
    statuses: ['IN_PROGRESS'],
    primaryStatus: 'IN_PROGRESS',
    titleClassName: 'text-sky-300',
    cardClassName: 'bg-sky-500/10 hover:bg-sky-500/15',
    cardBorderClassName: 'border-sky-500/30',
    dropActiveClassName: 'bg-sky-500/10 ring-1 ring-sky-400/40',
  },
  {
    key: 'paused',
    title: 'Paused',
    statuses: ['PAUSED'],
    primaryStatus: 'PAUSED',
    titleClassName: 'text-amber-300',
    cardClassName: 'bg-amber-500/10 hover:bg-amber-500/15',
    cardBorderClassName: 'border-amber-500/30',
    dropActiveClassName: 'bg-amber-500/10 ring-1 ring-amber-400/40',
  },
  {
    key: 'regression_test_updated',
    title: 'Regression test updated',
    statuses: ['Regression test updated'],
    primaryStatus: 'Regression test updated',
    titleClassName: 'text-violet-300',
    cardClassName: 'bg-violet-500/10 hover:bg-violet-500/15',
    cardBorderClassName: 'border-violet-500/30',
    dropActiveClassName: 'bg-violet-500/10 ring-1 ring-violet-400/40',
  },
  {
    key: 'done',
    title: 'Done',
    statuses: ['COMPLETED', 'CANCELLED'],
    primaryStatus: 'COMPLETED',
    titleClassName: 'text-emerald-300',
    cardClassName: 'bg-emerald-500/10 hover:bg-emerald-500/15',
    cardBorderClassName: 'border-emerald-500/30',
    dropActiveClassName: 'bg-emerald-500/10 ring-1 ring-emerald-400/40',
  },
];

const DRAG_MIME = 'application/x-eztest-testrun';

export function TestRunsKanbanView({
  testRuns,
  canUpdate,
  canDelete,
  canCreate = false,
  onCardClick,
  onViewDetails,
  onEdit,
  onDelete,
  onDuplicate,
  onCreate,
  onStatusChange,
}: TestRunsKanbanViewProps) {
  // ドラッグ中のテストランと、ドラッグオーバー中の列キーを保持する。
  const [draggingRun, setDraggingRun] = useState<TestRun | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

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

  const dndEnabled = canUpdate && !!onStatusChange;

  const handleDropOnColumn = (col: KanbanColumnDef) => {
    const run = draggingRun;
    setDraggingRun(null);
    setDragOverKey(null);
    if (!run || !onStatusChange) return;
    // 既に同じ列に属している場合は何もしない。
    if (col.statuses.includes(run.status)) return;
    onStatusChange(run, col.primaryStatus);
  };

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 min-w-[800px] lg:min-w-0">
        {KANBAN_COLUMNS.map((col) => {
          const items = grouped.get(col.key) ?? [];
          const isDropTarget =
            dndEnabled &&
            draggingRun !== null &&
            !col.statuses.includes(draggingRun.status);
          const isActiveDrop = isDropTarget && dragOverKey === col.key;
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
              <div
                className={`flex-1 space-y-2 rounded-lg transition-colors ${
                  isActiveDrop ? col.dropActiveClassName : ''
                } ${isDropTarget ? 'min-h-[120px]' : ''}`}
                onDragOver={
                  isDropTarget
                    ? (e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverKey !== col.key) setDragOverKey(col.key);
                      }
                    : undefined
                }
                onDragLeave={
                  isDropTarget
                    ? (e) => {
                        // 子要素間の移動では解除しない。
                        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                          setDragOverKey((prev) => (prev === col.key ? null : prev));
                        }
                      }
                    : undefined
                }
                onDrop={isDropTarget ? () => handleDropOnColumn(col) : undefined}
              >
                {items.length === 0 ? (
                  <div className="py-6 text-center text-xs text-white/30">
                    {isActiveDrop ? 'ここにドロップ' : 'なし'}
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
                      canDuplicate={canCreate}
                      draggable={dndEnabled}
                      isDragging={draggingRun?.id === testRun.id}
                      onDragStart={(e) => {
                        setDraggingRun(testRun);
                        e.dataTransfer.effectAllowed = 'move';
                        // 一部ブラウザでは dataTransfer に値を設定しないとドラッグが開始しない。
                        try {
                          e.dataTransfer.setData(DRAG_MIME, testRun.id);
                        } catch {
                          /* noop */
                        }
                      }}
                      onDragEnd={() => {
                        setDraggingRun(null);
                        setDragOverKey(null);
                      }}
                      onStatusChange={onStatusChange}
                      onCardClick={onCardClick}
                      onViewDetails={onViewDetails}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
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
  canDuplicate?: boolean;
  draggable: boolean;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onStatusChange?: (testRun: TestRun, newStatus: string) => void;
  onCardClick: (testRun: TestRun) => void;
  onViewDetails: (testRun: TestRun) => void;
  onEdit: (testRun: TestRun) => void;
  onDelete: (testRun: TestRun) => void;
  onDuplicate?: (testRun: TestRun) => void;
}

function KanbanCard({
  testRun,
  cardClassName,
  cardBorderClassName,
  canUpdate,
  canDelete,
  canDuplicate = false,
  draggable,
  isDragging,
  onDragStart,
  onDragEnd,
  onStatusChange,
  onCardClick,
  onViewDetails,
  onEdit,
  onDelete,
  onDuplicate,
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

  // 現在のカードが属する列を特定し、それ以外の列への「移動」メニューを組み立てる。
  const currentColumn = KANBAN_COLUMNS.find((c) => c.statuses.includes(testRun.status));
  const isDone = currentColumn?.key === 'done';

  const statusMenuItems: ActionMenuItem[] =
    canUpdate && onStatusChange
      ? [
          // Done 以外のカードには「完了にする」を優先的に出す。
          ...(!isDone
            ? [
                {
                  label: '完了にする',
                  icon: CheckCircle2,
                  onClick: () => onStatusChange(testRun, 'COMPLETED'),
                  buttonName: `Kanban Card - Mark Done (${testRun.name})`,
                } as ActionMenuItem,
              ]
            : []),
          // その他の列への移動メニュー。
          ...KANBAN_COLUMNS.filter(
            (c) => c.key !== currentColumn?.key && c.key !== 'done'
          ).map(
            (c): ActionMenuItem => ({
              label: `「${c.title}」に移動`,
              icon: ArrowRightLeft,
              onClick: () => onStatusChange(testRun, c.primaryStatus),
              buttonName: `Kanban Card - Move to ${c.key} (${testRun.name})`,
            })
          ),
        ]
      : [];

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      onClick={() => onCardClick(testRun)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCardClick(testRun);
        }
      }}
      className={`group rounded-lg border ${cardBorderClassName} ${cardClassName} p-3 transition-colors ${
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${isDragging ? 'opacity-50' : ''}`}
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
              ...statusMenuItems,
              {
                label: '編集',
                icon: Pencil,
                onClick: () => onEdit(testRun),
                show: canUpdate,
                buttonName: `Kanban Card - Edit (${testRun.name})`,
              },
              {
                label: '複製',
                icon: Copy,
                onClick: () => onDuplicate?.(testRun),
                show: canDuplicate && !!onDuplicate,
                buttonName: `Kanban Card - Duplicate (${testRun.name})`,
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
