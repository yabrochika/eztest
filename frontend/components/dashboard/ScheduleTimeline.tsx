'use client';

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Calendar, CalendarRange, Folder, GanttChart, Layers, PlayCircle } from 'lucide-react';
import { GlassPanel } from '@/frontend/reusable-components/layout/GlassPanel';
import { Input } from '@/frontend/reusable-elements/inputs/Input';
import type { TimelineRun } from './types';
import { LabelWithIcon, PanelHeading } from './PanelHeading';

interface TimelineProject {
  id: string;
  name: string;
  key: string;
  suiteCount?: number;
}

interface ScheduleTimelineProps {
  items: TimelineRun[];
  projects?: TimelineProject[];
  weekStart?: string;
  weekEnd?: string;
  canUpdate?: boolean;
  onOpenRun: (projectId: string, runId: string) => void;
  onScheduleChange?: (projectId: string, runId: string, scheduledStartAt: string, scheduledEndAt: string) => Promise<void>;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toDateTimeLocal(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDateTimeLocal(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfFridayWeek(now = new Date()): Date {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  const daysSinceFriday = (date.getDay() - 5 + 7) % 7;
  date.setDate(date.getDate() - daysSinceFriday);
  return date;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 0, 0);
  return next;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 0, 0);
}

function centeredRange(now = new Date()): { start: string; end: string } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = addDays(today, -28);
  const end = endOfDay(addDays(today, 28));
  return { start: toDateTimeLocal(start), end: toDateTimeLocal(end) };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

interface HeaderTick {
  key: string;
  label: string;
  widthPct: number;
}

function buildHeaders(rangeStart: Date, rangeEnd: Date): HeaderTick[] {
  const span = Math.max(1, rangeEnd.getTime() - rangeStart.getTime());
  const days = span / (24 * 60 * 60 * 1000);
  const ticks: HeaderTick[] = [];

  const pushTick = (cursor: Date, next: Date, label: string) => {
    const start = Math.max(cursor.getTime(), rangeStart.getTime());
    const end = Math.min(next.getTime(), rangeEnd.getTime());
    if (end <= start) return;
    ticks.push({
      key: `${cursor.getTime()}`,
      label,
      widthPct: ((end - start) / span) * 100,
    });
  };

  if (days <= 3) {
    const cursor = new Date(rangeStart);
    cursor.setMinutes(0, 0, 0);
    while (cursor < rangeEnd) {
      const next = new Date(cursor);
      next.setHours(next.getHours() + 4);
      pushTick(cursor, next, `${cursor.getMonth() + 1}/${cursor.getDate()} ${cursor.getHours()}時`);
      cursor.setTime(next.getTime());
    }
    return ticks;
  }

  if (days <= 21) {
    const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
    while (cursor < rangeEnd) {
      const next = addDays(cursor, 1);
      pushTick(cursor, next, `${cursor.getMonth() + 1}/${cursor.getDate()}`);
      cursor.setTime(next.getTime());
    }
    return ticks;
  }

  if (days <= 120) {
    const cursor = new Date(rangeStart);
    cursor.setHours(0, 0, 0, 0);
    while (cursor < rangeEnd) {
      const next = addDays(cursor, 7);
      pushTick(cursor, next, `${cursor.getMonth() + 1}/${cursor.getDate()}`);
      cursor.setTime(next.getTime());
    }
    return ticks;
  }

  const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  while (cursor < rangeEnd) {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    pushTick(cursor, next, `${cursor.getFullYear()}/${cursor.getMonth() + 1}`);
    cursor.setTime(next.getTime());
  }
  return ticks;
}

const PROJECT_COLORS = ['#0b72ff', '#ff7a18', '#34d399', '#c084fc', '#f87171', '#22d3ee'];

const PRESETS = [
  { id: 'today', label: '今日' },
  { id: 'week', label: '今週' },
  { id: '4w', label: '直近4週' },
  { id: '8w', label: '直近8週' },
  { id: 'month', label: '今月' },
] as const;

interface PositionedRun {
  run: TimelineRun;
  start: number;
  end: number;
  lane: number;
}

function packRuns(runs: TimelineRun[], rangeStart: number, span: number): PositionedRun[] {
  const sorted = runs
    .map((run) => {
      const start = clamp(((new Date(run.startAt).getTime() - rangeStart) / span) * 100, 0, 100);
      const end = clamp(((new Date(run.endAt).getTime() - rangeStart) / span) * 100, 0, 100);
      return { run, start, end, lane: 0 };
    })
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const laneEnds: number[] = [];
  for (const item of sorted) {
    let lane = laneEnds.findIndex((end) => end <= item.start + 0.4);
    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(item.end);
    } else {
      laneEnds[lane] = item.end;
    }
    item.lane = lane;
  }
  return sorted;
}

function overlapsRange(run: TimelineRun, rangeStart: Date, rangeEnd: Date): boolean {
  const start = new Date(run.startAt).getTime();
  const end = new Date(run.endAt).getTime();
  return end >= rangeStart.getTime() && start <= rangeEnd.getTime();
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function applyDelta(origin: Date, deltaMs: number, rangeStart: Date, rangeEnd: Date): Date {
  const next = startOfLocalDay(new Date(origin.getTime() + deltaMs));
  const min = startOfLocalDay(rangeStart);
  const max = startOfLocalDay(rangeEnd);
  if (next < min) return min;
  if (next > max) return max;
  return next;
}

type DragMode = 'move' | 'start' | 'end';

interface DragState {
  run: TimelineRun;
  mode: DragMode;
  originX: number;
  trackWidth: number;
  originStart: Date;
  originEnd: Date;
  previewStart: Date;
  previewEnd: Date;
}

export function ScheduleTimeline({
  items,
  projects = [],
  canUpdate = false,
  onOpenRun,
  onScheduleChange,
}: ScheduleTimelineProps) {
  const [range, setRange] = useState(() => centeredRange());
  const [overrides, setOverrides] = useState<Record<string, { startAt: string; endAt: string }>>({});
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const movedRef = useRef(false);

  const rangeStart = fromDateTimeLocal(range.start);
  const rangeEnd = fromDateTimeLocal(range.end);
  const validRange = Boolean(rangeStart && rangeEnd && rangeStart.getTime() < rangeEnd.getTime());
  const span = validRange ? Math.max(1, rangeEnd!.getTime() - rangeStart!.getTime()) : 1;
  const headers = validRange ? buildHeaders(rangeStart!, rangeEnd!) : [];
  const now = Date.now();
  const todayLeft = validRange ? clamp(((now - rangeStart!.getTime()) / span) * 100, 0, 100) : null;
  const showToday = validRange && now >= rangeStart!.getTime() && now <= rangeEnd!.getTime();

  const displayItems = useMemo(
    () => items.map((item) => (overrides[item.id] ? { ...item, ...overrides[item.id] } : item)),
    [items, overrides]
  );

  const visibleItems = useMemo(() => {
    if (!validRange) return [];
    return displayItems.filter((item) => overlapsRange(item, rangeStart!, rangeEnd!));
  }, [displayItems, rangeStart, rangeEnd, validRange]);

  const previewTimes = (item: TimelineRun) => {
    if (drag?.run.id === item.id) {
      return { start: drag.previewStart.getTime(), end: drag.previewEnd.getTime() };
    }
    return { start: new Date(item.startAt).getTime(), end: new Date(item.endAt).getTime() };
  };

  const updatePreview = (current: DragState, clientX: number): DragState => {
    const deltaMs = ((clientX - current.originX) / Math.max(1, current.trackWidth)) * span;
    const duration = Math.max(0, startOfLocalDay(current.originEnd).getTime() - startOfLocalDay(current.originStart).getTime());
    if (current.mode === 'move') {
      const previewStart = applyDelta(current.originStart, deltaMs, rangeStart!, rangeEnd!);
      let previewEnd = new Date(previewStart.getTime() + duration);
      const maxEnd = startOfLocalDay(rangeEnd!);
      if (previewEnd > maxEnd) {
        previewEnd = maxEnd;
        return {
          ...current,
          previewStart: new Date(previewEnd.getTime() - duration),
          previewEnd,
        };
      }
      return { ...current, previewStart, previewEnd };
    }
    if (current.mode === 'start') {
      const previewStart = applyDelta(current.originStart, deltaMs, rangeStart!, current.originEnd);
      return { ...current, previewStart, previewEnd: startOfLocalDay(current.originEnd) };
    }
    const previewEnd = applyDelta(current.originEnd, deltaMs, current.originStart, rangeEnd!);
    return { ...current, previewStart: startOfLocalDay(current.originStart), previewEnd };
  };

  const beginDrag = (
    event: ReactPointerEvent<HTMLElement>,
    run: TimelineRun,
    mode: DragMode,
    track: HTMLElement | null
  ) => {
    if (!canUpdate || !onScheduleChange || !validRange || !track) return;
    event.preventDefault();
    event.stopPropagation();
    movedRef.current = false;
    const times = previewTimes(run);
    const next: DragState = {
      run,
      mode,
      originX: event.clientX,
      trackWidth: track.getBoundingClientRect().width,
      originStart: new Date(times.start),
      originEnd: new Date(times.end),
      previewStart: startOfLocalDay(new Date(times.start)),
      previewEnd: startOfLocalDay(new Date(times.end)),
    };
    setError(null);
    dragRef.current = next;
    setDrag(next);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDragMove = (event: ReactPointerEvent<HTMLElement>) => {
    const current = dragRef.current;
    if (!current) return;
    if (Math.abs(event.clientX - current.originX) > 4) movedRef.current = true;
    const next = updatePreview(current, event.clientX);
    dragRef.current = next;
    setDrag(next);
  };

  const finishDrag = async () => {
    const current = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (!current || !onScheduleChange) return;
    const startKey = toDateKey(current.previewStart);
    const endKey = toDateKey(current.previewEnd);
    const same =
      toDateKey(startOfLocalDay(current.originStart)) === startKey &&
      toDateKey(startOfLocalDay(current.originEnd)) === endKey;
    if (same || !movedRef.current) return;

    const startAt = current.previewStart.toISOString();
    const endAt = new Date(
      current.previewEnd.getFullYear(),
      current.previewEnd.getMonth(),
      current.previewEnd.getDate(),
      23,
      59,
      0,
      0
    ).toISOString();
    setOverrides((existing) => ({ ...existing, [current.run.id]: { startAt, endAt } }));
    setSavingId(current.run.id);
    setError(null);
    try {
      await onScheduleChange(current.run.projectId, current.run.id, startKey, endKey);
    } catch (saveError) {
      setOverrides((existing) => {
        const next = { ...existing };
        delete next[current.run.id];
        return next;
      });
      setError(saveError instanceof Error ? saveError.message : '日付の保存に失敗しました');
    } finally {
      setSavingId(null);
    }
  };

  const runsByProject = new Map<string, TimelineRun[]>();
  for (const item of visibleItems) {
    const list = runsByProject.get(item.projectId) ?? [];
    list.push(item);
    runsByProject.set(item.projectId, list);
  }

  const swimlanes = projects.length > 0
    ? projects.map((project) => ({
        id: project.id,
        name: project.name,
        key: project.key,
        suiteCount: project.suiteCount,
        runs: runsByProject.get(project.id) ?? [],
      }))
    : Array.from(runsByProject.entries()).map(([id, runs]) => ({
        id,
        name: runs[0].projectName,
        key: runs[0].projectKey,
        suiteCount: undefined as number | undefined,
        runs,
      }));

  const applyPreset = (id: (typeof PRESETS)[number]['id']) => {
    const nowDate = new Date();
    if (id === 'today') {
      setRange({ start: toDateTimeLocal(new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate())), end: toDateTimeLocal(endOfDay(nowDate)) });
      return;
    }
    if (id === 'week') {
      const start = startOfFridayWeek(nowDate);
      setRange({ start: toDateTimeLocal(start), end: toDateTimeLocal(endOfDay(addDays(start, 6))) });
      return;
    }
    if (id === '4w') {
      const end = endOfDay(addDays(startOfFridayWeek(nowDate), 6));
      setRange({ start: toDateTimeLocal(addDays(startOfFridayWeek(nowDate), -21)), end: toDateTimeLocal(end) });
      return;
    }
    if (id === '8w') {
      const end = endOfDay(addDays(startOfFridayWeek(nowDate), 6));
      setRange({ start: toDateTimeLocal(addDays(startOfFridayWeek(nowDate), -49)), end: toDateTimeLocal(end) });
      return;
    }
    setRange({ start: toDateTimeLocal(startOfMonth(nowDate)), end: toDateTimeLocal(endOfMonth(nowDate)) });
  };

  return (
    <GlassPanel
      heading={<PanelHeading icon={GanttChart}>タイムライン</PanelHeading>}
      subheading="バーをドラッグすると予定日を変更して登録します。端をつまむと開始日・終了日だけ変えられます"
      contentClassName="pt-2"
    >
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="min-w-[200px] flex-1 space-y-1">
          <span className="inline-flex items-center gap-1 text-[11px] text-white/50">
            <Calendar className="h-3 w-3" />
            開始
          </span>
          <Input
            type="datetime-local"
            variant="glass"
            value={range.start}
            max={range.end || undefined}
            onChange={(event) => setRange((current) => ({ ...current, start: event.target.value }))}
            className="h-9 rounded-md px-3"
          />
        </label>
        <label className="min-w-[200px] flex-1 space-y-1">
          <span className="inline-flex items-center gap-1 text-[11px] text-white/50">
            <CalendarRange className="h-3 w-3" />
            終了
          </span>
          <Input
            type="datetime-local"
            variant="glass"
            value={range.end}
            min={range.start || undefined}
            onChange={(event) => setRange((current) => ({ ...current, end: event.target.value }))}
            className="h-9 rounded-md px-3"
          />
        </label>
        <div className="flex flex-wrap gap-1.5 pb-0.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/70 hover:border-primary/50 hover:text-white"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="mb-3 text-xs text-red-300">{error}</p> : null}

      {!validRange ? (
        <p className="py-6 text-center text-sm text-white/45">開始日時は終了日時より前にしてください</p>
      ) : items.length === 0 && projects.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/45">表示できるテストランはありません</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="relative mb-2 ml-36 flex text-[11px] text-white/40">
              {headers.map((tick) => (
                <div key={tick.key} className="shrink-0 truncate pr-1" style={{ width: `${tick.widthPct}%` }}>
                  {tick.label}
                </div>
              ))}
            </div>

            <div className="relative space-y-2">
              {showToday && todayLeft !== null && (
                <div
                  className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-red-400/70"
                  style={{ left: `calc(9rem + (100% - 9rem) * ${todayLeft / 100})` }}
                  title="今"
                />
              )}

              {visibleItems.length === 0 && (
                <p className="mb-2 text-center text-xs text-white/40">指定した期間に重なるテストランはありません</p>
              )}

              {swimlanes.map((project, index) => {
                const color = PROJECT_COLORS[index % PROJECT_COLORS.length];
                const packed = packRuns(project.runs, rangeStart!.getTime(), span);
                const laneCount = Math.max(1, packed.reduce((max, item) => Math.max(max, item.lane + 1), 0));
                const rowHeight = 28 * laneCount + 8;
                return (
                  <div key={project.id} className="flex items-stretch gap-2">
                    <div className="flex w-36 shrink-0 flex-col justify-center" title={project.name}>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-white/40">
                        <Folder className="h-3 w-3" />
                        {project.key}
                      </span>
                      <span className="truncate text-xs text-white/80">{project.name}</span>
                      {typeof project.suiteCount === 'number' ? (
                        <LabelWithIcon icon={Layers} className="text-[10px] text-white/40">スイート {project.suiteCount}</LabelWithIcon>
                      ) : null}
                    </div>
                    <div className="relative flex-1 rounded bg-white/[0.03]" style={{ height: rowHeight }}>
                      {packed.map((item) => {
                        const times = previewTimes(item.run);
                        const left = clamp(((times.start - rangeStart!.getTime()) / span) * 100, 0, 100);
                        const right = clamp(((times.end - rangeStart!.getTime()) / span) * 100, 0, 100);
                        const width = Math.max(2.5, right - left);
                        const dragging = drag?.run.id === item.run.id;
                        const saving = savingId === item.run.id;
                        return (
                          <div
                            key={item.run.id}
                            title={`${item.run.name}（${toDateKey(new Date(times.start))}〜${toDateKey(new Date(times.end))}）`}
                            className={`absolute truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white shadow-sm ${canUpdate ? 'cursor-grab' : 'cursor-pointer'} ${dragging ? 'z-20 cursor-grabbing ring-2 ring-white/50' : ''} ${saving ? 'opacity-70' : ''}`}
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                              top: 4 + item.lane * 28,
                              height: 22,
                              backgroundColor: color,
                            }}
                            onPointerDown={(event) => {
                              const track = event.currentTarget.parentElement;
                              beginDrag(event, item.run, 'move', track);
                            }}
                            onPointerMove={onDragMove}
                            onPointerUp={() => void finishDrag()}
                            onPointerCancel={() => setDrag(null)}
                            onClick={() => {
                              if (movedRef.current) return;
                              onOpenRun(item.run.projectId, item.run.id);
                            }}
                          >
                            {canUpdate ? (
                              <>
                                <span
                                  className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize rounded-l"
                                  onPointerDown={(event) => {
                                    const track = event.currentTarget.parentElement?.parentElement ?? null;
                                    beginDrag(event, item.run, 'start', track);
                                  }}
                                  onPointerMove={onDragMove}
                                  onPointerUp={() => void finishDrag()}
                                />
                                <span
                                  className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize rounded-r"
                                  onPointerDown={(event) => {
                                    const track = event.currentTarget.parentElement?.parentElement ?? null;
                                    beginDrag(event, item.run, 'end', track);
                                  }}
                                  onPointerMove={onDragMove}
                                  onPointerUp={() => void finishDrag()}
                                />
                              </>
                            ) : null}
                            <span className="inline-flex max-w-full items-center gap-1 pl-1">
                              <PlayCircle className="h-3 w-3 shrink-0" />
                              <span className="truncate">{item.run.name}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
