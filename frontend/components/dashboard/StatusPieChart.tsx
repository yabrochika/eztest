'use client';

import { PIE_STATUSES } from './types';
import type { PieStatusCounts } from './types';
import { PIE_STATUS_META, pieTotal } from './resultStatus';

interface StatusPieChartProps {
  counts: PieStatusCounts;
  size?: number;
}

export function StatusPieChart({ counts, size = 112 }: StatusPieChartProps) {
  const total = pieTotal(counts);
  const stops: string[] = [];
  let cursor = 0;

  if (total === 0) {
    stops.push('#4b5563 0deg 360deg');
  } else {
    for (const status of PIE_STATUSES) {
      const value = counts[status] || 0;
      if (value === 0) continue;
      const start = (cursor / total) * 360;
      cursor += value;
      const end = (cursor / total) * 360;
      stops.push(`${PIE_STATUS_META[status].color} ${start}deg ${end}deg`);
    }
  }

  return (
    <div
      className="shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${stops.join(', ')})`,
        boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.08)',
      }}
      aria-label={`結果内訳 合計${total}件`}
    />
  );
}

export function StatusLegend({ counts }: { counts: PieStatusCounts }) {
  const total = pieTotal(counts);

  return (
    <ul className="space-y-1.5 text-xs">
      {PIE_STATUSES.filter((status) => (counts[status] || 0) > 0 || status === 'PASSED' || status === 'FAILED' || status === 'NOT_STARTED').map((status) => {
        const value = counts[status] || 0;
        const pct = total === 0 ? 0 : Math.round((value / total) * 100);
        return (
          <li key={status} className="flex items-center justify-between gap-3 text-white/75">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: PIE_STATUS_META[status].color }}
              />
              {PIE_STATUS_META[status].label}
            </span>
            <span className="tabular-nums text-white/55">
              {value} <span className="text-white/35">({pct}%)</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
