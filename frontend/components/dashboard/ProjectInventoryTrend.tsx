'use client';

import { Area, AreaChart } from 'recharts';
import { Sparkles } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/frontend/reusable-components/charts/Chart';
import { GlassPanel } from '@/frontend/reusable-components/layout/GlassPanel';
import { PanelHeading } from './PanelHeading';
import type { DashboardProject, WeeklyTrendPoint } from './types';
import { formatChartDate } from './resultStatus';

const TC_COLOR = '#0b72ff';
const SUITE_COLOR = '#c084fc';

const tcChartConfig: ChartConfig = {
  value: { label: 'TC数', color: TC_COLOR },
};

const suiteChartConfig: ChartConfig = {
  value: { label: 'スイート内件数', color: SUITE_COLOR },
};

interface ProjectInventoryTrendProps {
  projects: DashboardProject[];
}

function suiteItemCount(week?: Pick<WeeklyTrendPoint, 'suiteItems'> | null): number {
  return week?.suiteItems ?? 0;
}

function formatCount(value: number): string {
  return value.toLocaleString('ja-JP');
}

function eightWeekDelta(values: number[]): number {
  if (values.length === 0) return 0;
  return (values.at(-1) ?? 0) - (values[0] ?? 0);
}

function DeltaLine({ value }: { value: number }) {
  if (value > 0) {
    return <p className="text-[11px] tabular-nums text-emerald-400">▲ +{formatCount(value)}（過去8週）</p>;
  }
  if (value < 0) {
    return <p className="text-[11px] tabular-nums text-red-400">▼ {formatCount(value)}（過去8週）</p>;
  }
  return <p className="text-[11px] tabular-nums text-white/40">±0（過去8週）</p>;
}

function TrendCard({
  label,
  values,
  weeks,
  color,
  config,
}: {
  label: string;
  values: number[];
  weeks: WeeklyTrendPoint[];
  color: string;
  config: ChartConfig;
}) {
  const latest = values.at(-1) ?? 0;
  const data = weeks.map((week, index) => ({
    week: formatChartDate(week.weekStart),
    value: values[index] ?? 0,
  }));
  const gradientId = `fill-${label.replace(/\s+/g, '')}`;

  return (
    <div className="min-w-0 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] text-white/45">{label}</p>
        <p className="text-2xl font-semibold leading-none tabular-nums text-white">{formatCount(latest)}</p>
      </div>
      <ChartContainer config={config} className="mt-3 h-16 w-full min-w-0">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
      <div className="mt-2">
        <DeltaLine value={eightWeekDelta(values)} />
      </div>
    </div>
  );
}

export function ProjectInventoryTrend({ projects }: ProjectInventoryTrendProps) {
  const weeks: WeeklyTrendPoint[] = projects[0]?.weeklyTrend ?? [];
  const testCases = weeks.map((_, index) => (
    projects.reduce((sum, project) => sum + (project.weeklyTrend[index]?.testCases ?? 0), 0)
  ));
  const suiteItems = weeks.map((_, index) => (
    projects.reduce((sum, project) => sum + suiteItemCount(project.weeklyTrend[index]), 0)
  ));

  return (
    <GlassPanel
      heading={<PanelHeading icon={Sparkles}>TC・スイート内件数の推移</PanelHeading>}
      subheading="折れ線・最新値・過去8週の増減を表示します"
      contentClassName="pt-2"
    >
      {weeks.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/45">週次データがありません</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TrendCard
            label="TC数"
            values={testCases}
            weeks={weeks}
            color={TC_COLOR}
            config={tcChartConfig}
          />
          <TrendCard
            label="スイート内件数"
            values={suiteItems}
            weeks={weeks}
            color={SUITE_COLOR}
            config={suiteChartConfig}
          />
        </div>
      )}
    </GlassPanel>
  );
}
