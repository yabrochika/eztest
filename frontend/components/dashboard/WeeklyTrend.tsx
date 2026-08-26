'use client';

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

function Sparkline({
  values,
  colorClass,
}: {
  values: number[];
  colorClass: string;
}) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-6 items-end gap-px">
      {values.map((value, index) => (
        <div
          key={index}
          className={`min-w-0 flex-1 rounded-[1px] ${colorClass} ${value === 0 ? 'opacity-20' : ''}`}
          style={{ height: `${Math.max(12, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
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
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <SparkMetric
          label="TC累計"
          current={weeks.at(-1)?.testCases ?? 0}
          values={chronological.map((week) => week.testCases)}
          colorClass="bg-primary"
        />
        <SparkMetric
          label="スイート累計"
          current={weeks.at(-1)?.testSuites ?? 0}
          values={chronological.map((week) => week.testSuites)}
          colorClass="bg-purple-400"
        />
        <SparkMetric
          label="ラン実行"
          current={weeks.at(-1)?.testRuns ?? 0}
          values={chronological.map((week) => week.testRuns)}
          colorClass="bg-accent"
        />
        <SparkMetric
          label="実行スイート"
          current={weeks.at(-1)?.testRunSuites ?? 0}
          values={chronological.map((week) => week.testRunSuites)}
          colorClass="bg-emerald-400"
        />
        <SparkMetric
          label="実施結果"
          current={weeks.at(-1) ? pieTotal(weekStatusCounts(weeks.at(-1)!)) : 0}
          values={chronological.map((week) => pieTotal(weekStatusCounts(week)))}
          colorClass="bg-sky-400"
        />
      </div>

      <div className="overflow-x-auto rounded-md border border-white/10">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-white/[0.04] text-white/50">
            <tr>
              <th className="px-2.5 py-1.5 font-medium">週（金〜木）</th>
              <th className="px-2.5 py-1.5 font-medium">TC</th>
              <th className="px-2.5 py-1.5 font-medium">スイート</th>
              <th className="px-2.5 py-1.5 font-medium">ラン実行</th>
              <th className="px-2.5 py-1.5 font-medium">実施状態</th>
              <th className="px-2.5 py-1.5 font-medium">実行スイート</th>
              <th className="px-2.5 py-1.5 font-medium">内容</th>
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
                              <span className="truncate">
                                {run.name}
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

function SparkMetric({
  label,
  current,
  values,
  colorClass,
}: {
  label: string;
  current: number;
  values: number[];
  colorClass: string;
}) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.02] px-2 py-1.5">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[10px] text-white/45">{label}</span>
        <span className="text-xs font-semibold tabular-nums text-white">{current}</span>
      </div>
      <Sparkline values={values} colorClass={colorClass} />
    </div>
  );
}
