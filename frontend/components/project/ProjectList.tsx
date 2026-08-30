'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/frontend/reusable-components/layout/Navbar';
import { FloatingAlert, type FloatingAlertMessage } from '@/frontend/reusable-components/alerts/FloatingAlert';
import { Loader } from '@/frontend/reusable-elements/loaders/Loader';
import { CreateProjectDialog } from './subcomponents/CreateProjectDialog';
import { DeleteProjectDialog } from './subcomponents/DeleteProjectDialog';
import { EmptyProjectsState } from './subcomponents/EmptyProjectsState';
import { WeeklyProjectActivity } from '@/frontend/components/dashboard/WeeklyProjectActivity';
import { ProjectInventoryTrend } from '@/frontend/components/dashboard/ProjectInventoryTrend';
import { InProgressRuns } from '@/frontend/components/dashboard/InProgressRuns';
import { ScheduleTimeline } from '@/frontend/components/dashboard/ScheduleTimeline';
import { ProjectActivityRow } from '@/frontend/components/dashboard/ProjectActivityRow';
import { ProjectSidebar } from '@/frontend/components/dashboard/ProjectSidebar';
import { TodoSidebar } from '@/frontend/components/dashboard/TodoSidebar';
import { ShortcutSidebar } from '@/frontend/components/dashboard/ShortcutSidebar';
import { GameHud } from '@/frontend/components/dashboard/GameHud';
import type { DashboardData } from '@/frontend/components/dashboard/types';
import { usePermissions } from '@/hooks/usePermissions';
import { LayoutDashboard, FolderKanban } from 'lucide-react';

const EMPTY_DASHBOARD: DashboardData = {
  rangeDays: 14,
  weekCount: 8,
  weekRange: { start: '', end: '' },
  timeline: [],
  inProgressRuns: [],
  activity: {
    days: [],
    heatmapDays: [],
    totals: { PASSED: 0, FAILED: 0, BLOCKED: 0, RETEST: 0, SKIPPED: 0 },
  },
  projects: [],
  todos: { testRuns: [], defects: [] },
  shortcuts: [],
};

export default function ProjectList() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission: hasPermissionCheck, isLoading: permissionsLoading } = usePermissions();
  const [dashboard, setDashboard] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [triggerCreateDialog, setTriggerCreateDialog] = useState(false);
  const [alert, setAlert] = useState<FloatingAlertMessage | null>(null);

  const canCreateProject = hasPermissionCheck('projects:create');
  const projects = dashboard.projects;

  const navbarActions = useMemo(() => {
    const actions = [];

    if (canCreateProject) {
      actions.push({
        type: 'action' as const,
        label: '+ 新規プロジェクト',
        onClick: () => setTriggerCreateDialog(true),
        variant: 'primary' as const,
        buttonName: 'Dashboard - New Project',
      });
    }

    actions.push({
      type: 'signout' as const,
      showConfirmation: true,
    });

    return actions;
  }, [canCreateProject]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboard();
    }
  }, [status]);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setAlert({
          type: 'error',
          title: 'ダッシュボードの読み込みに失敗しました',
          message: errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        });
        setDashboard(EMPTY_DASHBOARD);
      } else {
        const data = await response.json();
        setDashboard(data.data || EMPTY_DASHBOARD);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setAlert({
        type: 'error',
        title: '接続エラー',
        message: errorMessage,
      });
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (newProject: { name: string }) => {
    setAlert({
      type: 'success',
      title: '成功',
      message: `プロジェクト「${newProject.name}」を作成しました`,
    });
    setTimeout(() => setAlert(null), 5000);
    fetchDashboard();
  };

  const handleProjectDeleted = (projectId: string) => {
    const deletedProject = projects.find((project) => project.id === projectId);
    setProjectToDelete(null);
    if (deletedProject) {
      setAlert({
        type: 'success',
        title: '成功',
        message: `プロジェクト「${deletedProject.name}」を削除しました`,
      });
      setTimeout(() => setAlert(null), 5000);
    }
    fetchDashboard();
  };

  const openDeleteDialog = (project: { id: string; name: string }) => {
    setProjectToDelete({ id: project.id, name: project.name });
    setDeleteDialogOpen(true);
  };

  const handleCreateProject = () => {
    setTriggerCreateDialog(true);
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setTriggerCreateDialog(false);
    }
  };

  if (status === 'loading' || loading || permissionsLoading) {
    return <Loader fullScreen text="ダッシュボードを読み込み中..." />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <>
      <FloatingAlert alert={alert} onClose={() => setAlert(null)} />

      <Navbar
        brandLabel={null}
        items={[]}
        breadcrumbs={null}
        actions={navbarActions}
      />

      <div className="mx-auto max-w-7xl px-8 py-6 pt-12">
        <div className="mb-6">
          <h1 className="mb-1 inline-flex items-center gap-2 whitespace-nowrap text-3xl font-bold text-white">
            <LayoutDashboard className="h-8 w-8 shrink-0 text-primary" />
            ダッシュボード
          </h1>
          <p className="text-sm text-white/45">実施結果が XP・レベル・実績になります</p>
        </div>

        <CreateProjectDialog
          triggerOpen={triggerCreateDialog}
          onProjectCreated={handleProjectCreated}
          onOpenChange={handleDialogOpenChange}
        />

        {projects.length === 0 ? (
          <EmptyProjectsState onCreateProject={handleCreateProject} canCreateProject={canCreateProject} />
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-6">
              <GameHud dashboard={dashboard} />
              <InProgressRuns
                runs={dashboard.inProgressRuns || []}
                onOpenRun={(projectId, runId) => router.push(`/projects/${projectId}/testruns/${runId}`)}
              />

              <ScheduleTimeline
                items={dashboard.timeline || []}
                projects={projects.map((project) => ({
                  id: project.id,
                  name: project.name,
                  key: project.key,
                  suiteCount: project._count?.testSuites ?? 0,
                }))}
                weekStart={dashboard.weekRange?.start || ''}
                weekEnd={dashboard.weekRange?.end || ''}
                canUpdate={hasPermissionCheck('testruns:update')}
                onOpenRun={(projectId, runId) => router.push(`/projects/${projectId}/testruns/${runId}`)}
                onScheduleChange={async (projectId, runId, scheduledStartAt, scheduledEndAt) => {
                  const response = await fetch(`/api/projects/${projectId}/testruns/${runId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ scheduledStartAt, scheduledEndAt }),
                  });
                  if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data.message || data.error || '日付の保存に失敗しました');
                  }
                  await fetchDashboard();
                }}
              />

              <WeeklyProjectActivity
                days={dashboard.activity.heatmapDays || []}
                weeks={projects[0]?.weeklyTrend ?? []}
              />

              <ProjectInventoryTrend projects={projects} />

              <section>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-white">
                    <FolderKanban className="h-5 w-5 text-primary" />
                    プロジェクト概要
                  </h2>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/50">
                    {projects.length}
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <p className="mb-3 text-xs text-white/40">
                  各プロジェクトの説明と、テストランの結果・週ごとの推移を一覧します。
                </p>
                <div className="space-y-3">
                  {projects.map((project) => (
                    <ProjectActivityRow
                      key={project.id}
                      project={project}
                      onNavigate={(path) => router.push(path)}
                      onDelete={() => openDeleteDialog(project)}
                      canUpdate={hasPermissionCheck('projects:update')}
                      canDelete={hasPermissionCheck('projects:delete')}
                      canManageMembers={hasPermissionCheck('projects:manage_members')}
                      onScheduleSaved={fetchDashboard}
                    />
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6 xl:sticky xl:top-24">
              <ProjectSidebar
                projects={projects}
                onNavigate={(path) => router.push(path)}
              />
              <TodoSidebar
                testRuns={dashboard.todos.testRuns}
                defects={dashboard.todos.defects}
                onNavigate={(path) => router.push(path)}
              />
              <ShortcutSidebar
                items={dashboard.shortcuts || []}
                onNavigate={(path) => router.push(path)}
              />
            </div>
          </div>
        )}
      </div>

      <DeleteProjectDialog
        project={projectToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onProjectDeleted={handleProjectDeleted}
      />
    </>
  );
}
