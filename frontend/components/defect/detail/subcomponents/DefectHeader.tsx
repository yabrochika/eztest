'use client';

import { DetailPageHeader } from '@/frontend/reusable-components/layout/DetailPageHeader';
import { Edit, Trash2, RotateCcw } from 'lucide-react';
import { Defect, DefectFormData } from '../types';

interface DefectHeaderProps {
  defect: Defect;
  isEditing: boolean;
  formData: DefectFormData;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
  onReopen: () => void;
  onFormChange: (data: DefectFormData) => void;
  saving?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function DefectHeader({
  defect,
  isEditing,
  formData,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onReopen,
  onFormChange,
  saving = false,
  canUpdate = true,
  canDelete = true,
}: DefectHeaderProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
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
      case 'NEW':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'IN_PROGRESS':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'FIXED':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'TESTED':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'CLOSED':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ');
  };

  return (
    <DetailPageHeader
      title={defect.title}
      subtitle={defect.defectId}
      subtitleClassName="text-sm"
      isEditing={isEditing}
      editTitle={formData.title}
      onTitleChange={(title) => onFormChange({ ...formData, title })}
      badges={[
        { label: 'Severity', value: defect.severity, className: getSeverityColor(defect.severity) },
        { label: 'Priority', value: defect.priority, className: getPriorityColor(defect.priority) },
        { label: 'Status', value: formatStatus(defect.status), className: getStatusColor(defect.status) },
      ]}
      actions={[
        { label: 'Reopen', icon: RotateCcw, onClick: onReopen, show: defect.status === 'CLOSED' && canUpdate },
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
