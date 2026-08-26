'use client';

import { Bug, ExternalLink, Folder, PlayCircle, Ticket } from 'lucide-react';
import { GlassPanel } from '@/frontend/reusable-components/layout/GlassPanel';
import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import { PanelHeading } from './PanelHeading';
import { hasShortcut, shortcutGroupKey } from './ShortcutLink';
import type { DashboardShortcutWork } from './types';

interface ShortcutSidebarProps {
  items: DashboardShortcutWork[];
  onNavigate: (path: string) => void;
}

interface ShortcutGroup {
  key: string;
  storyId: number | null;
  storyUrl: string | null;
  epicId: number | null;
  epicName: string | null;
  works: DashboardShortcutWork[];
}

function groupShortcutWorks(items: DashboardShortcutWork[]): ShortcutGroup[] {
  const groups = new Map<string, ShortcutGroup>();

  for (const item of items) {
    if (!hasShortcut(item.shortcut)) continue;
    const key = shortcutGroupKey(item.shortcut);
    if (!key) continue;
    const existing = groups.get(key);
    if (existing) {
      existing.works.push(item);
      if (!existing.storyUrl && item.shortcut.storyUrl) existing.storyUrl = item.shortcut.storyUrl;
      if (!existing.epicName && item.shortcut.epicName) existing.epicName = item.shortcut.epicName;
      if (!existing.storyId && item.shortcut.storyId) existing.storyId = item.shortcut.storyId;
      if (!existing.epicId && item.shortcut.epicId) existing.epicId = item.shortcut.epicId;
    } else {
      groups.set(key, {
        key,
        storyId: item.shortcut.storyId,
        storyUrl: item.shortcut.storyUrl,
        epicId: item.shortcut.epicId,
        epicName: item.shortcut.epicName,
        works: [item],
      });
    }
  }

  return Array.from(groups.values());
}

function workPath(work: DashboardShortcutWork): string {
  if (work.workType === 'defect') {
    return `/projects/${work.projectId}/defects/${work.workId}`;
  }
  return `/projects/${work.projectId}/testruns/${work.workId}`;
}

export function ShortcutSidebar({ items, onNavigate }: ShortcutSidebarProps) {
  const groups = groupShortcutWorks(items);

  return (
    <GlassPanel
      heading={<PanelHeading icon={Ticket}>Shortcut</PanelHeading>}
      subheading={
        groups.length > 0
          ? `作業に紐づく ${groups.length} 件`
          : '作業に紐づく Shortcut はありません'
      }
      contentClassName="space-y-3"
    >
      {groups.length === 0 ? (
        <p className="px-1 text-xs text-white/40">
          Defect の Story / Epic、またはスイート名・ラン名から読み取った ID を表示します
        </p>
      ) : (
        <div className="max-h-[28rem] space-y-3 overflow-y-auto">
          {groups.map((group) => (
            <section key={group.key} className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2">
              <div className="min-w-0">
                {group.storyUrl ? (
                  <a
                    href={group.storyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-1 truncate text-sm text-blue-400 hover:text-blue-300"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      Story {group.storyId ? `#${group.storyId}` : ''}
                    </span>
                  </a>
                ) : group.storyId ? (
                  <p className="inline-flex items-center gap-1 text-sm text-white">
                    <Ticket className="h-3.5 w-3.5 shrink-0 text-white/50" />
                    Story #{group.storyId}
                  </p>
                ) : (
                  <p className="inline-flex min-w-0 items-center gap-1 truncate text-sm text-white">
                    <Ticket className="h-3.5 w-3.5 shrink-0 text-white/50" />
                    <span className="truncate">
                      {group.epicName
                        ? `epic-${group.epicId} ${group.epicName}`
                        : `Shortcut #${group.epicId}`}
                    </span>
                  </p>
                )}
                {group.storyId && group.epicId ? (
                  <p className="mt-0.5 truncate text-[11px] text-white/45">
                    {group.epicName ? `epic-${group.epicId} ${group.epicName}` : `epic-${group.epicId}`}
                  </p>
                ) : null}
              </div>

              <div className="mt-2 space-y-1">
                {group.works.map((work) => (
                  <button
                    key={`${work.workType}-${work.workId}`}
                    type="button"
                    onClick={() => onNavigate(workPath(work))}
                    className="w-full rounded-md border border-transparent px-1.5 py-1.5 text-left transition-colors hover:border-white/10 hover:bg-white/5"
                  >
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`px-1.5 py-0 font-mono text-[10px] ${
                          work.workType === 'defect'
                            ? 'border-red-400/40 bg-red-400/10 text-red-300'
                            : 'border-primary/40 bg-primary/10 text-primary'
                        }`}
                      >
                        {work.projectKey}
                      </Badge>
                      <span className="truncate text-[11px] text-white/45">{work.status}</span>
                    </div>
                    <p className="mt-0.5 inline-flex w-full items-center gap-1.5 truncate text-sm text-white">
                      {work.workType === 'defect' ? (
                        <Bug className="h-3.5 w-3.5 shrink-0 text-white/50" />
                      ) : (
                        <PlayCircle className="h-3.5 w-3.5 shrink-0 text-white/50" />
                      )}
                      <span className="truncate">
                        {work.workType === 'defect' ? `${work.workLabel} ${work.workTitle}` : work.workTitle}
                      </span>
                    </p>
                    <p className="inline-flex w-full items-center gap-1 truncate text-[11px] text-white/45">
                      <Folder className="h-3 w-3 shrink-0" />
                      <span className="truncate">{work.projectName}</span>
                    </p>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}
