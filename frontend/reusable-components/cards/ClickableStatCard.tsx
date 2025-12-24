'use client';

import * as React from 'react';
import { StatCard } from '@/frontend/components/project/subcomponents/StatCard';
import { cn } from '@/lib/utils';

export interface ClickableStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  borderColor?: string;
  hoverColor?: string;
  onClick: () => void;
  className?: string;
}

export function ClickableStatCard({
  icon,
  label,
  value,
  borderColor = 'border-l-primary/30',
  hoverColor = 'group-hover:bg-primary/10',
  onClick,
  className,
}: ClickableStatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn('cursor-pointer group transition-all', hoverColor, className)}
    >
      <StatCard
        icon={icon}
        label={label}
        value={value}
        borderColor={borderColor}
      />
    </div>
  );
}

