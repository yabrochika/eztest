import type { PieStatus, PieStatusCounts, ResultStatus, ResultStatusCounts, WeeklyTrendPoint } from './types';
import { PIE_STATUSES, RESULT_STATUSES } from './types';

export const RESULT_STATUS_META: Record<
  ResultStatus,
  { label: string; color: string; barClass: string }
> = {
  PASSED: { label: '成功', color: '#34d399', barClass: 'bg-emerald-400' },
  FAILED: { label: '失敗', color: '#f87171', barClass: 'bg-red-400' },
  BLOCKED: { label: 'ブロック', color: '#fb923c', barClass: 'bg-orange-400' },
  RETEST: { label: '再テスト', color: '#c084fc', barClass: 'bg-purple-400' },
  SKIPPED: { label: 'スキップ', color: '#9ca3af', barClass: 'bg-gray-400' },
};

export const PIE_STATUS_META: Record<
  PieStatus,
  { label: string; color: string; barClass: string; badgeClass: string }
> = {
  PASSED: { label: 'Passed', color: '#34d399', barClass: 'bg-emerald-400', badgeClass: 'bg-emerald-500 text-white border-emerald-500' },
  FAILED: { label: 'Failed', color: '#f87171', barClass: 'bg-red-400', badgeClass: 'bg-red-500 text-white border-red-500' },
  BLOCKED: { label: 'Blocked', color: '#fb923c', barClass: 'bg-orange-400', badgeClass: 'bg-orange-400 text-white border-orange-400' },
  RETEST: { label: 'Retest', color: '#c084fc', barClass: 'bg-purple-400', badgeClass: 'bg-purple-500 text-white border-purple-500' },
  SKIPPED: { label: 'Skipped', color: '#9ca3af', barClass: 'bg-gray-400', badgeClass: 'bg-gray-400 text-white border-gray-400' },
  NOT_STARTED: { label: 'Untested', color: '#6b7280', barClass: 'bg-gray-500', badgeClass: 'bg-gray-500 text-white border-gray-500' },
};

export const DISPLAY_STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  PASSED: { label: 'Passed', badgeClass: 'bg-emerald-500 text-white border-emerald-500' },
  FAILED: { label: 'Failed', badgeClass: 'bg-red-500 text-white border-red-500' },
  BLOCKED: { label: 'Blocked', badgeClass: 'bg-orange-400 text-white border-orange-400' },
  RETEST: { label: 'Retest', badgeClass: 'bg-purple-500 text-white border-purple-500' },
  SKIPPED: { label: 'Skipped', badgeClass: 'bg-gray-400 text-white border-gray-400' },
  NOT_STARTED: { label: 'Untested', badgeClass: 'bg-gray-500 text-white border-gray-500' },
  IN_PROGRESS: { label: 'In Progress', badgeClass: 'bg-sky-500 text-white border-sky-500' },
  COMPLETED: { label: 'Done', badgeClass: 'bg-emerald-600 text-white border-emerald-600' },
  CANCELLED: { label: 'Cancelled', badgeClass: 'bg-gray-500 text-white border-gray-500' },
  PAUSED: { label: 'Paused', badgeClass: 'bg-amber-500 text-white border-amber-500' },
};

export function pieTotal(counts?: PieStatusCounts | null): number {
  if (!counts) return 0;
  return PIE_STATUSES.reduce((sum, status) => sum + (counts[status] || 0), 0);
}

export function emptyPieCounts(): PieStatusCounts {
  return { PASSED: 0, FAILED: 0, BLOCKED: 0, RETEST: 0, SKIPPED: 0, NOT_STARTED: 0 };
}

export function weekStatusCounts(week: WeeklyTrendPoint): PieStatusCounts {
  if (pieTotal(week.resultCounts) > 0) return week.resultCounts;
  const aggregated = emptyPieCounts();
  for (const run of week.runs ?? []) {
    for (const status of PIE_STATUSES) {
      aggregated[status] += run.resultCounts?.[status] || 0;
    }
  }
  return aggregated;
}

export function totalCounts(counts: ResultStatusCounts): number {
  return RESULT_STATUSES.reduce((sum, status) => sum + counts[status], 0);
}

export function formatChartDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return dateKey;
  return `${month}/${day}`;
}

export function formatRelativeActivity(date: string | null): string {
  if (!date) return '実行履歴なし';

  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return '実行履歴なし';

  const diffMs = Date.now() - target.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'たった今';
  if (diffMinutes < 60) return `${diffMinutes}分前`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}時間前`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 14) return `${diffDays}日前`;

  return `${target.getMonth() + 1}/${target.getDate()} に実行`;
}
