'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CompactStat {
  value: number | string;
  label: string;
  valueClassName?: string;
  show?: boolean;
}

export interface CompactStatsGridProps {
  stats: CompactStat[];
  columns?: number;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const gapClasses = {
  sm: 'gap-1',
  md: 'gap-2',
  lg: 'gap-3',
};

export function CompactStatsGrid({
  stats,
  columns = 4,
  gap = 'md',
  className,
}: CompactStatsGridProps) {
  const visibleStats = stats.filter(stat => stat.show !== false);

  if (visibleStats.length === 0) {
    return null;
  }

  const columnClassMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  return (
    <div
      className={cn(
        'grid',
        columnClassMap[columns] || 'grid-cols-4',
        gapClasses[gap],
        className
      )}
    >
      {visibleStats.map((stat, index) => (
        <div key={index} className="text-center">
          <div className={cn('text-2xl font-bold text-white', stat.valueClassName)}>
            {stat.value}
          </div>
          <div className="text-xs text-white/60">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

