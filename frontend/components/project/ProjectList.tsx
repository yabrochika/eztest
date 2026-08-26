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
import { InProgressRuns } from '@/frontend/components/dashboard/InProgressRuns';
import { ScheduleTimeline } from '@/frontend/components/dashboard/ScheduleTimeline';
import { ProjectActivityRow } from '@/frontend/components/dashboard/ProjectActivityRow';
import { TodoSidebar } from '@/frontend/components/dashboard/TodoSidebar';
import type { DashboardData } from '@/frontend/components/dashboard/types';
import { usePermissions } from '@/hooks/usePermissions';

const EMPTY_DASHBOARD: DashboardData = {
  rangeDays: 14,
  weekCount: 8,
  weekRange: { start: '', end: '' },
  timeline: [],
  inProgressRuns: [],
  activity: {
    days: [],
    totals: { PASSED: 0, FAILED: 0, BLOCKED: 0, RETEST: 0, SKIPPED: 0 },
  },
  projects: [],
  todos: { testRuns: [], defects: [] },
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
          <h1 className="mb-1 text-3xl font-bold text-white">ダッシュボード</h1>
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
            <div className="space-y-6">
              <InProgressRuns
                runs={dashboard.inProgressRuns || []}
                projects={projects.map((project) => ({
                  id: project.id,
                  name: project.name,
                  key: project.key,
                  suiteCount: project._count?.testSuites ?? 0,
                }))}
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
                onOpenRun={(projectId, runId) => router.push(`/projects/${projectId}/testruns/${runId}`)}
              />

              <WeeklyProjectActivity
                projects={projects}
                onOpenProject={(projectId) => router.push(`/projects/${projectId}`)}
              />

              <section>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-white">プロジェクト概要</h2>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/50">
                    {projects.length}
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <p className="mb-3 text-xs text-white/40">
                  TestRail のプロジェクトダッシュボードと同様に、プロジェクト名・目的・テストラン結果を一覧します。週次は金曜始まり（金〜木、JST）です。
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

            <TodoSidebar
              projects={projects}
              testRuns={dashboard.todos.testRuns}
              defects={dashboard.todos.defects}
              onNavigate={(path) => router.push(path)}
            />
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
