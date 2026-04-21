'use client';

import { Users } from 'lucide-react';
import { DetailCard } from '@/frontend/reusable-components/cards/DetailCard';
import { EmptyStateCard } from '@/frontend/reusable-components/cards/EmptyStateCard';
import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import { formatDateTime } from '@/lib/date-utils';
import { ProjectMemberGroup } from '../types';

interface MemberGroupsCardProps {
  groups: ProjectMemberGroup[];
}

export function MemberGroupsCard({ groups }: MemberGroupsCardProps) {
  return (
    <DetailCard
      title={`メンバーグループ（${groups.length}）`}
      description="グループごとにメンバーを整理できます"
      className="mt-6"
      contentClassName=""
    >
      {groups.length === 0 ? (
        <EmptyStateCard
          icon={Users}
          title="グループがありません"
          description="「グループを作成」から最初のグループを作成してください"
        />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="rounded-xl border border-white/15 bg-white/5 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-base font-semibold text-white">{group.name}</p>
                <Badge variant="glass-secondary" className="border-white/20 text-white/80">
                  {group.members.length}名
                </Badge>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {group.members.map((entry) => (
                  <Badge key={entry.id} variant="glass-outline" className="text-white/85">
                    {entry.projectMember.user.name}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-white/60">
                作成者: {group.createdBy.name} / {formatDateTime(group.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </DetailCard>
  );
}
