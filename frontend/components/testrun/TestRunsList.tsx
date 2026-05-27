'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { ButtonPrimary } from '@/frontend/reusable-elements/buttons/ButtonPrimary';
import { ButtonSecondary } from '@/frontend/reusable-elements/buttons/ButtonSecondary';
import { TopBar } from '@/frontend/reusable-components/layout/TopBar';
import { Loader } from '@/frontend/reusable-elements/loaders/Loader';
import { Plus, Upload, FileCode, ArrowUp, ArrowDown } from 'lucide-react';
import { FloatingAlert, type FloatingAlertMessage } from '@/frontend/reusable-components/alerts/FloatingAlert';
import { PageHeaderWithBadge } from '@/frontend/reusable-components/layout/PageHeaderWithBadge';
import { HeaderWithFilters } from '@/frontend/reusable-components/layout/HeaderWithFilters';
import { ResponsiveGrid } from '@/frontend/reusable-components/layout/ResponsiveGrid';
import { TestRunsFilterCard } from './subcomponents/TestRunsFilterCard';
import { TestRunCard } from './subcomponents/TestRunCard';
import { TestRunsEmptyState } from './subcomponents/TestRunsEmptyState';
import { CreateTestRunDialog } from './subcomponents/CreateTestRunDialog';
import { EditTestRunDialog } from './subcomponents/EditTestRunDialog';
import { DeleteTestRunDialog } from './subcomponents/DeleteTestRunDialog';
import { UploadTestNGXMLDialog } from './subcomponents/UploadTestNGXMLDialog';
import { TestRun, Project, TestRunFilters } from './types';
import { usePermissions } from '@/hooks/usePermissions';
import { FileExportDialog } from '@/frontend/reusable-components/dialogs/FileExportDialog';
import { includesMultiValueField } from './utils/multiValueField';
import { sortTestRunsByPrefix, type SortDirection } from './utils/sortByPrefix';

interface TestRunsListProps {
  projectId: string;
}

export default function TestRunsList({ projectId }: TestRunsListProps) {
  const router = useRouter();
  const { hasPermission: hasPermissionCheck, isLoading: permissionsLoading } = usePermissions();

  const [project, setProject] = useState<Project | null>(null);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [filteredTestRuns, setFilteredTestRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [uploadXMLDialogOpen, setUploadXMLDialogOpen] = useState(false);
  const [selectedTestRun, setSelectedTestRun] = useState<TestRun | null>(null);

  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [filters, setFilters] = useState<TestRunFilters>({
    searchQuery: '',
    statusFilter: 'all',
    environmentFilter: 'all',
    platformFilter: 'all',
    deviceFilter: 'all',
    assignedToFilter: 'all',
  });

  const [alert, setAlert] = useState<FloatingAlertMessage | null>(null);

  useEffect(() => {
    fetchProject();
    fetchTestRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (project) {
      document.title = `テストラン - ${project.name} | EZTest`;
    }
  }, [project]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testRuns, filters, sortDirection]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();
      if (data.data) {
        setProject(data.data);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchTestRuns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/testruns`);
      const data = await response.json();
      if (data.data) {
        setTestRuns(data.data);
      }
    } catch (error) {
      console.error('Error fetching test runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...testRuns];

    // Search filter
    // テストラン名・説明に加えて、テストランに含まれる
    // テストケースの TC番号(tcId) / タイトル(title) でも検索できるようにする。
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter((tr) => {
        if (tr.name.toLowerCase().includes(query)) return true;
        if (tr.description?.toLowerCase().includes(query)) return true;
        return tr.results?.some((result) => {
          const tcId = result.testCase?.tcId?.toLowerCase() || '';
          const title = result.testCase?.title?.toLowerCase() || '';
          return tcId.includes(query) || title.includes(query);
        }) ?? false;
      });
    }

    // Status filter
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter((tr) => tr.status === filters.statusFilter);
    }

    // Environment filter
    if (filters.environmentFilter !== 'all') {
      filtered = filtered.filter(
        (tr) => includesMultiValueField(tr.environment, filters.environmentFilter)
      );
    }

    // Platform filter
    if (filters.platformFilter !== 'all') {
      filtered = filtered.filter(
        (tr) => includesMultiValueField(tr.platform, filters.platformFilter)
      );
    }

    // Device filter
    if (filters.deviceFilter !== 'all') {
      filtered = filtered.filter(
        (tr) => includesMultiValueField(tr.device, filters.deviceFilter)
      );
    }

    // Assigned tester filter
    if (filters.assignedToFilter !== 'all') {
      if (filters.assignedToFilter === 'unassigned') {
        filtered = filtered.filter((tr) => !tr.assignedTo && (!tr.assignedToIds || tr.assignedToIds.length === 0));
      } else {
        filtered = filtered.filter(
          (tr) => tr.assignedTo?.id === filters.assignedToFilter || tr.assignedToIds?.includes(filters.assignedToFilter)
        );
      }
    }

    // 並び順をプレフィックス順（SM → CR → EZ → EX、その他はアルファベット順）に統一する。
    // 番号部分は自然順（SM01 → SM02 → SM10）で比較。降順の場合は全体を反転。
    setFilteredTestRuns(sortTestRunsByPrefix(filtered, sortDirection));
  };

  const handleTestRunCreated = (newTestRun: TestRun) => {
    setAlert({
      type: 'success',
      title: '成功',
      message: `テストラン「${newTestRun.name}」を作成しました`,
    });
    setTimeout(() => setAlert(null), 5000);
    fetchTestRuns();
  };

  const handleDeleteTestRun = async () => {
    if (!selectedTestRun) return;

    try {
      const response = await fetch(`/api/testruns/${selectedTestRun.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const deletedTestRunName = selectedTestRun.name;
        setDeleteDialogOpen(false);
        setSelectedTestRun(null);
        setAlert({
          type: 'success',
          title: '成功',
          message: `テストラン「${deletedTestRunName}」を削除しました`,
        });
        setTimeout(() => setAlert(null), 5000);
        fetchTestRuns();
      } else {
        const data = await response.json();
        setAlert({
          type: 'error',
          title: 'テストランの削除に失敗しました',
          message: data.error || 'テストランの削除に失敗しました',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      setAlert({
        type: 'error',
        title: '接続エラー',
        message: errorMessage,
      });
      console.error('Error deleting test run:', error);
    }
  };

  /**
   * テストランを複製する。
   * 既存テストランの詳細を取得し、設定値（説明・環境・端末・アサイン・テストケース等）を
   * そのまま流用した新規テストランを作成する。ステータスは NOT_STARTED に戻し、
   * 名前末尾に「 (コピー)」を付与する。作成後は新テストランの詳細ページへ遷移する。
   */
  const handleDuplicateTestRun = async (sourceTestRun: TestRun) => {
    try {
      // 完全なテストケースID一覧を得るために詳細を取得する（一覧 API には testCaseId が含まれない）
      const detailRes = await fetch(
        `/api/projects/${projectId}/testruns/${sourceTestRun.id}`
      );
      const detailJson = await detailRes.json();
      if (!detailRes.ok || !detailJson?.data) {
        setAlert({
          type: 'error',
          title: '複製に失敗しました',
          message: detailJson?.error || 'テストラン詳細の取得に失敗しました',
        });
        return;
      }
      const detail = detailJson.data as {
        results?: Array<{ testCaseId?: string; testCase?: { id?: string } }>;
      };

      const testCaseIds = Array.from(
        new Set(
          (detail.results || [])
            .map((r) => r.testCaseId || r.testCase?.id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
        )
      );

      const newName = `${sourceTestRun.name} (コピー)`;

      const payload: Record<string, unknown> = {
        name: newName,
        description: sourceTestRun.description ?? undefined,
        executionType: sourceTestRun.executionType ?? 'MANUAL',
        version: sourceTestRun.version ?? undefined,
        environment: sourceTestRun.environment ?? undefined,
        verificationEnvironment: sourceTestRun.verificationEnvironment ?? undefined,
        verificationEnvironmentNote: sourceTestRun.verificationEnvironmentNote ?? undefined,
        platform: sourceTestRun.platform ?? undefined,
        device: sourceTestRun.device ?? undefined,
        assignedToId: sourceTestRun.assignedTo?.id ?? undefined,
        assignedToIds:
          sourceTestRun.assignedToIds && sourceTestRun.assignedToIds.length > 0
            ? sourceTestRun.assignedToIds
            : sourceTestRun.assignedTo?.id
              ? [sourceTestRun.assignedTo.id]
              : undefined,
        status: 'NOT_STARTED',
        testCaseIds,
      };

      const createRes = await fetch(`/api/projects/${projectId}/testruns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const createJson = await createRes.json();
      if (!createRes.ok || !createJson?.data) {
        setAlert({
          type: 'error',
          title: '複製に失敗しました',
          message: createJson?.error || 'テストランの作成に失敗しました',
        });
        return;
      }

      setAlert({
        type: 'success',
        title: '成功',
        message: `テストラン「${newName}」を作成しました`,
      });
      setTimeout(() => setAlert(null), 5000);

      const newId = (createJson.data as { id?: string }).id;
      if (newId) {
        router.push(`/projects/${projectId}/testruns/${newId}`);
      } else {
        fetchTestRuns();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '不明なエラーが発生しました';
      setAlert({ type: 'error', title: '接続エラー', message });
      console.error('Error duplicating test run:', error);
    }
  };

  const handleTestRunUpdated = (updatedTestRun: { id: string; name: string }) => {
    setEditDialogOpen(false);
    setSelectedTestRun(null);
    setAlert({
      type: 'success',
      title: '成功',
      message: `テストラン「${updatedTestRun.name}」を更新しました`,
    });
    setTimeout(() => setAlert(null), 5000);
    fetchTestRuns();
  };

  // Build tester filter options dynamically from test runs data
  const testerFilterOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = [
      { value: 'all', label: 'すべてのテスター' },
      { value: 'unassigned', label: '未割り当て' },
    ];
    const seen = new Set<string>();
    testRuns.forEach((tr) => {
      if (tr.assignedTo && !seen.has(tr.assignedTo.id)) {
        seen.add(tr.assignedTo.id);
        options.push({
          value: tr.assignedTo.id,
          label: tr.assignedTo.name || tr.assignedTo.email,
        });
      }
      tr.assignedToList?.forEach((assignedUser) => {
        if (!seen.has(assignedUser.id)) {
          seen.add(assignedUser.id);
          options.push({
            value: assignedUser.id,
            label: assignedUser.name || assignedUser.email,
          });
        }
      });
    });
    return options;
  }, [testRuns]);

  if (loading || permissionsLoading) {
    return <Loader fullScreen text="テストランを読み込み中..." />;
  }

  const canCreateTestRun = hasPermissionCheck('testruns:create');
  const canUpdateTestRun = hasPermissionCheck('testruns:update');
  const canDeleteTestRun = hasPermissionCheck('testruns:delete');
  const canReadTestRun = hasPermissionCheck('testruns:read');


  return (
    <>
      {/* Alert Messages */}
      <FloatingAlert alert={alert} onClose={() => setAlert(null)} />

      <TopBar
        breadcrumbs={[
          { label: 'プロジェクト', href: '/projects' },
          { label: project?.name || '読み込み中...', href: `/projects/${projectId}` },
          { label: 'テストラン' },
        ]}
        actions={
          <div className="flex gap-2">
            {canReadTestRun && (
              <>
                <ButtonSecondary 
                  onClick={() => setUploadXMLDialogOpen(true)} 
                  className="cursor-pointer"
                  title="TestNG XML 結果をアップロード"
                  buttonName="Test Runs List - Upload XML"
                >
                  <FileCode className="w-4 h-4 mr-2" />
                  XML アップロード
                </ButtonSecondary>
                <ButtonSecondary 
                  onClick={() => setExportDialogOpen(true)} 
                  className="cursor-pointer"
                  title="テストランをエクスポート"
                  buttonName="Test Runs List - Export"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  エクスポート
                </ButtonSecondary>
              </>
            )}
            {canCreateTestRun && (
              <ButtonPrimary
                onClick={() => setCreateDialogOpen(true)}
                buttonName="Test Runs List - New Test Run"
              >
                <Plus className="w-4 h-4 mr-2" />
                新規テストラン
              </ButtonPrimary>
            )}
          </div>
        }
      />

      {/* Page Header and Filters */}
      <div className="px-8 pt-4">
        <HeaderWithFilters
          header={
            <PageHeaderWithBadge
              badge={project?.key}
              title="テストラン"
              description="テスト実行の進捗を管理・追跡します"
              titleSuffix={
                <button
                  type="button"
                  onClick={() =>
                    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                  }
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-white/15 bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition-colors text-xs cursor-pointer"
                  title={
                    sortDirection === 'asc'
                      ? '昇順（SM → CR → EZ → EX）クリックで降順に切替'
                      : '降順 クリックで昇順に切替'
                  }
                  aria-label={
                    sortDirection === 'asc' ? '昇順 / クリックで降順' : '降順 / クリックで昇順'
                  }
                  data-button-name="Test Runs List - Toggle Sort Direction"
                >
                  {sortDirection === 'asc' ? (
                    <ArrowUp className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDown className="w-3.5 h-3.5" />
                  )}
                  <span>{sortDirection === 'asc' ? '昇順' : '降順'}</span>
                </button>
              }
            />
          }
          filters={
            <TestRunsFilterCard
              filters={filters}
              testerOptions={testerFilterOptions}
              onSearchChange={(searchQuery) =>
                setFilters({ ...filters, searchQuery })
              }
              onStatusFilterChange={(statusFilter) =>
                setFilters({ ...filters, statusFilter })
              }
              onEnvironmentFilterChange={(environmentFilter) =>
                setFilters({ ...filters, environmentFilter })
              }
              onPlatformFilterChange={(platformFilter) =>
                setFilters({ ...filters, platformFilter })
              }
              onDeviceFilterChange={(deviceFilter) =>
                setFilters({ ...filters, deviceFilter })
              }
              onAssignedToFilterChange={(assignedToFilter) =>
                setFilters({ ...filters, assignedToFilter })
              }
            />
          }
          className="mb-4"
        />
      </div>

      {/* Test Runs Grid */}
      <div className="max-w-7xl mx-auto px-8 pb-8">
        {filteredTestRuns.length === 0 ? (
          <TestRunsEmptyState
            hasTestRuns={testRuns.length > 0}
            onCreateClick={() => setCreateDialogOpen(true)}
            canCreate={canCreateTestRun}
          />
        ) : (
          <ResponsiveGrid
            columns={{ default: 1, md: 2, lg: 3 }}
            gap="sm"
          >
            {filteredTestRuns.map((testRun) => (
              <TestRunCard
                key={testRun.id}
                testRun={testRun}
                canUpdate={canUpdateTestRun}
                canDelete={canDeleteTestRun}
                canDuplicate={canCreateTestRun}
                onCardClick={() =>
                  router.push(`/projects/${projectId}/testruns/${testRun.id}`)
                }
                onViewDetails={() =>
                  router.push(`/projects/${projectId}/testruns/${testRun.id}`)
                }
                onEdit={() => {
                  setSelectedTestRun(testRun);
                  setEditDialogOpen(true);
                }}
                onDelete={() => {
                  setSelectedTestRun(testRun);
                  setDeleteDialogOpen(true);
                }}
                onDuplicate={() => handleDuplicateTestRun(testRun)}
              />
            ))}
          </ResponsiveGrid>
        )}

        {/* Create Dialog */}
        <CreateTestRunDialog
          projectId={projectId}
          triggerOpen={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onTestRunCreated={handleTestRunCreated}
        />

        {/* Edit Dialog */}
        <EditTestRunDialog
          projectId={projectId}
          testRun={selectedTestRun}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onTestRunUpdated={handleTestRunUpdated}
        />

        {/* Delete Dialog */}
        <DeleteTestRunDialog
          testRun={selectedTestRun}
          triggerOpen={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteTestRun}
        />

        {/* Export Dialog */}
        <FileExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          title="テストランをエクスポート"
          description="エクスポート形式を選択してください。"
          exportOptions={{
            projectId,
            endpoint: `/api/projects/${projectId}/testruns/export`,
            filters: {
              status: filters.statusFilter !== 'all' ? filters.statusFilter : undefined,
              environment: filters.environmentFilter !== 'all' ? filters.environmentFilter : undefined,
            },
          }}
          itemName="テストラン"
        />

        {/* Upload XML Dialog */}
        <UploadTestNGXMLDialog
          open={uploadXMLDialogOpen}
          onOpenChange={setUploadXMLDialogOpen}
          projectId={projectId}
          onImportComplete={() => {
            fetchTestRuns();
          }}
        />
      </div>
    </>
  );
}
