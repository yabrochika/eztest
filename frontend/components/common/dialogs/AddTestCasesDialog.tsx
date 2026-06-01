'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/frontend/reusable-elements/dialogs/Dialog';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { ButtonPrimary } from '@/frontend/reusable-elements/buttons/ButtonPrimary';
import { CheckboxListItem } from '@/frontend/reusable-elements/checkboxes/CheckboxListItem';
import { PriorityBadge } from '@/frontend/reusable-components/badges/PriorityBadge';
import { Input } from '@/frontend/reusable-elements/inputs/Input';

interface TestCase {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  priority?: string;
}

interface AddTestCasesDialogProps {
  open: boolean;
  testCases: TestCase[];
  selectedIds: string[];
  onOpenChange: (open: boolean) => void;
  onSelectionChange: (ids: string[]) => void;
  onSubmit: () => void;
  context?: 'suite' | 'run'; // 'suite' for test suite, 'run' for test run
  showPriority?: boolean; // whether to show priority badge
  loading?: boolean; // whether submission is in progress
}

/**
 * Unified reusable dialog for adding test cases to suites or runs
 * Used in TestSuiteDetail and TestRunDetail
 */
export function AddTestCasesDialog({
  open,
  testCases,
  selectedIds,
  onOpenChange,
  onSelectionChange,
  onSubmit,
  context = 'run',
  showPriority = context === 'run',
  loading = false,
}: AddTestCasesDialogProps) {
  const handleToggle = (testCaseId: string) => {
    onSelectionChange(
      selectedIds.includes(testCaseId)
        ? selectedIds.filter((id) => id !== testCaseId)
        : [...selectedIds, testCaseId]
    );
  };

  const contextLabel = context === 'suite' ? 'このテストスイート' : 'このテストラン';
  const title = context === 'suite' ? 'テストスイートにテストケースを追加' : 'テストランにテストケースを追加';

  // テストケース名（タイトル）による部分一致検索
  const [searchQuery, setSearchQuery] = useState('');

  // ダイアログを閉じたら検索キーワードをリセット
  useEffect(() => {
    if (!open) setSearchQuery('');
  }, [open]);

  const filteredTestCases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return testCases;
    return testCases.filter((tc) => {
      const name = (tc.title || tc.name || '').toLowerCase();
      return name.includes(q);
    });
  }, [testCases, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={context === 'run' ? 'max-w-3xl' : 'max-w-lg'}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {contextLabel}に追加するテストケースを選択してください
          </DialogDescription>
        </DialogHeader>

        {testCases.length > 0 && (
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <Input
              variant="glass"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="テストケース名で検索（部分一致）"
              className="pl-10 pr-10"
              aria-label="テストケース名で検索"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 cursor-pointer"
                aria-label="検索をクリア"
                title="検索をクリア"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className={context === 'run' ? 'max-h-[400px] overflow-y-auto custom-scrollbar' : 'max-h-[80vh] overflow-y-auto custom-scrollbar pr-4'}>
          {testCases.length === 0 ? (
            <p className={context === 'run' ? 'text-white/60 text-center py-8' : 'text-gray-400 text-center py-8'}>
              追加できるテストケースがありません
            </p>
          ) : filteredTestCases.length === 0 ? (
            <p className={context === 'run' ? 'text-white/60 text-center py-8' : 'text-gray-400 text-center py-8'}>
              「{searchQuery}」に一致するテストケースはありません
            </p>
          ) : (
            <div className={context === 'run' ? 'space-y-2' : 'space-y-3'}>
              {filteredTestCases.map((testCase) => (
                <div
                  key={testCase.id}
                  className={`rounded transition-colors ${
                    context === 'run'
                      ? 'bg-white/5 hover:bg-white/10'
                      : 'border border-white/10 hover:bg-slate-800/50'
                  }`}
                >
                  <CheckboxListItem
                    id={testCase.id}
                    checked={selectedIds.includes(testCase.id)}
                    onCheckedChange={() => handleToggle(testCase.id)}
                    label={testCase.title || testCase.name || '（タイトルなし）'}
                    description={testCase.description}
                    rightContent={
                      showPriority && testCase.priority ? (
                        <PriorityBadge
                          priority={testCase.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'critical'}
                        />
                      ) : undefined
                    }
                    variant={context === 'run' ? 'compact' : 'default'}
                    checkboxVariant={context === 'suite' ? 'glass' : 'default'}
                    onClick={() => handleToggle(testCase.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="glass"
            onClick={() => {
              onOpenChange(false);
              onSelectionChange([]);
            }}
            className="cursor-pointer"
            disabled={loading}
          >
            キャンセル
          </Button>
          <ButtonPrimary
            onClick={onSubmit}
            disabled={selectedIds.length === 0 || loading}
            className="cursor-pointer"
          >
            {loading ? '追加中...' : `追加${selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}`}
          </ButtonPrimary>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
