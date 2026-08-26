'use client';

import { GlassPanel } from '@/frontend/reusable-components/layout/GlassPanel';
import type { InProgressRun } from './types';
import { DISPLAY_STATUS_META, formatChartDate, formatRelativeActivity, pieTotal } from './resultStatus';
import { StatusLegend, StatusPieChart } from './StatusPieChart';

interface InProgressProject {
  id: string;
  name: string;
  key: string;
  suiteCount?: number;
}

interface InProgressRunsProps {
  runs: InProgressRun[];
  projects?: InProgressProject[];
  onOpenRun: (projectId: string, runId: string) => void;
}

function toDateKey(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function InProgressRuns({ runs, projects = [], onOpenRun }: InProgressRunsProps) {
  const runsByProject = new Map<string, InProgressRun[]>();
  for (const run of runs) {
    const list = runsByProject.get(run.projectId) ?? [];
    list.push(run);
    runsByProject.set(run.projectId, list);
  }

  const groups = (projects.length > 0
    ? projects.map((project) => ({
        id: project.id,
        name: project.name,
        key: project.key,
        suiteCount: project.suiteCount,
        runs: runsByProject.get(project.id) ?? [],
      }))
    : Array.from(runsByProject.entries()).map(([id, projectRuns]) => ({
        id,
        name: projectRuns[0].projectName,
        key: projectRuns[0].projectKey,
        runs: projectRuns,
      }))
  );

  return (
    <GlassPanel
      heading="進行中のテストラン"
      subheading="ステータスが In Progress のテストランを、プロジェクトごとに円グラフで表示します"
      contentClassName="pt-2"
    >
      {runs.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/45">現在進行中のテストランはありません</p>
      ) : (
        <div className="space-y-5">
          {groups.map((project) => (
            <section key={project.id}>
              <div className="mb-2 flex items-baseline gap-2">
                <span className="font-mono text-[10px] text-white/40">{project.key}</span>
                <h3 className="truncate text-sm font-semibold text-white">{project.name}</h3>
                {typeof project.suiteCount === 'number' ? (
                  <span className="text-[11px] text-white/45">スイート {project.suiteCount}</span>
                ) : null}
                <span className="text-[11px] text-white/40">進行中 {project.runs.length}</span>
              </div>
              {project.runs.length === 0 ? (
                <p className="rounded-md border border-dashed border-white/10 px-3 py-2 text-xs text-white/40">
                  進行中のテストランはありません
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {project.runs.map((run) => {
                    const total = pieTotal(run.resultCounts);
                    const executed = total - (run.resultCounts.NOT_STARTED || 0);
                    const statusMeta = DISPLAY_STATUS_META[run.status] ?? {
                      label: run.status,
                      badgeClass: 'bg-sky-500 text-white border-sky-500',
                    };
                    return (
                      <button
                        key={run.id}
                        type="button"
                        onClick={() => onOpenRun(run.projectId, run.id)}
                        className="overflow-hidden rounded-lg border border-white/10 bg-[#0b1220] text-left hover:border-teal-400/40"
                      >
                        <div className="flex items-center justify-between gap-3 bg-[#0f6c73] px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{run.name}</p>
                            <p className="truncate text-[11px] text-white/75">
                              {run.startedAt ? `開始 ${formatRelativeActivity(run.startedAt)}` : '開始日時なし'}
                              {run.scheduledStartAt || run.scheduledEndAt
                                ? ` · 予定 ${run.scheduledStartAt ? formatChartDate(toDateKey(run.scheduledStartAt) || '') : '未設定'}〜${run.scheduledEndAt ? formatChartDate(toDateKey(run.scheduledEndAt) || '') : '未設定'}`
                                : ''}
                            </p>
                          </div>
                          <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusMeta.badgeClass}`}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 px-3 py-3">
                          <StatusPieChart counts={run.resultCounts} size={96} />
                          <div className="min-w-0 flex-1">
                            <StatusLegend counts={run.resultCounts} />
                            <p className="mt-2 text-[11px] tabular-nums text-white/40">
                              {total > 0 ? `実施 ${executed} / ${total}` : '結果なし'}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}
