'use client';

import type { ReactNode } from 'react';

interface StatBarProps {
  label: ReactNode;
  value: number;
  max: number;
  barClassName: string;
  className?: string;
}

export function StatBar({ label, value, max, barClassName, className = '' }: StatBarProps) {
  const safeMax = max <= 0 ? 1 : max;
  const pct = Math.max(0, Math.min(100, Math.round((value / safeMax) * 100)));

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-white/70">
        <span className="inline-flex min-w-0 items-center gap-1 truncate">{label}</span>
        <span className="shrink-0 tabular-nums text-white/55">
          {value} / {max}
        </span>
      </div>
      <div className="game-stat-track h-2.5 overflow-hidden rounded-full bg-black/50">
        <div className={`game-stat-fill h-full ${barClassName}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
