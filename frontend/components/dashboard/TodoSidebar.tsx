'use client';

import type { ReactNode } from 'react';
import { CheckSquare, Bug, Folder } from 'lucide-react';
import { GlassPanel } from '@/frontend/reusable-components/layout/GlassPanel';
import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import type { DashboardProject, DashboardTodoDefect, DashboardTodoTestRun } from './types';

interface TodoSidebarProps {
  projects?: Array<Pick<DashboardProject, 'id' | 'name' | 'key' | 'description' | 'openTestRuns' | '_count' | 'tags'>>;
  testRuns: DashboardTodoTestRun[];
  defects: DashboardTodoDefect[];
  onNavigate: (path: string) => void;
}

export function TodoSidebar({ projects = [], testRuns, defects, onNavigate }: TodoSidebarProps) {
  const total = testRuns.length + defects.length;

  return (
    <GlassPanel
      heading="TODO"
      subheading={projects.length > 0 ? `プロジェクト ${projects.length} · 担当中 ${total} 件` : (total > 0 ? `担当中 ${total} 件` : '担当中の作業はありません')}
      className="xl:sticky xl:top-24"
      contentClassName="space-y-5"
    >
      <TodoSection
        icon={Folder}
        title="プロジェクト"
        count={projects.length}
        emptyLabel="表示できるプロジェクトはありません"
      >
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => onNavigate(`/projects/${project.id}`)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-white/[0.06]"
          >
            <p className="font-mono text-[10px] tracking-wide text-primary/80">
              PROJECT · {project.key}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-white">{project.name}</p>
            {project.description ? (
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/50">
                {project.description}
              </p>
            ) : null}
            {project.tags && project.tags.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {project.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="px-1.5 py-0 text-[10px] border-accent/40 bg-accent/10 text-accent"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
            <p className="mt-1.5 text-[11px] text-white/40">
              TC {project._count?.testCases ?? 0}
              {' · '}
              スイート {project._count?.testSuites ?? 0}
              {' · '}
              ラン {project._count?.testRuns ?? 0}
              {' · '}
              未完了 {project.openTestRuns}
            </p>
          </button>
        ))}
      </TodoSection>

      <TodoSection
        icon={CheckSquare}
        title="担当テストラン"
        count={testRuns.length}
        emptyLabel="割り当てられたテストランはありません"
      >
        {testRuns.map((run) => (
          <button
            key={run.id}
            type="button"
            onClick={() => onNavigate(`/projects/${run.projectId}/testruns/${run.id}`)}
            className="w-full rounded-md border border-transparent px-2 py-2 text-left transition-colors hover:border-white/10 hover:bg-white/5"
          >
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 border-primary/40 bg-primary/10 text-primary">
                {run.projectKey}
              </Badge>
              <span className="truncate text-[11px] text-white/45">{run.status}</span>
            </div>
            <p className="mt-1 truncate text-sm text-white">{run.name}</p>
            <p className="truncate text-xs text-white/45">{run.projectName}</p>
          </button>
        ))}
      </TodoSection>

      <TodoSection
        icon={Bug}
        title="担当 Defect"
        count={defects.length}
        emptyLabel="割り当てられた Defect はありません"
      >
        {defects.map((defect) => (
          <button
            key={defect.id}
            type="button"
            onClick={() => onNavigate(`/projects/${defect.projectId}/defects/${defect.id}`)}
            className="w-full rounded-md border border-transparent px-2 py-2 text-left transition-colors hover:border-white/10 hover:bg-white/5"
          >
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 border-red-400/40 bg-red-400/10 text-red-300">
                {defect.defectId}
              </Badge>
              <span className="truncate text-[11px] text-white/45">{defect.status}</span>
            </div>
            <p className="mt-1 truncate text-sm text-white">{defect.title}</p>
            <p className="truncate text-xs text-white/45">{defect.projectName}</p>
          </button>
        ))}
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
        <div className="max-h-80 space-y-2 overflow-y-auto">{children}</div>
      )}
    </section>
  );
}
