'use client';

import { EmptyStateCard } from '@/frontend/reusable-components/cards/EmptyStateCard';
import { Bug } from 'lucide-react';

interface EmptyDefectStateProps {
  hasFilters: boolean;
  onCreateClick: () => void;
  canCreate?: boolean;
}

export function EmptyDefectState({ hasFilters, onCreateClick, canCreate = true }: EmptyDefectStateProps) {
  return (
    <EmptyStateCard
      icon={Bug}
      title="欠陥がありません"
      description={hasFilters
        ? '検索条件を変更してみてください'
        : '最初の欠陥を作成して始めましょう'}
      actionLabel={!hasFilters && canCreate ? '欠陥を作成' : undefined}
      onAction={!hasFilters && canCreate ? onCreateClick : undefined}
      actionButtonName="Defect List - Create Defect (Empty State)"
    />
  );
}
