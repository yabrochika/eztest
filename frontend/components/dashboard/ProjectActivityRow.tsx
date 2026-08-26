'use client';

import { Folder, Settings, Trash2, Users } from 'lucide-react';
import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import { ActionMenu } from '@/frontend/reusable-components/menus/ActionMenu';
import type { DashboardProject } from './types';
import { formatRelativeActivity, totalCounts } from './resultStatus';
import { WeeklyTrend } from './WeeklyTrend';
import { TestRunStatusCard } from './TestRunStatusCard';
import { ExecutorBreakdown } from './ExecutorBreakdown';

interface ProjectActivityRowProps {
  project: DashboardProject;
  onNavigate: (path: string) => void;
  onDelete: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  canManageMembers?: boolean;
  onScheduleSaved?: () => void;
}

export function ProjectActivityRow({
  project,
  onNavigate,
  onDelete,
  canUpdate = false,
  canDelete = false,
  canManageMembers = false,
  onScheduleSaved,
}: ProjectActivityRowProps) {
  const hasActions = canUpdate || canDelete || canManageMembers;
  const recentTotal = project.recentActivity.reduce((sum, day) => sum + totalCounts(day.counts), 0);

  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate(`/projects/${project.id}`)}
          className="min-w-0 text-left"
        >
          <p className="mb-1 font-mono text-[11px] tracking-wide text-primary/80">
            PROJECT · {project.key}
          </p>
          <h3 className="text-xl font-bold text-white hover:text-primary">
            {project.name}
          </h3>
          {project.tags && project.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs px-2 py-0.5 border-accent/40 bg-accent/10 text-accent"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <p className="mt-2 text-sm leading-relaxed text-white/65">
            {project.description || 'このプロジェクトの説明はまだありません。設定から追加できます。'}
          </p>
          <p className="mt-2 text-xs text-white/45">
            テストケース {project._count?.testCases ?? 0}
            {' · '}
            テストスイート {project._count?.testSuites ?? 0}
            {' · '}
            テストラン {project._count?.testRuns ?? 0}
            {' · '}
            未完了ラン {project.openTestRuns}
            {' · '}
            Defect {project._count?.defects ?? 0}
            {' · '}
            最終実行 {formatRelativeActivity(project.lastActivityAt)}
            {recentTotal > 0 ? ` · 直近14日 ${recentTotal}件` : ''}
          </p>
        </button>

        {hasActions && (
          <ActionMenu
            items={[
              {
                label: 'プロジェクトを開く',
                icon: Folder,
                onClick: () => onNavigate(`/projects/${project.id}`),
              },
              {
                label: '設定',
                icon: Settings,
                onClick: () => onNavigate(`/projects/${project.id}/settings`),
                show: canUpdate,
              },
              {
                label: 'メンバー管理',
                icon: Users,
                onClick: () => onNavigate(`/projects/${project.id}/members`),
                show: canManageMembers,
              },
              {
                label: '削除',
                icon: Trash2,
                onClick: onDelete,
                variant: 'destructive',
                show: canDelete,
                buttonName: `Dashboard Project Row - Delete (${project.name})`,
              },
            ]}
          />
        )}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white">テストラン</h4>
          <span className="text-[11px] text-white/40">結果内訳と明細</span>
        </div>
        {project.recentRuns?.length ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {project.recentRuns.map((run) => (
              <TestRunStatusCard
                key={`${run.id}-${run.scheduledStartAt}-${run.scheduledEndAt}`}
                run={run}
                onOpen={() => onNavigate(`/projects/${project.id}/testruns/${run.id}`)}
                onScheduleChange={async (runId, scheduledStartAt, scheduledEndAt) => {
                  const response = await fetch(`/api/projects/${project.id}/testruns/${runId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ scheduledStartAt, scheduledEndAt }),
                  });
                  if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data.message || data.error || '日付の保存に失敗しました');
                  }
                  onScheduleSaved?.();
                }}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-white/10 px-3 py-4 text-sm text-white/40">
            表示できるテストランはまだありません
          </p>
        )}
      </div>

      <div className="mt-5">
        <ExecutorBreakdown executors={project.executors ?? []} />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[11px] text-white/40">金曜始まりの週次推移（金〜木 / JST・直近8週）</p>
        <WeeklyTrend
          weeks={project.weeklyTrend ?? []}
          onOpenRun={(runId) => onNavigate(`/projects/${project.id}/testruns/${runId}`)}
        />
      </div>
    </article>
  );
}
