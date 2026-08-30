'use client';

import { BarChart3 } from 'lucide-react';
import { GlassPanel } from '@/frontend/reusable-components/layout/GlassPanel';
import { PanelHeading } from './PanelHeading';
import type { ActivityDay, ResultStatusCounts, WeeklyTrendPoint } from './types';
import { RESULT_STATUSES } from './types';
import { PIE_STATUS_META, formatChartDate } from './resultStatus';

interface WeeklyProjectActivityProps {
  days: ActivityDay[];
  weeks: WeeklyTrendPoint[];
}

const WEEKDAY_ROWS = [
  { day: 5, label: '金' },
  { day: 6, label: '土' },
  { day: 0, label: '日' },
  { day: 1, label: '月' },
  { day: 2, label: '火' },
  { day: 3, label: '水' },
  { day: 4, label: '木' },
] as const;

function executedTotal(counts?: ResultStatusCounts | null): number {
  if (!counts) return 0;
  return RESULT_STATUSES.reduce((sum, status) => sum + (counts[status] || 0), 0);
}

function weekdayFromKey(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function mix(from: number, to: number, t: number): number {
  return Math.round(from + (to - from) * t);
}

function heatmapFill(executed: number, passRate: number, maxExecuted: number): string {
  if (executed <= 0 || maxExecuted <= 0) {
    return 'rgba(255,255,255,0.06)';
  }

  const intensity = Math.log1p(executed) / Math.log1p(maxExecuted);
  const failed = { r: 248, g: 113, b: 113 };
  const mid = { r: 251, g: 191, b: 36 };
  const passed = { r: 52, g: 211, b: 153 };
  const color = passRate < 0.5
    ? {
        r: mix(failed.r, mid.r, passRate * 2),
        g: mix(failed.g, mid.g, passRate * 2),
        b: mix(failed.b, mid.b, passRate * 2),
      }
    : {
        r: mix(mid.r, passed.r, (passRate - 0.5) * 2),
        g: mix(mid.g, passed.g, (passRate - 0.5) * 2),
        b: mix(mid.b, passed.b, (passRate - 0.5) * 2),
      };
  const alpha = 0.28 + intensity * 0.72;
  return `rgba(${color.r},${color.g},${color.b},${alpha.toFixed(3)})`;
}

function intensitySwatch(level: number): string {
  const alpha = 0.12 + level * 0.28;
  return `rgba(52,211,153,${alpha.toFixed(2)})`;
}

export function WeeklyProjectActivity({ days, weeks }: WeeklyProjectActivityProps) {
  const byDate = new Map(days.map((day) => [day.date, day.counts]));
  const maxExecuted = Math.max(0, ...days.map((day) => executedTotal(day.counts)));

  let peak: { weekStart: string; max: number } | null = null;
  for (const week of weeks) {
    let weekMax = 0;
    for (const day of days) {
      if (day.date < week.weekStart || day.date > week.weekEnd) continue;
      weekMax = Math.max(weekMax, executedTotal(day.counts));
    }
    if (!peak || weekMax > peak.max) {
      peak = { weekStart: week.weekStart, max: weekMax };
    }
  }

  return (
    <GlassPanel
      heading={<PanelHeading icon={BarChart3}>週次アクティビティ</PanelHeading>}
      subheading="濃淡は実施量、色はPass/Fail比です。金曜始まりの週です"
      contentClassName="pt-2"
    >
      {weeks.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/45">週次データがありません</p>
      ) : (
        <div className="min-w-0 overflow-x-hidden">
          <div
            className="grid items-center gap-1"
            style={{ gridTemplateColumns: `1.25rem repeat(${weeks.length}, minmax(0,1fr))` }}
          >
            <div />
            {weeks.map((week, index) => {
              const prev = weeks[index - 1]?.weekStart;
              const [, month, day] = week.weekStart.split('-');
              const label = !prev || prev.slice(5, 7) !== month
                ? `${Number(month)}/${Number(day)}`
                : String(Number(day));
              return (
                <div key={week.weekStart} className="min-w-0 text-center text-[10px] text-white/40">
                  <span className="block truncate">{label}</span>
                </div>
              );
            })}

            {WEEKDAY_ROWS.map((row) => (
              <div key={row.label} className="contents">
                <div className="text-center text-[10px] text-white/40">{row.label}</div>
                {weeks.map((week) => {
                  const date = days.find((item) => (
                    item.date >= week.weekStart
                    && item.date <= week.weekEnd
                    && weekdayFromKey(item.date) === row.day
                  ));
                  const counts = date ? byDate.get(date.date) : undefined;
                  const executed = executedTotal(counts);
                  const passed = counts?.PASSED || 0;
                  const passRate = executed === 0 ? 0 : passed / executed;
                  const dateLabel = date?.date ? formatChartDate(date.date) : formatChartDate(week.weekStart);

                  return (
                    <div key={`${week.weekStart}-${row.label}`} className="group relative min-w-0">
                      <div
                        className="h-7 w-full rounded-md"
                        style={{ backgroundColor: heatmapFill(executed, passRate, maxExecuted) }}
                        aria-label={`${dateLabel} ${row.label} 実施 ${executed}`}
                      />
                      <div className="pointer-events-none invisible absolute bottom-full left-1/2 z-20 mb-1 w-40 -translate-x-1/2 rounded-md border border-white/15 bg-[#0b1220] px-2.5 py-2 text-left text-[11px] text-white shadow-lg group-hover:visible">
                        <p className="mb-1 font-medium">{dateLabel}（{row.label}）</p>
                        <p className="text-white/70">実施 {executed} · Pass率 {executed === 0 ? '—' : `${Math.round(passRate * 100)}%`}</p>
                        {RESULT_STATUSES.map((status) => {
                          const value = counts?.[status] || 0;
                          if (value === 0 && status !== 'PASSED' && status !== 'FAILED') return null;
                          return (
                            <p key={status} className="mt-0.5 flex items-center justify-between gap-2 text-white/75">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: PIE_STATUS_META[status].color }} />
                                {PIE_STATUS_META[status].label}
                              </span>
                              <span className="tabular-nums text-white">{value}</span>
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[11px] text-white/60">
        <span>
          {peak && peak.max > 0
            ? `ピーク: ${formatChartDate(peak.weekStart)}週（最大 ${peak.max}件/日）`
            : 'ピーク: なし'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span>少</span>
          {[0, 1, 2, 3].map((level) => (
            <span key={level} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: intensitySwatch(level) }} />
          ))}
          <span>多</span>
        </span>
      </div>
    </GlassPanel>
  );
}
