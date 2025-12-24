'use client';

import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatItemProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  iconColor?: string;
  valueClassName?: string;
  labelClassName?: string;
  className?: string;
}

export function StatItem({
  icon: Icon,
  value,
  label,
  iconColor = 'text-primary',
  valueClassName,
  labelClassName,
  className,
}: StatItemProps) {
  return (
    <div className={cn('text-center', className)}>
      <div className="flex items-center justify-center mb-1">
        <Icon className={cn('w-4 h-4', iconColor)} />
      </div>
      <div className={cn('text-2xl font-bold text-white', valueClassName)}>
        {value}
      </div>
      <div className={cn('text-xs text-white/60', labelClassName)}>
        {label}
      </div>
    </div>
  );
}

