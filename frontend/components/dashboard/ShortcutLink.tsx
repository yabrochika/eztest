'use client';

import type { MouseEvent } from 'react';
import { ExternalLink, Ticket } from 'lucide-react';
import type { DashboardShortcutLink } from './types';

export function hasShortcut(link?: DashboardShortcutLink | null): boolean {
  if (!link) return false;
  return !!(link.storyId || link.storyUrl || link.epicId);
}

export function shortcutGroupKey(link: DashboardShortcutLink): string | null {
  if (link.storyId) return `story:${link.storyId}`;
  if (link.storyUrl) return `url:${link.storyUrl}`;
  if (link.epicId) return `epic:${link.epicId}`;
  return null;
}

export function ShortcutLinkLine({
  shortcut,
  className = '',
  stopNavigation = false,
}: {
  shortcut?: DashboardShortcutLink | null;
  className?: string;
  stopNavigation?: boolean;
}) {
  if (!hasShortcut(shortcut) || !shortcut) return null;

  const stop = (event: MouseEvent) => {
    if (stopNavigation) event.stopPropagation();
  };

  return (
    <span className={`inline-flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-0.5 ${className}`}>
      {shortcut.storyUrl ? (
        <a
          href={shortcut.storyUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={stop}
          className="inline-flex max-w-full items-center gap-1 truncate text-[11px] text-blue-400 hover:text-blue-300"
        >
          <ExternalLink className="h-3 w-3 shrink-0" />
          <span className="truncate">Story {shortcut.storyId ? `#${shortcut.storyId}` : ''}</span>
        </a>
      ) : shortcut.storyId ? (
        <span className="inline-flex items-center gap-1 text-[11px] text-white/60">
          <Ticket className="h-3 w-3 shrink-0" />
          Story #{shortcut.storyId}
        </span>
      ) : null}
      {shortcut.epicId ? (
        <span
          className="inline-flex min-w-0 items-center gap-1 truncate text-[11px] text-white/55"
          title={shortcut.epicName ?? undefined}
        >
          <Ticket className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {shortcut.epicName
              ? `epic-${shortcut.epicId} ${shortcut.epicName}`
              : `Shortcut #${shortcut.epicId}`}
          </span>
        </span>
      ) : null}
    </span>
  );
}
