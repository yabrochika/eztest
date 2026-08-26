'use client';

import { Calendar, Folder, Heart, Layers, PlayCircle, Sparkles, Target, Users } from 'lucide-react';
import { GlassPanel } from '@/frontend/reusable-components/layout/GlassPanel';
import type { InProgressRun } from './types';
import { DISPLAY_STATUS_META, formatChartDate, formatRelativeActivity, pieTotal } from './resultStatus';
import { StatusLegend, StatusPieChart } from './StatusPieChart';
import { LabelWithIcon, PanelHeading } from './PanelHeading';
import { hasShortcut, ShortcutLinkLine } from './ShortcutLink';
import { StatBar } from './StatBar';
import { runBattle } from './gameStats';

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
      heading={<PanelHeading icon={PlayCircle}>進行中のテストラン</PanelHeading>}
      subheading="進捗ゲージは実施済み、残HPは未実施の件数です"
      contentClassName="pt-2"
    >
      {runs.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/45">現在進行中のテストランはありません</p>
      ) : (
        <div className="space-y-5">
          {groups.map((project) => (
            <section key={project.id}>
              <div className="mb-2 flex items-center gap-2">
                <Folder className="h-3.5 w-3.5 shrink-0 text-white/45" />
                <span className="font-mono text-[10px] text-white/40">{project.key}</span>
                <h3 className="truncate text-sm font-semibold text-white">{project.name}</h3>
                {typeof project.suiteCount === 'number' ? (
                  <LabelWithIcon icon={Layers} className="text-[11px] text-white/45">スイート {project.suiteCount}</LabelWithIcon>
                ) : null}
                <LabelWithIcon icon={PlayCircle} className="text-[11px] text-white/40">進行中 {project.runs.length}</LabelWithIcon>
              </div>
              {project.runs.length === 0 ? (
                <p className="rounded-md border border-dashed border-white/10 px-3 py-2 text-xs text-white/40">
                  進行中のテストランはありません
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {project.runs.map((run) => {
                    const battle = runBattle(run.resultCounts);
                    const total = pieTotal(run.resultCounts);
                    const executed = battle.executed;
                    const statusMeta = DISPLAY_STATUS_META[run.status] ?? {
                      label: run.status,
                      badgeClass: 'bg-sky-500 text-white border-sky-500',
                    };
                    return (
                      <div
                        key={run.id}
                        className={`overflow-hidden rounded-lg border bg-[#0b1220] text-left hover:border-teal-400/40 ${
                          battle.danger
                            ? 'border-red-400/40 game-danger'
                            : battle.perfect
                              ? 'border-amber-300/40'
                              : 'border-white/10'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onOpenRun(run.projectId, run.id)}
                          className="flex w-full items-center justify-between gap-3 bg-[#0f6c73] px-3 py-2 text-left"
                        >
                          <div className="min-w-0">
                            <p className="inline-flex max-w-full items-center gap-3 truncate text-sm font-semibold text-white">
                              <PlayCircle className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{run.name}</span>
                            </p>
                            <p className="mt-2 inline-flex max-w-full items-center gap-2.5 truncate text-[11px] text-white/75">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {run.startedAt ? `開始 ${formatRelativeActivity(run.startedAt)}` : '開始日時なし'}
                                {run.scheduledStartAt || run.scheduledEndAt
                                  ? ` · 予定 ${run.scheduledStartAt ? formatChartDate(toDateKey(run.scheduledStartAt) || '') : '未設定'}〜${run.scheduledEndAt ? formatChartDate(toDateKey(run.scheduledEndAt) || '') : '未設定'}`
                                  : ''}
                              </span>
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusMeta.badgeClass}`}>
                              {statusMeta.label}
                            </span>
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${
                              battle.danger
                                ? 'border-red-400/40 bg-red-500/20 text-red-100'
                                : battle.perfect
                                  ? 'border-amber-300/40 bg-amber-400/20 text-amber-100'
                                  : 'border-white/20 bg-black/20 text-white/80'
                            }`}>
                              <Sparkles className="h-3 w-3" />
                              {battle.comboLabel}
                            </span>
                          </div>
                        </button>
                        <div className="flex items-center gap-4 px-3 py-3">
                          <button
                            type="button"
                            onClick={() => onOpenRun(run.projectId, run.id)}
                            className="flex min-w-0 flex-1 items-center gap-4 text-left"
                          >
                            <StatusPieChart counts={run.resultCounts} size={96} />
                            <div className="min-w-0 flex-1">
                              <StatusLegend counts={run.resultCounts} />
                              <StatBar
                                className="mt-2"
                                label={<span className="inline-flex items-center gap-1"><Target className="h-3 w-3" />進捗</span>}
                                value={executed}
                                max={Math.max(total, 1)}
                                barClassName="bg-gradient-to-r from-emerald-400 to-cyan-300"
                              />
                              <StatBar
                                className="mt-1.5"
                                label={<span className="inline-flex items-center gap-1"><Heart className="h-3 w-3 text-red-300" />残HP</span>}
                                value={battle.remaining}
                                max={Math.max(total, 1)}
                                barClassName="bg-gradient-to-r from-rose-500 to-orange-400"
                              />
                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                                {(run.executors ?? []).length === 0 ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-white/40">
                                    <Users className="h-3 w-3" />
                                    実行者なし
                                  </span>
                                ) : (
                                  run.executors.map((executor) => (
                                    <span key={executor.id} className="inline-flex items-center gap-1 text-[11px] text-white/70">
                                      <Users className="h-3 w-3 shrink-0 text-white/50" />
                                      <span className="truncate">{executor.name}</span>
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                          </button>
                        </div>
                        {hasShortcut(run.shortcut) ? (
                          <div className="border-t border-white/5 px-3 pb-3">
                            <ShortcutLinkLine shortcut={run.shortcut} className="mt-2" stopNavigation />
                          </div>
                        ) : null}
                      </div>
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
