'use client';

import { TestSuiteCard } from './TestSuiteCard';
import { TestSuite } from '../types';

interface TestSuiteTreeItemProps {
  suite: TestSuite;
  isExpanded: boolean;
  onToggleExpand: (suiteId: string) => void;
  onView: (suiteId: string) => void;
  onDelete: (suite: TestSuite) => void;
  onCreateTestRun?: (suite: TestSuite) => void;
  canDelete?: boolean;
  canCreateTestRun?: boolean;
}

export function TestSuiteTreeItem({
  suite,
  isExpanded,
  onToggleExpand,
  onView,
  onDelete,
  onCreateTestRun,
  canDelete = true,
  canCreateTestRun = false,
}: TestSuiteTreeItemProps) {
  return (
    <TestSuiteCard
      suite={suite}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      onView={onView}
      onDelete={onDelete}
      onCreateTestRun={onCreateTestRun}
      canDelete={canDelete}
      canCreateTestRun={canCreateTestRun}
    />
  );
}
