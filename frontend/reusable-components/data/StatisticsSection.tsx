'use client';

export interface Statistic {
  label: string;
  value: string | number;
}

export interface StatisticsSectionProps {
  label?: string;
  statistics: Statistic[];
  className?: string;
}

/**
 * Reusable component for displaying statistics in key-value pairs
 * 
 * @example
 * ```tsx
 * <StatisticsSection
 *   label="Statistics"
 *   statistics={[
 *     { label: 'Test Runs', value: 10 },
 *     { label: 'Comments', value: 5 },
 *     { label: 'Attachments', value: 3 },
 *   ]}
 * />
 * ```
 */
export function StatisticsSection({
  label = 'Statistics',
  statistics,
  className = '',
}: StatisticsSectionProps) {
  if (statistics.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h4 className="text-sm font-medium text-white/60 mb-1">{label}</h4>
      <div className="space-y-1 text-sm">
        {statistics.map((stat, index) => (
          <div key={index} className="flex justify-between text-white/90">
            <span>{stat.label}</span>
            <span>{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

