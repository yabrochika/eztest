'use client';

import type { LucideIcon } from 'lucide-react';
import { CalendarDays, FileText, Layers, Play, PlayCircle } from 'lucide-react';
import type { WeeklyTrendPoint } from './types';
import { DISPLAY_STATUS_META, formatChartDate, pieTotal, weekStatusCounts } from './resultStatus';
import { StatusStackedBar } from './StatusStackedBar';

interface WeeklyTrendProps {
  weeks: WeeklyTrendPoint[];
  onOpenRun?: (runId: string) => void;
}

function formatWeekRange(weekStart: string, weekEnd: string): string {
  return `${formatChartDate(weekStart)}–${formatChartDate(weekEnd)}`;
}

function CountWithDelta({ value, added }: { value: number; added: number }) {
  return (
    <span className="tabular-nums">
      {value}
      {added > 0 && <span className="ml-1 text-[10px] text-emerald-300">新規 {added}</span>}
    </span>
  );
}

function pointX(index: number, count: number, width: number): number {
  if (count <= 1) return width / 2;
  return ((index + 0.5) / count) * width;
}

function toPoints(values: number[], max: number, width: number, height: number): string {
  if (values.length === 0) return '';
  return values
    .map((value, index) => {
      const x = pointX(index, values.length, width);
      const y = height - 4 - (value / max) * (height - 10);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function LineSpark({ values, color }: { values: number[]; color: string }) {
  const width = 120;
  const height = 28;
  const max = Math.max(1, ...values);
  const points = toPoints(values, max, width, height);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-7 w-full" aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={points} />
      {values.map((value, index) => (
        <circle
          key={index}
          cx={pointX(index, values.length, width)}
          cy={height - 4 - (value / max) * (height - 10)}
          r="2"
          fill={color}
        >
          <title>{value}</title>
        </circle>
      ))}
    </svg>
  );
}

const TREND_SERIES = [
  { key: 'testCases', label: 'TC累計', color: '#38bdf8', icon: FileText },
  { key: 'testSuites', label: 'スイート累計', color: '#c084fc', icon: Layers },
  { key: 'testRuns', label: 'ラン実行', color: '#fb923c', icon: Play },
  { key: 'testRunSuites', label: '実行スイート', color: '#34d399', icon: Layers },
  { key: 'results', label: '実施結果', color: '#f472b6', icon: PlayCircle },
] as const;

function seriesValues(weeks: WeeklyTrendPoint[], key: (typeof TREND_SERIES)[number]['key']): number[] {
  if (key === 'results') return weeks.map((week) => pieTotal(weekStatusCounts(week)));
  return weeks.map((week) => week[key]);
}

export function WeeklyTrend({ weeks, onOpenRun }: WeeklyTrendProps) {
  const chronological = weeks;
  const newestFirst = [...weeks].reverse();

  return (
    <div
      className="space-y-3"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div className="rounded-md border border-white/8 bg-white/[0.02] px-3 py-3">
        <WeeklyLineChart weeks={chronological} />
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/65">
          {TREND_SERIES.map((series) => {
            const values = seriesValues(chronological, series.key);
            const Icon = series.icon;
            return (
              <span key={series.key} className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: series.color }} />
                <Icon className="h-3 w-3" />
                {series.label} {values.at(-1) ?? 0}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {TREND_SERIES.map((series) => {
          const values = seriesValues(chronological, series.key);
          return (
            <SparkMetric
              key={series.key}
              icon={series.icon}
              label={series.label}
              current={values.at(-1) ?? 0}
              values={values}
              color={series.color}
            />
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-md border border-white/10">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-white/[0.04] text-white/50">
            <tr>
              <th className="px-2.5 py-1.5 font-medium">
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />週（金〜木）</span>
              </th>
              <th className="px-2.5 py-1.5 font-medium">
                <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />TC</span>
              </th>
              <th className="px-2.5 py-1.5 font-medium">
                <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" />スイート</span>
              </th>
              <th className="px-2.5 py-1.5 font-medium">
                <span className="inline-flex items-center gap-1"><Play className="h-3 w-3" />ラン実行</span>
              </th>
              <th className="px-2.5 py-1.5 font-medium">実施状態</th>
              <th className="px-2.5 py-1.5 font-medium">
                <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" />実行スイート</span>
              </th>
              <th className="px-2.5 py-1.5 font-medium">
                <span className="inline-flex items-center gap-1"><PlayCircle className="h-3 w-3" />内容</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {newestFirst.map((week) => (
              <tr key={week.weekStart} className="border-t border-white/8 text-white/80">
                <td className="whitespace-nowrap px-2.5 py-1.5 text-white/60">
                  {formatWeekRange(week.weekStart, week.weekEnd)}
                </td>
                <td className="px-2.5 py-1.5">
                  <CountWithDelta value={week.testCases} added={week.testCasesAdded} />
                </td>
                <td className="px-2.5 py-1.5">
                  <CountWithDelta value={week.testSuites} added={week.testSuitesAdded} />
                </td>
                <td className="px-2.5 py-1.5 tabular-nums">{week.testRuns}</td>
                <td className="min-w-[120px] px-2.5 py-1.5">
                  <StatusStackedBar counts={weekStatusCounts(week)} height={12} />
                  <p className="mt-0.5 text-[10px] tabular-nums text-white/40">
                    {pieTotal(week.resultCounts) > 0
                      ? `${pieTotal(week.resultCounts)}件`
                      : week.runs.length > 0
                        ? '未実施中心'
                        : '実施なし'}
                  </p>
                </td>
                <td className="px-2.5 py-1.5 tabular-nums">{week.testRunSuites}</td>
                <td className="px-2.5 py-1.5">
                  {week.runs.length === 0 ? (
                    <span className="text-white/35">実行なし</span>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {week.runs.map((run) => {
                        const suiteLabel =
                          run.suiteCount > 0
                            ? run.suiteNames.join('、')
                            : 'スイートなし';
                        const runStatus = DISPLAY_STATUS_META[run.status] ?? { label: run.status };
                        return (
                          <button
                            key={run.id}
                            type="button"
                            title={suiteLabel}
                            onClick={() => onOpenRun?.(run.id)}
                            className="min-w-0 text-left text-white/75 hover:text-primary"
                          >
                            <span className="flex items-center justify-between gap-2">
                              <span className="inline-flex min-w-0 items-center gap-1 truncate">
                                <PlayCircle className="h-3 w-3 shrink-0 text-white/40" />
                                <span className="truncate">{run.name}</span>
                                <span className="ml-1 text-white/40">（{run.suiteCount}）</span>
                              </span>
                              <span className="shrink-0 text-[10px] text-white/40">{runStatus.label}</span>
                            </span>
                            <StatusStackedBar counts={run.resultCounts} height={8} className="mt-0.5" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WeeklyLineChart({ weeks }: { weeks: WeeklyTrendPoint[] }) {
  const width = 640;
  const height = 160;
  const max = Math.max(1, ...TREND_SERIES.flatMap((series) => seriesValues(weeks, series.key)));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" role="img" aria-label="テスト資産と実施件数の折れ線グラフ">
      {[0.25, 0.5, 0.75].map((ratio) => (
        <line
          key={ratio}
          x1="0"
          x2={width}
          y1={height - 18 - ratio * (height - 28)}
          y2={height - 18 - ratio * (height - 28)}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}
      {TREND_SERIES.map((series) => {
        const values = seriesValues(weeks, series.key);
        const points = values
          .map((value, index) => {
            const x = pointX(index, values.length, width);
            const y = height - 18 - (value / max) * (height - 28);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(' ');
        return (
          <g key={series.key}>
            <polyline fill="none" stroke={series.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={points} />
            {values.map((value, index) => (
              <circle
                key={`${series.key}-${index}`}
                cx={pointX(index, values.length, width)}
                cy={height - 18 - (value / max) * (height - 28)}
                r="2.5"
                fill={series.color}
              >
                <title>{`${series.label} ${formatWeekRange(weeks[index].weekStart, weeks[index].weekEnd)}: ${value}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
      {weeks.map((week, index) => (
        <text
          key={week.weekStart}
          x={pointX(index, weeks.length, width)}
          y={height - 4}
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize="9"
        >
          {formatChartDate(week.weekStart)}
        </text>
      ))}
    </svg>
  );
}

function SparkMetric({
  icon: Icon,
  label,
  current,
  values,
  color,
}: {
  icon: LucideIcon;
  label: string;
  current: number;
  values: number[];
  color: string;
}) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.02] px-2 py-1.5">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] text-white/45">
          <Icon className="h-3 w-3" />
          {label}
        </span>
        <span className="text-xs font-semibold tabular-nums text-white">{current}</span>
      </div>
      <LineSpark values={values} color={color} />
    </div>
  );
}
