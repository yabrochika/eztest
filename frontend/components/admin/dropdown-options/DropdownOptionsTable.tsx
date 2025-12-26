'use client';

import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import { GroupedDataTable, ColumnDef, GroupConfig, ActionConfig } from '@/frontend/reusable-components/tables/GroupedDataTable';
import { Edit2 } from 'lucide-react';
import { DropdownOption } from './types';

interface DropdownField {
  entity: string;
  field: string;
  options: DropdownOption[];
}

interface DropdownOptionsTableProps {
  groupedOptions: Record<string, Record<string, DropdownOption[]>>;
  onEdit: (entity: string, field: string, options: DropdownOption[]) => void;
}

/**
 * Dropdown options table component with entity grouping
 * Uses the reusable GroupedDataTable component
 */
export function DropdownOptionsTable({
  groupedOptions,
  onEdit,
}: DropdownOptionsTableProps) {
  // Flatten grouped options into flat array for the table
  const flattenedData: DropdownField[] = [];
  Object.entries(groupedOptions).forEach(([entity, fields]) => {
    Object.entries(fields).forEach(([field, options]) => {
      flattenedData.push({ entity, field, options });
    });
  });

  const formatFieldName = (field: string): string => {
    return field
      .split(/(?=[A-Z])/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatEntityName = (entity: string): string => {
    return entity
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Define columns
  const columns: ColumnDef<DropdownField>[] = [
    {
      key: 'field',
      label: 'FIELD NAME',
      width: '200px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white">
            {formatFieldName(row.field)}
          </p>
        </div>
      ),
    },
    {
      key: 'options',
      label: 'OPTIONS',
      render: (row) => (
        <div className="flex flex-wrap gap-2 py-1">
          {row.options
            .filter((opt) => opt.isActive)
            .sort((a, b) => a.order - b.order)
            .map((option) => (
              <Badge
                key={option.id}
                variant="outline"
                style={{
                  borderColor: option.color || undefined,
                  color: option.color || undefined,
                }}
              >
                {option.label}
              </Badge>
            ))}
          {row.options.filter((opt) => opt.isActive).length === 0 && (
            <span className="text-sm text-white/40">No active options</span>
          )}
        </div>
      ),
    },
    {
      key: 'count',
      label: 'COUNT',
      width: '80px',
      align: 'center',
      render: (row) => (
        <Badge variant="secondary">
          {row.options.length}
        </Badge>
      ),
    },
  ];

  // Group config
  const groupConfig: GroupConfig<DropdownField> = {
    getGroupId: (row) => row.entity,
    getGroupName: (groupId) => formatEntityName(groupId),
    getGroupCount: (groupId) => {
      return Object.keys(groupedOptions[groupId] || {}).length;
    },
  };

  // Actions config
  const actions: ActionConfig<DropdownField> = {
    items: [
      {
        label: 'Edit Options',
        icon: Edit2,
        onClick: (row) => onEdit(row.entity, row.field, row.options),
        variant: 'default',
      },
    ],
    align: 'end',
  };

  return (
    <GroupedDataTable
      data={flattenedData}
      columns={columns}
      grouped={true}
      groupConfig={groupConfig}
      actions={actions}
      emptyMessage="No dropdown options found. Run the seed script to populate dropdown options."
      gridTemplateColumns="200px 1fr 80px 50px"
    />
  );
}

