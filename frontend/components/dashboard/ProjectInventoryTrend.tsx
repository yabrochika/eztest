'use client';

import { FileText, Folder, Layers, Sparkles } from 'lucide-react';
import { GlassPanel } from '@/frontend/reusable-components/layout/GlassPanel';
import { LabelWithIcon, PanelHeading } from './PanelHeading';
import type { DashboardProject, WeeklyTrendPoint } from './types';
import { formatChartDate } from './resultStatus';

const TC_COLOR = '#38bdf8';
const SUITE_COLOR = '#c084fc';

interface ProjectInventoryTrendProps {
  projects: DashboardProject[];
  onOpenProject: (projectId: string) => void;
}

function formatWeekRange(weekStart: string, weekEnd: string): string {
  return `${formatChartDate(weekStart)}–${formatChartDate(weekEnd)}`;
}

function suiteItemCount(week?: Pick<WeeklyTrendPoint, 'suiteItems'> | null): number {
  return week?.suiteItems ?? 0;
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

function DualLineChart({
  testCases,
  suiteItems,
}: {
  testCases: number[];
  suiteItems: number[];
}) {
  const width = 320;
  const height = 56;
  const max = Math.max(1, ...testCases, ...suiteItems);
  const tcPoints = toPoints(testCases, max, width, height);
  const suitePoints = toPoints(suiteItems, max, width, height);
  const lastTc = testCases.at(-1) ?? 0;
  const lastSuite = suiteItems.at(-1) ?? 0;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-14 w-full" role="img" aria-label={`TC ${lastTc}、スイート内 ${lastSuite}`}>
      {[0.25, 0.5, 0.75].map((ratio) => (
        <line
          key={ratio}
          x1="0"
          x2={width}
          y1={height - 4 - ratio * (height - 10)}
          y2={height - 4 - ratio * (height - 10)}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}
      <polyline fill="none" stroke={SUITE_COLOR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={suitePoints} />
      <polyline fill="none" stroke={TC_COLOR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={tcPoints} />
      {testCases.map((value, index) => {
        const x = pointX(index, testCases.length, width);
        const y = height - 4 - (value / max) * (height - 10);
        return (
          <circle key={`tc-${index}`} cx={x} cy={y} r="2.5" fill={TC_COLOR}>
            <title>{`TC ${value}`}</title>
          </circle>
        );
      })}
      {suiteItems.map((value, index) => {
        const x = pointX(index, suiteItems.length, width);
        const y = height - 4 - (value / max) * (height - 10);
        return (
          <circle key={`suite-${index}`} cx={x} cy={y} r="2.5" fill={SUITE_COLOR}>
            <title>{`スイート内 ${value}`}</title>
          </circle>
        );
      })}
    </svg>
  );
}

export function ProjectInventoryTrend({ projects, onOpenProject }: ProjectInventoryTrendProps) {
  const weeks: WeeklyTrendPoint[] = projects[0]?.weeklyTrend ?? [];
  const latestTc = projects.reduce((sum, project) => sum + (project.weeklyTrend.at(-1)?.testCases ?? 0), 0);
  const latestSuiteItems = projects.reduce((sum, project) => sum + suiteItemCount(project.weeklyTrend.at(-1)), 0);

  return (
    <GlassPanel
      heading={<PanelHeading icon={Sparkles}>TC・スイート内件数の推移</PanelHeading>}
      subheading="プロジェクトごとに、テストケース数とスイートに入っている件数の週次推移を表示します"
      contentClassName="pt-2"
    >
      {weeks.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/45">週次データがありません</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[720px] space-y-4">
            <div className="flex items-end gap-2 pl-36 text-[11px] text-white/40">
              {weeks.map((week) => (
                <div key={week.weekStart} className="min-w-0 flex-1 text-center">
                  {formatWeekRange(week.weekStart, week.weekEnd)}
                </div>
              ))}
            </div>

            {projects.map((project) => {
              const series = project.weeklyTrend ?? weeks;
              const currentTc = series.at(-1)?.testCases ?? 0;
              const currentSuiteItems = suiteItemCount(series.at(-1));
              return (
                <div key={project.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenProject(project.id)}
                    className="flex w-36 shrink-0 flex-col text-left"
                    title={project.name}
                  >
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-white/40">
                      <Folder className="h-3 w-3" />
                      {project.key}
                    </span>
                    <span className="truncate text-xs text-white/80 hover:text-primary">{project.name}</span>
                    <LabelWithIcon icon={FileText} className="text-[10px] text-sky-300/80">TC {currentTc}</LabelWithIcon>
                    <LabelWithIcon icon={Layers} className="text-[10px] text-purple-300/80">スイート内 {currentSuiteItems}</LabelWithIcon>
                  </button>
                  <div className="min-w-0 flex-1 rounded-md border border-white/8 bg-white/[0.02] px-2 py-1">
                    <DualLineChart
                      testCases={series.map((week) => week.testCases)}
                      suiteItems={series.map((week) => suiteItemCount(week))}
                    />
                    <div className="mt-1 flex text-[10px] tabular-nums">
                      {series.map((week) => (
                        <div key={`${project.id}-${week.weekStart}-n`} className="min-w-0 flex-1 text-center leading-tight">
                          <p className="text-sky-300/90">{week.testCases}</p>
                          <p className="text-purple-300/80">{suiteItemCount(week)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-3 text-xs text-white/70">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: TC_COLOR }} />
          <FileText className="h-3.5 w-3.5 text-sky-300" />
          TC数 {latestTc}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: SUITE_COLOR }} />
          <Layers className="h-3.5 w-3.5 text-purple-300" />
          スイート内件数 {latestSuiteItems}
        </span>
      </div>
    </GlassPanel>
  );
}
