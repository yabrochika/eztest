'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/frontend/reusable-elements/dialogs/Dialog';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import { Loader } from '@/frontend/reusable-elements/loaders/Loader';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { getDynamicBadgeProps } from '@/lib/badge-color-utils';
import { ChevronRight, ExternalLink } from 'lucide-react';

export interface SelectableTestRun {
  id: string;
  name: string;
  status: string;
  environment?: string | null;
  verificationEnvironment?: string | null;
  platform?: string | null;
  device?: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SelectableTestRunResult {
  id: string;
  status: string;
  duration?: number | null;
  executedAt?: string | null;
}

export interface TestRunWithResult {
  testRun: SelectableTestRun;
  result: SelectableTestRunResult;
}

interface SelectTestRunDialogProps {
  open: boolean;
  testCaseId: string;
  onOpenChange: (open: boolean) => void;
  /** 選択されたテストランの情報を親に渡す。親は RecordResultDialog を開く責務を持つ。 */
  onSelect: (testRun: SelectableTestRun, currentResult: SelectableTestRunResult) => void;
}

/** カンバンの Done 列。テストケース画面からの実行対象には含めない */
const DONE_STATUSES = new Set(['COMPLETED', 'CANCELLED']);

export function SelectTestRunDialog({
  open,
  testCaseId,
  onOpenChange,
  onSelect,
}: SelectTestRunDialogProps) {
  const router = useRouter();
  const [items, setItems] = useState<TestRunWithResult[]>([]);
  const [loading, setLoading] = useState(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const { options: testRunStatusOptions } = useDropdownOptions('TestRun', 'status');
  const { options: resultStatusOptions } = useDropdownOptions('TestResult', 'status');

  useEffect(() => {
    if (!open) {
      setItems([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/testcases/${testCaseId}/testruns`);
        const data = await res.json();
        if (cancelled) return;
        const loaded: TestRunWithResult[] = Array.isArray(data?.data) ? data.data : [];
        const selectable = loaded.filter((i) => !DONE_STATUSES.has(i.testRun.status));

        // 進行中が1件だけなら選択ダイアログを出さず、そのテストランへ結果記録する
        const inProgress = selectable.filter((i) => i.testRun.status === 'IN_PROGRESS');
        if (inProgress.length === 1) {
          onSelectRef.current(inProgress[0].testRun, inProgress[0].result);
          return;
        }

        setItems(selectable);
      } catch (err) {
        console.error('Failed to load test runs for test case:', err);
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, testCaseId]);

  const inProgressCount = items.filter((i) => i.testRun.status === 'IN_PROGRESS').length;

  const renderStatusBadge = (status: string, kind: 'testrun' | 'result') => {
    const options = kind === 'testrun' ? testRunStatusOptions : resultStatusOptions;
    const props = getDynamicBadgeProps(status, options);
    const label = options.find((o) => o.value === status)?.label || status.replace(/_/g, ' ');
    return (
      <Badge variant="outline" className={`${props.className} text-xs`} style={props.style}>
        {label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>テスト実行 — テストランを選択</DialogTitle>
          <DialogDescription>
            {inProgressCount > 1
              ? '進行中のテストランが複数あるため、結果を記録するテストランを選択してください。'
              : 'このテストケースを含むテストランを選択して結果を記録します。'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader text="読み込み中..." />
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-white/60 text-sm">
              実行可能なテストランがありません。Done のテストランは対象外です。
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map(({ testRun, result }) => (
                <li
                  key={testRun.id}
                  className="group rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onSelect(testRun, result)}
                    className="w-full text-left p-3 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white truncate">
                          {testRun.name}
                        </span>
                        {renderStatusBadge(testRun.status, 'testrun')}
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-white/60">
                        <span>現在の結果:</span>
                        {renderStatusBadge(result.status, 'result')}
                        {testRun.environment ? (
                          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                            env: {testRun.environment}
                          </span>
                        ) : null}
                        {testRun.platform ? (
                          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                            {testRun.platform}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <a
                      href={`/projects/${testRun.projectId}/testruns/${testRun.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onOpenChange(false);
                        router.push(`/projects/${testRun.projectId}/testruns/${testRun.id}`);
                      }}
                      className="shrink-0 inline-flex items-center justify-center size-7 text-white/50 hover:text-white/80"
                      title="テストラン詳細を開く"
                      aria-label="テストラン詳細を開く"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                    <ChevronRight className="shrink-0 size-4 text-white/40 group-hover:text-white/70" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            buttonName="Select Test Run Dialog - Cancel"
          >
            キャンセル
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
