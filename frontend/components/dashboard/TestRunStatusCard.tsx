'use client';

import { useState } from 'react';
import { Calendar, CalendarRange, Clock, FileText, PlayCircle } from 'lucide-react';
import type { DashboardRecentRun } from './types';
import { DISPLAY_STATUS_META, formatRelativeActivity } from './resultStatus';
import { StatusLegend, StatusPieChart } from './StatusPieChart';
import { Input } from '@/frontend/reusable-elements/inputs/Input';

interface TestRunStatusCardProps {
  run: DashboardRecentRun;
  onOpen: () => void;
  onScheduleChange?: (runId: string, scheduledStartAt: string | null, scheduledEndAt: string | null) => Promise<void>;
}

function StatusPill({ status }: { status: string }) {
  const meta = DISPLAY_STATUS_META[status] ?? { label: status, badgeClass: 'bg-white/10 text-white/60 border-white/15' };
  return (
    <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.badgeClass}`}>
      {meta.label}
    </span>
  );
}

function toDateInput(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function TestRunStatusCard({ run, onOpen, onScheduleChange }: TestRunStatusCardProps) {
  const [startDate, setStartDate] = useState(toDateInput(run.scheduledStartAt));
  const [endDate, setEndDate] = useState(toDateInput(run.scheduledEndAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveSchedule = async (nextStart: string, nextEnd: string) => {
    if (!onScheduleChange) return;
    setSaving(true);
    setError(null);
    try {
      await onScheduleChange(run.id, nextStart || null, nextEnd || null);
    } catch (saveError) {
      setStartDate(toDateInput(run.scheduledStartAt));
      setEndDate(toDateInput(run.scheduledEndAt));
      setError(saveError instanceof Error ? saveError.message : '日付の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0b1220] text-left transition-colors hover:border-teal-400/40">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center justify-between gap-3 bg-[#0f6c73] px-3 py-2 text-left"
      >
        <div className="min-w-0">
          <h4 className="inline-flex max-w-full items-center gap-1.5 truncate text-sm font-semibold text-white">
            <PlayCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{run.name}</span>
          </h4>
          <p className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[11px] text-white/75">
            <Clock className="h-3 w-3 shrink-0" />
            {run.startedAt ? `開始 ${formatRelativeActivity(run.startedAt)}` : '未開始'}
            {run.completedAt ? ` · 完了 ${formatRelativeActivity(run.completedAt)}` : ''}
          </p>
        </div>
        <StatusPill status={run.status} />
      </button>

      <div className="px-3 py-3">
        <div className="mb-3 grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[11px] text-white/50">
              <Calendar className="h-3 w-3" />
              予定開始
            </span>
            <Input
              type="date"
              variant="glass"
              value={startDate}
              max={endDate || undefined}
              disabled={saving || !onScheduleChange}
              onChange={(event) => {
                const value = event.target.value;
                setStartDate(value);
                void saveSchedule(value, endDate);
              }}
              className="h-8 rounded-md px-2 text-xs"
            />
          </label>
          <label className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[11px] text-white/50">
              <CalendarRange className="h-3 w-3" />
              予定終了
            </span>
            <Input
              type="date"
              variant="glass"
              value={endDate}
              min={startDate || undefined}
              disabled={saving || !onScheduleChange}
              onChange={(event) => {
                const value = event.target.value;
                setEndDate(value);
                void saveSchedule(startDate, value);
              }}
              className="h-8 rounded-md px-2 text-xs"
            />
          </label>
        </div>

        {error ? <p className="mb-2 text-[11px] text-red-300">{error}</p> : null}

        <div className="flex items-center gap-4">
          <StatusPieChart counts={run.resultCounts} size={104} />
          <StatusLegend counts={run.resultCounts} />
        </div>

        <div className="mt-3 divide-y divide-white/8 border-t border-white/10">
          {run.items.length === 0 ? (
            <p className="pt-2 text-xs text-white/40">結果の明細はまだありません</p>
          ) : (
            run.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 py-1.5">
                <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs text-white/80">
                  <FileText className="h-3 w-3 shrink-0 text-white/40" />
                  {item.tcId ? <span className="font-mono text-white/40">{item.tcId}</span> : null}
                  <span className="truncate">{item.title}</span>
                </span>
                <StatusPill status={item.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
