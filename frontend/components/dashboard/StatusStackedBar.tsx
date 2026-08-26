'use client';

import { PIE_STATUSES } from './types';
import type { PieStatusCounts } from './types';
import { PIE_STATUS_META, pieTotal } from './resultStatus';

interface StatusStackedBarProps {
  counts?: PieStatusCounts | null;
  height?: number;
  className?: string;
}

export function StatusStackedBar({ counts, height = 10, className = '' }: StatusStackedBarProps) {
  const total = pieTotal(counts ?? {
    PASSED: 0,
    FAILED: 0,
    BLOCKED: 0,
    RETEST: 0,
    SKIPPED: 0,
    NOT_STARTED: 0,
  });

  if (!counts || total === 0) {
    return (
      <div
        className={`rounded-sm bg-white/8 ${className}`}
        style={{ height }}
        title="実施なし"
      />
    );
  }

  const tooltip = PIE_STATUSES
    .filter((status) => (counts[status] || 0) > 0)
    .map((status) => `${PIE_STATUS_META[status].label} ${counts[status]}`)
    .concat(`合計 ${total}`)
    .join(' / ');

  return (
    <div
      className={`flex overflow-hidden rounded-sm ${className}`}
      style={{ height }}
      title={tooltip}
    >
      {PIE_STATUSES.map((status) => {
        const value = counts[status] || 0;
        if (value === 0) return null;
        return (
          <div
            key={status}
            className="min-w-px"
            style={{
              width: `${(value / total) * 100}%`,
              backgroundColor: PIE_STATUS_META[status].color,
            }}
          />
        );
      })}
    </div>
  );
}
