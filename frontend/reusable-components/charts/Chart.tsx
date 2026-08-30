'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import { cn } from '@/lib/utils';

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

export function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error('useChart must be used within ChartContainer');
  }
  return context;
}

export function ChartContainer({
  id,
  className,
  config,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          'relative flex w-full justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-white/45 [&_.recharts-cartesian-grid_line]:stroke-white/10 [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-white/8',
          className
        )}
        style={
          {
            ...Object.fromEntries(
              Object.entries(config).flatMap(([key, item]) =>
                item.color ? [[`--color-${key}`, item.color]] : []
              )
            ),
          } as React.CSSProperties
        }
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = RechartsPrimitive.Tooltip;

type TooltipItem = {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
  color?: string;
};

export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  formatter,
  hideLabel = false,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: React.ReactNode;
  className?: string;
  hideLabel?: boolean;
  formatter?: (value: number, name: string) => React.ReactNode;
}) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  return (
    <div className={cn('rounded-md border border-white/15 bg-[#0b1220] px-2.5 py-2 text-xs shadow-lg', className)}>
      {!hideLabel && label ? <p className="mb-1 font-medium text-white">{label}</p> : null}
      <div className="space-y-1">
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name ?? '');
          const itemConfig = config[key];
          const value = typeof item.value === 'number' ? item.value : Number(item.value ?? 0);
          return (
            <div key={key} className="flex items-center justify-between gap-4 text-white/75">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ backgroundColor: item.color || itemConfig?.color }}
                />
                {itemConfig?.label ?? key}
              </span>
              <span className="tabular-nums text-white">
                {formatter ? formatter(value, key) : value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
