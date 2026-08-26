'use client';

import { RESULT_STATUSES } from './types';
import type { ActivityDay, ResultStatusCounts } from './types';
import { RESULT_STATUS_META, formatChartDate, totalCounts } from './resultStatus';
import { GlassPanel } from '@/frontend/reusable-components/layout/GlassPanel';

interface StackedActivityChartProps {
  days: ActivityDay[];
  totals: ResultStatusCounts;
  rangeDays: number;
}

export function StackedActivityChart({ days, totals, rangeDays }: StackedActivityChartProps) {
  const maxTotal = Math.max(1, ...days.map((day) => totalCounts(day.counts)));
  const grandTotal = totalCounts(totals);

  return (
    <GlassPanel
      heading="アクティビティ"
      subheading={`直近${rangeDays}日間のテスト結果`}
      contentClassName="pt-2"
    >
      {grandTotal === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] text-sm text-white/50">
          直近{rangeDays}日間のテスト実行はありません
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex h-48 items-end gap-1 sm:gap-1.5">
            {days.map((day) => {
              const dayTotal = totalCounts(day.counts);
              const heightPct = dayTotal === 0 ? 0 : Math.max(6, (dayTotal / maxTotal) * 100);
              const tooltip = [
                formatChartDate(day.date),
                ...RESULT_STATUSES
                  .filter((status) => day.counts[status] > 0)
                  .map((status) => `${RESULT_STATUS_META[status].label}: ${day.counts[status]}`),
                dayTotal === 0 ? '結果なし' : `合計: ${dayTotal}`,
              ].join('\n');

              return (
                <div key={day.date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                  <div
                    className="flex w-full flex-col-reverse overflow-hidden rounded-sm bg-white/5"
                    style={{ height: `${heightPct}%` }}
                    title={tooltip}
                  >
                    {RESULT_STATUSES.map((status) => {
                      const count = day.counts[status];
                      if (count === 0 || dayTotal === 0) return null;
                      return (
                        <div
                          key={status}
                          className={`${RESULT_STATUS_META[status].barClass} w-full`}
                          style={{ height: `${(count / dayTotal) * 100}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[11px] text-white/40">
            {days.map((day, index) => {
              const showLabel = index === 0 || index === days.length - 1 || index % 3 === 0;
              return (
                <span key={day.date} className="min-w-0 flex-1 text-center">
                  {showLabel ? formatChartDate(day.date) : ''}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-3 text-xs text-white/70">
        <span className="font-medium text-white">合計 {grandTotal} 件</span>
        {RESULT_STATUSES.map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: RESULT_STATUS_META[status].color }}
            />
            {RESULT_STATUS_META[status].label} {totals[status]}
          </span>
        ))}
      </div>
    </GlassPanel>
  );
}
