'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, PlayCircle, Folder } from 'lucide-react';
import { Navbar } from '@/frontend/reusable-components/layout/Navbar';
import { Breadcrumbs } from '@/frontend/reusable-components/layout/Breadcrumbs';
import { Loader } from '@/frontend/reusable-elements/loaders/Loader';
import { FloatingAlert, type FloatingAlertMessage } from '@/frontend/reusable-components/alerts/FloatingAlert';
import { PageHeaderWithBadge } from '@/frontend/reusable-components/layout/PageHeaderWithBadge';
import { ActionMenu } from '@/frontend/reusable-components/menus/ActionMenu';
import { TestSuite, Project } from './types';
import { CreateTestSuiteDialog } from './subcomponents/CreateTestSuiteDialog';
import { DeleteTestSuiteDialog } from './subcomponents/DeleteTestSuiteDialog';
import { EmptyTestSuiteState } from './subcomponents/EmptyTestSuiteState';
import { CreateTestRunDialog } from '@/frontend/components/testrun/subcomponents/CreateTestRunDialog';
import { usePermissions } from '@/hooks/usePermissions';

interface TestSuiteListProps {
  projectId: string;
}

export default function TestSuiteList({ projectId }: TestSuiteListProps) {
  const router = useRouter();
  const { hasPermission: hasPermissionCheck, isLoading: permissionsLoading } = usePermissions();
  const [project, setProject] = useState<Project | null>(null);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createTestRunDialogOpen, setCreateTestRunDialogOpen] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [suiteForTestRun, setSuiteForTestRun] = useState<TestSuite | null>(null);
  const [alert, setAlert] = useState<FloatingAlertMessage | null>(null);

  const canCreateTestSuite = hasPermissionCheck('testsuites:create');
  const canCreateTestRun = hasPermissionCheck('testruns:create');

  const navbarActions = useMemo(() => {
    const actions = [];
    
    if (canCreateTestSuite) {
      actions.push({
        type: 'action' as const,
        label: 'テストスイートを作成',
        icon: Plus,
        onClick: () => setCreateDialogOpen(true),
        variant: 'primary' as const,
        buttonName: 'Test Suite List - Create Test Suite',
      });
    }

    actions.push({
      type: 'signout' as const,
      showConfirmation: true,
    });

    return actions;
  }, [canCreateTestSuite]);

  useEffect(() => {
    fetchProject();
    fetchTestSuites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (project) {
      document.title = `Test Suites - ${project.name} | EZTest`;
    }
  }, [project]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setAlert({
          type: 'error',
          title: 'Failed to Load Project',
          message: errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        });
      } else {
        const data = await response.json();
        if (data.data) {
          setProject(data.data);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setAlert({
        type: 'error',
        title: 'Connection Error',
        message: errorMessage,
      });
      console.error('Error fetching project:', error);
    }
  };

  const fetchTestSuites = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/testsuites`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setAlert({
          type: 'error',
          title: 'テストスイートの読み込みに失敗しました',
          message: errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        });
        setTestSuites([]);
      } else {
        const data = await response.json();
        if (data.data) {
          setTestSuites(data.data);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setAlert({
        type: 'error',
        title: 'Connection Error',
        message: errorMessage,
      });
      console.error('Error fetching test suites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTestSuite = async () => {
    if (!selectedSuite) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/testsuites/${selectedSuite.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteDialogOpen(false);
        const deletedSuiteName = selectedSuite.name;
        setSelectedSuite(null);
        setAlert({
          type: 'success',
          title: 'Success',
          message: `Test suite "${deletedSuiteName}" deleted successfully`,
        });
        setTimeout(() => setAlert(null), 5000);
        fetchTestSuites();
      } else {
        const data = await response.json();
        setAlert({
          type: 'error',
          title: 'テストスイートの削除に失敗しました',
          message: data.error || 'Failed to delete test suite',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setAlert({
        type: 'error',
        title: 'Connection Error',
        message: errorMessage,
      });
      console.error('Error deleting test suite:', error);
    }
  };

  const handleViewSuite = (suiteId: string) => {
    router.push(`/projects/${projectId}/testsuites/${suiteId}`);
  };

  const handleDeleteClick = (suite: TestSuite) => {
    setSelectedSuite(suite);
    setDeleteDialogOpen(true);
  };

  const handleCreateTestRunClick = (suite: TestSuite) => {
    setSuiteForTestRun(suite);
    setCreateTestRunDialogOpen(true);
  };

  const rootSuites = testSuites
    .filter(s => !s.parentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (loading || permissionsLoading) {
    return <Loader fullScreen text="テストスイートを読み込み中..." />;
  }

  return (
    <>
      {/* Alert Messages */}
      <FloatingAlert alert={alert} onClose={() => setAlert(null)} />

      {project && (
        <Navbar
          brandLabel={null}
          items={[]}
          breadcrumbs={
            <Breadcrumbs 
              items={[
                { label: 'プロジェクト', href: '/projects' },
                { label: project.name, href: `/projects/${projectId}` },
                { label: 'テストスイート', href: `/projects/${projectId}/testsuites` },
              ]}
            />
          }
          actions={navbarActions}
        />
      )}

      <div className="max-w-7xl mx-auto px-8 pt-8">
        {/* Header */}
        <PageHeaderWithBadge
          badge={project?.key}
          title="テストスイート"
          description="テストケースを階層的なスイートに整理します"
          className="mb-6"
        />

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-400">
            {testSuites.length} 件のスイート
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <Loader fullScreen={false} text="テストスイートを読み込み中..." />
        ) : testSuites.length === 0 ? (
          <EmptyTestSuiteState onCreateClick={() => setCreateDialogOpen(true)} canCreate={canCreateTestSuite} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs font-semibold text-white/60">
                  <th className="px-3 py-2 text-left">名前</th>
                  <th className="px-3 py-2 text-left">説明</th>
                  <th className="px-3 py-2 text-center">テストケース数</th>
                  <th className="px-3 py-2 text-center">子スイート数</th>
                  <th className="px-3 py-2 text-left">作成日</th>
                  <th className="px-3 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {rootSuites.map((suite) => (
                  <tr
                    key={suite.id}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => handleViewSuite(suite.id)}
                  >
                    <td className="px-3 py-3 font-medium text-white">
                      {suite.name}
                    </td>
                    <td className="px-3 py-3 text-white/50 max-w-xs truncate">
                      {suite.description || '—'}
                    </td>
                    <td className="px-3 py-3 text-center text-white/70">
                      <span className="inline-flex items-center gap-1">
                        <Edit className="w-3.5 h-3.5" />
                        {suite._count.testCases}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-white/70">
                      <span className="inline-flex items-center gap-1">
                        <Folder className="w-3.5 h-3.5" />
                        {suite.children?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-white/50">
                      {new Date(suite.createdAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <ActionMenu
                        items={[
                          {
                            label: 'View / Edit',
                            icon: Edit,
                            onClick: () => handleViewSuite(suite.id),
                          },
                          {
                            label: 'テストランを作成',
                            icon: PlayCircle,
                            onClick: () => handleCreateTestRunClick(suite),
                            show: canCreateTestRun,
                            buttonName: 'Test Suite List - Create Test Run',
                          },
                        ]}
                        align="end"
                        iconSize="h-4 w-4"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateTestSuiteDialog
        projectId={projectId}
        testSuites={testSuites}
        triggerOpen={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onTestSuiteCreated={(suite) => {
          setAlert({
            type: 'success',
            title: 'Success',
            message: `Test suite "${suite.name}" created successfully`,
          });
          setTimeout(() => setAlert(null), 5000);
          fetchTestSuites();
        }}
      />

      <DeleteTestSuiteDialog
        suite={selectedSuite}
        triggerOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteTestSuite}
      />

      {suiteForTestRun && (
        <CreateTestRunDialog
          key={suiteForTestRun.id}
          projectId={projectId}
          triggerOpen={createTestRunDialogOpen}
          onOpenChange={(open) => {
            setCreateTestRunDialogOpen(open);
            if (!open) {
              setSuiteForTestRun(null);
            }
          }}
          testSuiteIds={[suiteForTestRun.id]}
          defaultName={suiteForTestRun.name}
          onTestRunCreated={(testRun) => {
            setCreateTestRunDialogOpen(false);
            setSuiteForTestRun(null);
            router.push(`/projects/${projectId}/testruns/${testRun.id}`);
          }}
        />
      )}
    </>
  );
}