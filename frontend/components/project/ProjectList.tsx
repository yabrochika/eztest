'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/frontend/reusable-components/layout/Navbar';
import { FloatingAlert, type FloatingAlertMessage } from '@/frontend/reusable-components/alerts/FloatingAlert';
import { InfoBanner } from '@/frontend/reusable-components/alerts/InfoBanner';
import { ResponsiveGrid } from '@/frontend/reusable-components/layout/ResponsiveGrid';
import { Loader } from '@/frontend/reusable-elements/loaders/Loader';
import { ProjectCard } from './subcomponents/ProjectCard';
import { CreateProjectDialog } from './subcomponents/CreateProjectDialog';
import { DeleteProjectDialog } from './subcomponents/DeleteProjectDialog';
import { EmptyProjectsState } from './subcomponents/EmptyProjectsState';
import { Project } from './types';
import { usePermissions } from '@/hooks/usePermissions';

export default function ProjectList() {
  const router = useRouter();
  const { status } = useSession();
  const { hasPermission: hasPermissionCheck, isLoading: permissionsLoading } = usePermissions();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [triggerCreateDialog, setTriggerCreateDialog] = useState(false);
  const [alert, setAlert] = useState<FloatingAlertMessage | null>(null);
  const [hasSelectedProject, setHasSelectedProject] = useState(false);

  // Compute permissions early for hooks
  const canCreateProject = hasPermissionCheck('projects:create');

  // Group projects by tag for section-based display.
  // A project with multiple tags appears under each of its tags.
  // Projects without tags fall into the "未分類" bucket shown last.
  const UNTAGGED = '__untagged__';
  const groupedProjects = useMemo(() => {
    const groups = new Map<string, Project[]>();
    for (const project of projects) {
      const tags = project.tags && project.tags.length > 0 ? project.tags : [UNTAGGED];
      for (const tag of tags) {
        const bucket = groups.get(tag);
        if (bucket) {
          bucket.push(project);
        } else {
          groups.set(tag, [project]);
        }
      }
    }

    const tagNames = Array.from(groups.keys())
      .filter((t) => t !== UNTAGGED)
      .sort((a, b) => a.localeCompare(b, 'ja'));

    const ordered = tagNames.map((tag) => ({ tag, projects: groups.get(tag)! }));
    if (groups.has(UNTAGGED)) {
      ordered.push({ tag: UNTAGGED, projects: groups.get(UNTAGGED)! });
    }
    return ordered;
  }, [projects]);

  // Only render section headers when there is at least one real tag in use
  const hasAnyTags = useMemo(
    () => projects.some((p) => p.tags && p.tags.length > 0),
    [projects]
  );

  const navbarActions = useMemo(() => {
    const actions = [];
    
    if (canCreateProject) {
      actions.push({
        type: 'action' as const,
        label: '+ 新規プロジェクト',
        onClick: () => setTriggerCreateDialog(true),
        variant: 'primary' as const,
        buttonName: 'Project List - New Project',
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
      fetchProjects();
    }
  }, [status]);

  // Check if user came from a project page (has project context in sessionStorage)
  useEffect(() => {
    const lastProjectId = sessionStorage.getItem('lastProjectId');
    setHasSelectedProject(!!lastProjectId);
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setAlert({
          type: 'error',
          title: 'プロジェクトの読み込みに失敗しました',
          message: errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        });
        setProjects([]);
      } else {
        const data = await response.json();
        setProjects(data.data || []);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setAlert({
        type: 'error',
        title: '接続エラー',
        message: errorMessage,
      });
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects([newProject, ...projects]);
    setAlert({
      type: 'success',
      title: '成功',
      message: `プロジェクト「${newProject.name}」を作成しました`,
    });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleProjectDeleted = (projectId: string) => {
    const deletedProject = projects.find(p => p.id === projectId);
    setProjects(projects.filter(p => p.id !== projectId));
    setProjectToDelete(null);
    if (deletedProject) {
      setAlert({
        type: 'success',
        title: '成功',
        message: `プロジェクト「${deletedProject.name}」を削除しました`,
      });
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const openDeleteDialog = (project: Project) => {
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
    return <Loader fullScreen text="プロジェクトを読み込み中..." />;
  }

  if (status === 'unauthenticated') {
    return null; // Will be redirected by useEffect
  }

  return (
    <>
      {/* Alert Messages */}
      <FloatingAlert alert={alert} onClose={() => setAlert(null)} />

      {/* Navbar */}
      <Navbar 
        brandLabel={null}
        items={[]}
        breadcrumbs={null}
        actions={navbarActions}
      />

      {/* Delete Dialog */}
      <div className="max-w-7xl mx-auto px-8 py-6 pt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">プロジェクト</h1>
              <p className="text-white/70 text-sm">テストプロジェクトを管理し、進捗を追跡します</p>
            </div>
          </div>
          
          {/* Info Banner - Only show when no project has been selected */}
          {projects.length > 0 && !hasSelectedProject && (
            <InfoBanner
              message="下のプロジェクトを選択すると、テストスイート・テストケースの表示やテスト活動の管理ができます。"
              variant="info"
              className="mb-6"
            />
          )}
          
          <CreateProjectDialog triggerOpen={triggerCreateDialog} onProjectCreated={handleProjectCreated} onOpenChange={handleDialogOpenChange} />
        </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-8 pb-8">
        {projects.length === 0 ? (
          <EmptyProjectsState onCreateProject={handleCreateProject} canCreateProject={canCreateProject} />
        ) : !hasAnyTags ? (
          <ResponsiveGrid
            columns={{ default: 1, md: 2, lg: 3 }}
            gap="md"
          >
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onNavigate={(path) => router.push(path)}
                onDelete={() => openDeleteDialog(project)}
                canUpdate={hasPermissionCheck('projects:update')}
                canDelete={hasPermissionCheck('projects:delete')}
                canManageMembers={hasPermissionCheck('projects:manage_members')}
              />
            ))}
          </ResponsiveGrid>
        ) : (
          <div className="space-y-10">
            {groupedProjects.map(({ tag, projects: tagProjects }) => (
              <section key={tag}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    {tag === UNTAGGED ? '未分類' : tag}
                  </h2>
                  <span className="text-xs text-white/50 bg-white/5 rounded-full px-2 py-0.5">
                    {tagProjects.length}
                  </span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <ResponsiveGrid
                  columns={{ default: 1, md: 2, lg: 3 }}
                  gap="md"
                >
                  {tagProjects.map((project) => (
                    <ProjectCard
                      key={`${tag}-${project.id}`}
                      project={project}
                      onNavigate={(path) => router.push(path)}
                      onDelete={() => openDeleteDialog(project)}
                      canUpdate={hasPermissionCheck('projects:update')}
                      canDelete={hasPermissionCheck('projects:delete')}
                      canManageMembers={hasPermissionCheck('projects:manage_members')}
                    />
                  ))}
                </ResponsiveGrid>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteProjectDialog
        project={projectToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onProjectDeleted={handleProjectDeleted}
      />
    </>
  );
}
