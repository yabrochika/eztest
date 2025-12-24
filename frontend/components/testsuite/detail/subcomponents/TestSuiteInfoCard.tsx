import { DetailCard } from '@/frontend/reusable-components/cards/DetailCard';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { StatisticsSection } from '@/frontend/reusable-components/data/StatisticsSection';
import { DateInfoSection } from '@/frontend/reusable-components/data/DateInfoSection';
import { Folder } from 'lucide-react';

interface TestSuiteInfoCardProps {
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
  parent,
  testCasesCount,
  childrenCount,
  createdAt,
  updatedAt,
  onParentClick,
}: TestSuiteInfoCardProps) {
  return (
    <DetailCard title="Information" contentClassName="space-y-3">
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
