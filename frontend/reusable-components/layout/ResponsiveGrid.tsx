'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-6',
};

const columnClassMap: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

const smColumnClassMap: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5',
  6: 'sm:grid-cols-6',
};

const mdColumnClassMap: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
};

const lgColumnClassMap: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
};

const xlColumnClassMap: Record<number, string> = {
  1: 'xl:grid-cols-1',
  2: 'xl:grid-cols-2',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
  5: 'xl:grid-cols-5',
  6: 'xl:grid-cols-6',
};

export function ResponsiveGrid({
  children,
  columns = { default: 1, md: 2, lg: 3 },
  gap = 'md',
  className,
}: ResponsiveGridProps) {
  const gridClasses = React.useMemo(() => {
    const classes: string[] = ['grid'];
    
    if (columns.default && columnClassMap[columns.default]) {
      classes.push(columnClassMap[columns.default]);
    }
    if (columns.sm && smColumnClassMap[columns.sm]) {
      classes.push(smColumnClassMap[columns.sm]);
    }
    if (columns.md && mdColumnClassMap[columns.md]) {
      classes.push(mdColumnClassMap[columns.md]);
    }
    if (columns.lg && lgColumnClassMap[columns.lg]) {
      classes.push(lgColumnClassMap[columns.lg]);
    }
    if (columns.xl && xlColumnClassMap[columns.xl]) {
      classes.push(xlColumnClassMap[columns.xl]);
    }
    
    classes.push(gapClasses[gap]);
    
    return classes;
  }, [columns, gap]);

  return (
    <div className={cn(gridClasses, className)}>
      {children}
    </div>
  );
}

