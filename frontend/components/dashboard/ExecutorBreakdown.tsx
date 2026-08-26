'use client';

import { CalendarClock, Hash, User, Users } from 'lucide-react';
import type { DashboardExecutor } from './types';
import { PIE_STATUSES } from './types';
import { PIE_STATUS_META, formatRelativeActivity, pieTotal } from './resultStatus';
import { StatusStackedBar } from './StatusStackedBar';

interface ExecutorBreakdownProps {
  executors: DashboardExecutor[];
}

export function ExecutorBreakdown({ executors }: ExecutorBreakdownProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
          <Users className="h-4 w-4 text-primary" />
          実施者別
        </h4>
        <span className="text-[11px] text-white/40">誰が何件実施したか</span>
      </div>
      {executors.length === 0 ? (
        <p className="rounded-md border border-dashed border-white/10 px-3 py-4 text-sm text-white/40">
          実施結果のある実施者はまだいません
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-white/10">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="bg-white/[0.04] text-white/50">
              <tr>
                <th className="px-2.5 py-1.5 font-medium">
                  <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />実施者</span>
                </th>
                <th className="px-2.5 py-1.5 font-medium">実施状態</th>
                <th className="px-2.5 py-1.5 font-medium">
                  <span className="inline-flex items-center gap-1"><Hash className="h-3 w-3" />件数</span>
                </th>
                <th className="px-2.5 py-1.5 font-medium">
                  <span className="inline-flex items-center gap-1"><CalendarClock className="h-3 w-3" />最終実施</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {executors.map((executor) => {
                const total = pieTotal(executor.resultCounts);
                return (
                  <tr key={executor.id} className="border-t border-white/8 text-white/80">
                    <td className="px-2.5 py-2">
                      <p className="inline-flex max-w-full items-center gap-1.5 truncate font-medium text-white">
                        <User className="h-3.5 w-3.5 shrink-0 text-white/45" />
                        <span className="truncate">{executor.name}</span>
                      </p>
                      {executor.email ? (
                        <p className="truncate text-[10px] text-white/40">{executor.email}</p>
                      ) : null}
                    </td>
                    <td className="min-w-[140px] px-2.5 py-2">
                      <StatusStackedBar counts={executor.resultCounts} height={10} />
                      <p className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-white/45">
                        {PIE_STATUSES.filter((status) => (executor.resultCounts[status] || 0) > 0).map((status) => (
                          <span key={status}>
                            {PIE_STATUS_META[status].label} {executor.resultCounts[status]}
                          </span>
                        ))}
                      </p>
                    </td>
                    <td className="px-2.5 py-2 tabular-nums">{total}</td>
                    <td className="whitespace-nowrap px-2.5 py-2 text-white/55">
                      {formatRelativeActivity(executor.lastExecutedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
