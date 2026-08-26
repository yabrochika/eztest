'use client';

import { Bug, CircleDot, Clock, FileText, Folder, Layers, PieChart, Play, Settings, Trash2, TrendingUp, Trophy, Users } from 'lucide-react';
import { LabelWithIcon } from './PanelHeading';
import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import { ActionMenu } from '@/frontend/reusable-components/menus/ActionMenu';
import type { DashboardProject } from './types';
import { formatRelativeActivity, totalCounts } from './resultStatus';
import { WeeklyTrend } from './WeeklyTrend';
import { TestRunStatusCard } from './TestRunStatusCard';
import { ExecutorBreakdown } from './ExecutorBreakdown';
import { StatBar } from './StatBar';
import { levelFromXp, xpFromCounts } from './gameStats';

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
  const xp = xpFromCounts(project.resultCounts);
  const progress = levelFromXp(xp);

  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate(`/projects/${project.id}`)}
          className="min-w-0 text-left"
        >
          <p className="mb-1 inline-flex items-center gap-1 font-mono text-[11px] tracking-wide text-primary/80">
            <Folder className="h-3.5 w-3.5" />
            PROJECT · {project.key}
          </p>
          <h3 className="text-xl font-bold text-white hover:text-primary">
            {project.name}
          </h3>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-amber-200/80">
            <Trophy className="h-3.5 w-3.5" />
            Lv.{progress.level} · {xp} XP
          </p>
          <StatBar
            className="mt-2 max-w-sm"
            label="XP"
            value={progress.current}
            max={progress.next}
            barClassName="bg-gradient-to-r from-amber-300 to-orange-400"
          />
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
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/45">
            <LabelWithIcon icon={FileText}>テストケース {project._count?.testCases ?? 0}</LabelWithIcon>
            <LabelWithIcon icon={Layers}>テストスイート {project._count?.testSuites ?? 0}</LabelWithIcon>
            <LabelWithIcon icon={Play}>テストラン {project._count?.testRuns ?? 0}</LabelWithIcon>
            <LabelWithIcon icon={CircleDot}>未完了ラン {project.openTestRuns}</LabelWithIcon>
            <LabelWithIcon icon={Bug}>Defect {project._count?.defects ?? 0}</LabelWithIcon>
            <LabelWithIcon icon={Clock}>最終実行 {formatRelativeActivity(project.lastActivityAt)}</LabelWithIcon>
            {recentTotal > 0 ? <LabelWithIcon icon={TrendingUp}>直近14日 {recentTotal}件</LabelWithIcon> : null}
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
          <h4 className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
            <PieChart className="h-4 w-4 text-primary" />
            テストラン
          </h4>
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
        <div className="mb-2">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
            <TrendingUp className="h-4 w-4 text-primary" />
            テスト資産と実施件数の推移
          </p>
          <p className="mt-0.5 text-[11px] text-white/40">
            金曜始まり（金〜木）の直近8週。TC・スイートは累計、ラン実行・実施結果はその週の件数です。
          </p>
        </div>
        <WeeklyTrend
          weeks={project.weeklyTrend ?? []}
          onOpenRun={(runId) => onNavigate(`/projects/${project.id}/testruns/${runId}`)}
        />
      </div>
    </article>
  );
}
