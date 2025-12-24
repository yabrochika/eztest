import { DetailPageHeader } from '@/frontend/reusable-components/layout/DetailPageHeader';
import { Edit, Trash2 } from 'lucide-react';

interface TestSuiteHeaderProps {
  testSuite: {
    name: string;
    project: {
      id: string;
      name: string;
      key: string;
    };
  };
  isEditing: boolean;
  formData: { name: string };
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onNameChange: (name: string) => void;
  onBack?: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function TestSuiteHeader({
  testSuite,
  isEditing,
  formData,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onNameChange,
  canUpdate = false,
  canDelete = false,
}: TestSuiteHeaderProps) {
  return (
    <DetailPageHeader
      title={testSuite.name}
      subtitle={`${testSuite.project.name} (${testSuite.project.key})`}
      isEditing={isEditing}
      editTitle={formData.name}
      onTitleChange={onNameChange}
      badges={[
        { label: '', value: 'Test Suite', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
      ]}
      actions={[
        { label: 'Edit', icon: Edit, onClick: onEdit, show: canUpdate },
        { label: 'Delete', icon: Trash2, onClick: onDelete, variant: 'destructive', show: canDelete },
      ]}
      editActions={{
        onSave,
        onCancel: onCancelEdit,
      }}
    />
  );
}
