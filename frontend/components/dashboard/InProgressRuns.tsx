'use client';

import { PlayCircle } from 'lucide-react';
import { GlassPanel } from '@/frontend/reusable-components/layout/GlassPanel';
import type { InProgressRun, PieStatusCounts } from './types';
import { PIE_STATUS_META, pieTotal } from './resultStatus';
import { PanelHeading } from './PanelHeading';
import { hasShortcut, ShortcutLinkLine } from './ShortcutLink';
import { DUE_BADGE_CLASS, resolveDueBadge } from './dueDate';

interface InProgressRunsProps {
  runs: InProgressRun[];
  onOpenRun: (projectId: string, runId: string) => void;
}

const BAR_SEGMENTS = [
  { key: 'PASSED', color: PIE_STATUS_META.PASSED.color },
  { key: 'FAILED', color: PIE_STATUS_META.FAILED.color },
  { key: 'BLOCKED', color: PIE_STATUS_META.BLOCKED.color },
  { key: 'RETEST', color: PIE_STATUS_META.RETEST.color },
  { key: 'SKIPPED', color: PIE_STATUS_META.SKIPPED.color },
  { key: 'NOT_STARTED', color: PIE_STATUS_META.NOT_STARTED.color },
] as const;

const LEGEND = [
  { label: 'Passed', color: PIE_STATUS_META.PASSED.color },
  { label: 'Failed', color: PIE_STATUS_META.FAILED.color },
  { label: 'Blocked', color: PIE_STATUS_META.BLOCKED.color },
  { label: 'Untested', color: PIE_STATUS_META.NOT_STARTED.color },
] as const;

function segmentValue(counts: PieStatusCounts, key: (typeof BAR_SEGMENTS)[number]['key']): number {
  return counts[key] || 0;
}

function RunStackBar({ counts }: { counts: PieStatusCounts }) {
  const total = pieTotal(counts);
  if (total === 0) {
    return <div className="h-3 w-full rounded-full bg-white/8" />;
  }

  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/8">
      {BAR_SEGMENTS.map((segment) => {
        const value = segmentValue(counts, segment.key);
        if (value <= 0) return null;
        return (
          <div
            key={segment.key}
            className="h-full min-w-px"
            style={{ width: `${(value / total) * 100}%`, backgroundColor: segment.color }}
          />
        );
      })}
    </div>
  );
}

export function InProgressRuns({ runs, onOpenRun }: InProgressRunsProps) {
  return (
    <GlassPanel
      heading={<PanelHeading icon={PlayCircle}>進行中のテストラン</PanelHeading>}
      subheading="1本のバーが1ラン。残件数・進捗・期日リスクを表示します"
      contentClassName="pt-2"
    >
      {runs.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/45">現在進行中のテストランはありません</p>
      ) : (
        <div className="space-y-1">
          {runs.map((run) => {
            const total = pieTotal(run.resultCounts);
            const untested = run.resultCounts.NOT_STARTED || 0;
            const executed = Math.max(total - untested, 0);
            const progressPercent = total === 0 ? 0 : Math.round((executed / total) * 100);
            const due = resolveDueBadge(run.dueDate, run.scheduledEndAt);
            const executor = (run.executors ?? []).map((item) => item.name).join(', ') || '未割当';

            return (
              <div key={run.id}>
                <button
                  type="button"
                  onClick={() => onOpenRun(run.projectId, run.id)}
                  className="w-full rounded-lg px-1 py-2.5 text-left hover:bg-white/[0.03]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-sm font-medium text-white">{run.name}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {due.tone !== 'none' ? (
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${DUE_BADGE_CLASS[due.tone]}`}>
                          {due.label}
                        </span>
                      ) : null}
                      <span className="whitespace-nowrap text-[11px] tabular-nums text-white/55">
                        残 {untested}/{total}
                      </span>
                    </span>
                  </div>
                  <div className="mt-2">
                    <RunStackBar counts={run.resultCounts} />
                  </div>
                  <p className="mt-1.5 truncate text-[11px] text-white/40">
                    進捗 {progressPercent}% ・ {executor}
                  </p>
                </button>
                {hasShortcut(run.shortcut) ? (
                  <div className="px-1 pb-1">
                    <ShortcutLinkLine shortcut={run.shortcut} stopNavigation />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 pt-3 text-[11px] text-white/60">
        {LEGEND.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </GlassPanel>
  );
}
