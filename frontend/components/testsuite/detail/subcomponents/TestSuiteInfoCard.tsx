import { DetailCard } from '@/frontend/reusable-components/cards/DetailCard';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import { StatisticsSection } from '@/frontend/reusable-components/data/StatisticsSection';
import { DateInfoSection } from '@/frontend/reusable-components/data/DateInfoSection';
import { Folder } from 'lucide-react';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { getDynamicBadgeProps } from '@/lib/badge-color-utils';

interface TestSuiteInfoCardProps {
  status?: string;
  parent?: {
    id: string;
    name: string;
  };
  testCasesCount: number;
  childrenCount: number;
  createdAt: string;
  updatedAt: string;
  onParentClick: (parentId: string) => void;
}

export function TestSuiteInfoCard({
  status,
  parent,
  testCasesCount,
  childrenCount,
  createdAt,
  updatedAt,
  onParentClick,
}: TestSuiteInfoCardProps) {
  const { options: statusOptions } = useDropdownOptions('TestSuite', 'status');
  const statusBadgeProps = getDynamicBadgeProps(status, statusOptions);
  const statusLabel =
    statusOptions.find((opt) => opt.value === status)?.label ||
    status?.replace(/_/g, ' ') ||
    '未設定';

  return (
    <DetailCard title="Information" contentClassName="space-y-3">
      {status && (
        <div>
          <h4 className="text-sm font-medium text-white/60 mb-1">Status</h4>
          <Badge
            variant="outline"
            className={statusBadgeProps.className}
            style={statusBadgeProps.style}
          >
            {statusLabel}
          </Badge>
        </div>
      )}

      {parent && (
        <div>
          <h4 className="text-sm font-medium text-white/60 mb-1">
            Parent Suite
          </h4>
          <Button
            variant="glass"
            size="sm"
            className="w-full justify-start"
            onClick={() => onParentClick(parent.id)}
          >
            <Folder className="w-4 h-4 mr-2" />
            {parent.name}
          </Button>
        </div>
      )}

      <StatisticsSection
        statistics={[
          { label: 'Test Cases', value: testCasesCount },
          { label: 'Child Suites', value: childrenCount },
        ]}
      />

      <DateInfoSection label="Created" date={createdAt} />
      <DateInfoSection label="Last Updated" date={updatedAt} />
    </DetailCard>
  );
}
