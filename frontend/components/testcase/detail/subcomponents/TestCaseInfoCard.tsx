'use client';

import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import { DetailCard } from '@/frontend/reusable-components/cards/DetailCard';
import { UserInfoSection } from '@/frontend/reusable-components/data/UserInfoSection';
import { StatisticsSection } from '@/frontend/reusable-components/data/StatisticsSection';
import { DateInfoSection } from '@/frontend/reusable-components/data/DateInfoSection';
import { TestCase } from '../types';

interface TestCaseInfoCardProps {
  testCase: TestCase;
}

export function TestCaseInfoCard({ testCase }: TestCaseInfoCardProps) {
  return (
    <DetailCard title="情報" contentClassName="space-y-3">
      <UserInfoSection
        label="作成者"
        user={{
          name: testCase.createdBy.name,
          email: testCase.createdBy.email,
        }}
      />

      {testCase.suite && (
        <div>
          <h4 className="text-sm font-medium text-white/60 mb-1">
            テストスイート
          </h4>
          <Badge variant="outline">{testCase.suite.name}</Badge>
        </div>
      )}

      <StatisticsSection
        statistics={[
          { label: 'テスト実行', value: testCase._count.results ?? 0 },
          { label: 'コメント', value: testCase._count.comments ?? 0 },
          { label: '添付ファイル', value: testCase._count.attachments ?? 0 },
        ]}
      />

      <DateInfoSection label="作成日" date={testCase.createdAt} />
      <DateInfoSection label="最終更新" date={testCase.updatedAt} />
    </DetailCard>
  );
}
