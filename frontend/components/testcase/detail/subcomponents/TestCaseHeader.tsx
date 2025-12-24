'use client';

import { DetailPageHeader } from '@/frontend/reusable-components/layout/DetailPageHeader';
import { Edit, Trash2 } from 'lucide-react';
import { TestCase, TestCaseFormData } from '../types';

interface TestCaseHeaderProps {
  testCase: TestCase;
  isEditing: boolean;
  formData: TestCaseFormData;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
  onFormChange: (data: TestCaseFormData) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  saving?: boolean;
}

export function TestCaseHeader({
  testCase,
  isEditing,
  formData,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onFormChange,
  canUpdate = true,
  canDelete = true,
  saving = false,
}: TestCaseHeaderProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'LOW':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'DRAFT':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'DEPRECATED':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <DetailPageHeader
      title={testCase.title}
      subtitle={`${testCase.project.name} (${testCase.project.key})`}
      isEditing={isEditing}
      editTitle={formData.title}
      onTitleChange={(title) => onFormChange({ ...formData, title })}
      badges={[
        { label: 'Priority', value: testCase.priority, className: getPriorityColor(testCase.priority) },
        { label: 'Status', value: testCase.status, className: getStatusColor(testCase.status) },
      ]}
      actions={[
        { label: 'Edit', icon: Edit, onClick: onEdit, show: canUpdate },
        { label: 'Delete', icon: Trash2, onClick: onDelete, variant: 'destructive', show: canDelete },
      ]}
      editActions={{
        onSave,
        onCancel,
        saving,
      }}
    />
  );
}
