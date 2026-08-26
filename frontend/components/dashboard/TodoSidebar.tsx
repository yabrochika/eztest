'use client';

import type { ReactNode } from 'react';
import { CheckSquare, Bug, Folder, ListTodo, PlayCircle } from 'lucide-react';
import { PanelHeading } from './PanelHeading';
import { GlassPanel } from '@/frontend/reusable-components/layout/GlassPanel';
import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import { ShortcutLinkLine } from './ShortcutLink';
import type { DashboardTodoDefect, DashboardTodoTestRun } from './types';
import { defectDifficulty } from './gameStats';

interface TodoSidebarProps {
  testRuns: DashboardTodoTestRun[];
  defects: DashboardTodoDefect[];
  onNavigate: (path: string) => void;
}

export function TodoSidebar({ testRuns, defects, onNavigate }: TodoSidebarProps) {
  const total = testRuns.length + defects.length;

  return (
    <GlassPanel
      heading={<PanelHeading icon={ListTodo}>TODO</PanelHeading>}
      subheading={total > 0 ? `担当中 ${total} 件` : '担当中の作業はありません'}
      contentClassName="space-y-5"
    >
      <TodoSection
        icon={CheckSquare}
        title="担当テストラン"
        count={testRuns.length}
        emptyLabel="割り当てられたテストランはありません"
      >
        {testRuns.map((run) => (
          <div
            key={run.id}
            className="rounded-md border border-transparent px-2 py-2 transition-colors hover:border-white/10 hover:bg-white/5"
          >
            <button
              type="button"
              onClick={() => onNavigate(`/projects/${run.projectId}/testruns/${run.id}`)}
              className="w-full text-left"
            >
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 border-primary/40 bg-primary/10 text-primary">
                  {run.projectKey}
                </Badge>
                <span className="truncate text-[11px] text-white/45">{run.status}</span>
              </div>
              <p className="mt-1 inline-flex w-full items-center gap-1.5 truncate text-sm text-white">
                <PlayCircle className="h-3.5 w-3.5 shrink-0 text-white/50" />
                <span className="truncate">{run.name}</span>
              </p>
              <p className="inline-flex w-full items-center gap-1 truncate text-xs text-white/45">
                <Folder className="h-3 w-3 shrink-0" />
                <span className="truncate">{run.projectName}</span>
              </p>
            </button>
            <ShortcutLinkLine shortcut={run.shortcut} className="mt-1" stopNavigation />
          </div>
        ))}
      </TodoSection>

      <TodoSection
        icon={Bug}
        title="担当 Defect"
        count={defects.length}
        emptyLabel="割り当てられた Defect はありません"
      >
        {defects.map((defect) => {
          const difficulty = defectDifficulty(defect.priority);
          return (
          <div
            key={defect.id}
            className="rounded-md border border-transparent px-2 py-2 transition-colors hover:border-white/10 hover:bg-white/5"
          >
            <button
              type="button"
              onClick={() => onNavigate(`/projects/${defect.projectId}/defects/${defect.id}`)}
              className="w-full text-left"
            >
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 border-red-400/40 bg-red-400/10 text-red-300">
                  {defect.defectId}
                </Badge>
                <span className={`rounded-full border px-1.5 py-0 text-[10px] ${difficulty.className}`}>
                  {difficulty.label}
                </span>
                <span className="truncate text-[11px] text-white/45">{defect.status}</span>
              </div>
              <p className="mt-1 inline-flex w-full items-center gap-1.5 truncate text-sm text-white">
                <Bug className="h-3.5 w-3.5 shrink-0 text-white/50" />
                <span className="truncate">{defect.title}</span>
              </p>
              <p className="inline-flex w-full items-center gap-1 truncate text-xs text-white/45">
                <Folder className="h-3 w-3 shrink-0" />
                <span className="truncate">{defect.projectName}</span>
              </p>
            </button>
            <ShortcutLinkLine shortcut={defect.shortcut} className="mt-1" stopNavigation />
          </div>
          );
        })}
      </TodoSection>
    </GlassPanel>
  );
}

function TodoSection({
  icon: Icon,
  title,
  count,
  emptyLabel,
  children,
}: {
  icon: typeof CheckSquare;
  title: string;
  count: number;
  emptyLabel: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
          <Icon className="h-3.5 w-3.5 text-white/60" />
          {title}
        </h3>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">{count}</span>
      </div>
      {count === 0 ? (
        <p className="px-1 text-xs text-white/40">{emptyLabel}</p>
      ) : (
        <div className="max-h-64 space-y-2 overflow-y-auto">{children}</div>
      )}
    </section>
  );
}
