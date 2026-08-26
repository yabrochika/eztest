'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function PanelHeading({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      {children}
    </span>
  );
}

export function LabelWithIcon({
  icon: Icon,
  children,
  className = '',
}: {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Icon className="h-3.5 w-3.5 shrink-0 text-white/50" />
      {children}
    </span>
  );
}
