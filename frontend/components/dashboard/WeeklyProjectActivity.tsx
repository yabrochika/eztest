'use client';

import { GlassPanel } from '@/frontend/reusable-components/layout/GlassPanel';
import type { DashboardProject, WeeklyTrendPoint } from './types';
import { PIE_STATUSES } from './types';
import { PIE_STATUS_META, formatChartDate, pieTotal, weekStatusCounts } from './resultStatus';
import { StatusStackedBar } from './StatusStackedBar';

interface WeeklyProjectActivityProps {
  projects: DashboardProject[];
  onOpenProject: (projectId: string) => void;
}

function formatWeekRange(weekStart: string, weekEnd: string): string {
  return `${formatChartDate(weekStart)}–${formatChartDate(weekEnd)}`;
}

export function WeeklyProjectActivity({ projects, onOpenProject }: WeeklyProjectActivityProps) {
  const weeks: WeeklyTrendPoint[] = projects[0]?.weeklyTrend ?? [];
  const grandTotal = projects.reduce((sum, project) => {
    return sum + (project.weeklyTrend ?? []).reduce((weekSum, week) => weekSum + pieTotal(weekStatusCounts(week)), 0);
  }, 0);

  return (
    <GlassPanel
      heading="週次アクティビティ"
      subheading="金曜始まり（金〜木 / JST）。プロジェクトごとのテストラン実施結果です"
      contentClassName="pt-2"
    >
      {weeks.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/45">週次データがありません</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[720px] space-y-3">
            <div className="flex items-end gap-2 pl-36 text-[11px] text-white/40">
              {weeks.map((week) => (
                <div key={week.weekStart} className="min-w-0 flex-1 text-center">
                  {formatWeekRange(week.weekStart, week.weekEnd)}
                </div>
              ))}
            </div>

            {projects.map((project) => (
              <div key={project.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenProject(project.id)}
                  className="flex w-36 shrink-0 flex-col text-left"
                  title={project.name}
                >
                  <span className="font-mono text-[10px] text-white/40">{project.key}</span>
                  <span className="truncate text-xs text-white/80 hover:text-primary">{project.name}</span>
                  <span className="text-[10px] text-white/40">スイート {project._count?.testSuites ?? 0}</span>
                </button>
                <div className="flex min-w-0 flex-1 items-end gap-1.5">
                  {(project.weeklyTrend ?? weeks).map((week) => {
                    const counts = weekStatusCounts(week);
                    const total = pieTotal(counts);
                    return (
                      <div key={`${project.id}-${week.weekStart}`} className="min-w-0 flex-1">
                        <StatusStackedBar counts={counts} height={28} />
                        <p className="mt-1 text-center text-[10px] tabular-nums text-white/35">
                          {total > 0 ? total : '—'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-3 text-xs text-white/70">
        <span className="font-medium text-white">8週合計 {grandTotal} 件</span>
        {PIE_STATUSES.map((status) => {
          const value = projects.reduce((sum, project) => {
            return sum + (project.weeklyTrend ?? []).reduce((weekSum, week) => weekSum + (weekStatusCounts(week)[status] || 0), 0);
          }, 0);
          if (value === 0 && status !== 'PASSED' && status !== 'FAILED') return null;
          return (
            <span key={status} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PIE_STATUS_META[status].color }} />
              {PIE_STATUS_META[status].label} {value}
            </span>
          );
        })}
      </div>
    </GlassPanel>
  );
}
