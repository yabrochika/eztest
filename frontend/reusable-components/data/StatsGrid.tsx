'use client';

import * as React from 'react';
import { StatItem, StatItemProps } from '@/frontend/reusable-elements/stats/StatItem';
import { cn } from '@/lib/utils';

export interface StatsGridProps {
  stats: Array<StatItemProps>;
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const columnClasses = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-2.5',
  lg: 'gap-4',
};

export function StatsGrid({
  stats,
  columns = 3,
  gap = 'md',
  className,
}: StatsGridProps) {
  return (
    <div className={cn(
      'grid',
      columnClasses[columns],
      gapClasses[gap],
      className
    )}>
      {stats.map((stat, index) => (
        <StatItem key={index} {...stat} />
      ))}
    </div>
  );
}

