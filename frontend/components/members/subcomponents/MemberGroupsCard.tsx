'use client';

import { Edit, Trash2, Users } from 'lucide-react';
import { DetailCard } from '@/frontend/reusable-components/cards/DetailCard';
import { EmptyStateCard } from '@/frontend/reusable-components/cards/EmptyStateCard';
import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { formatDateTime } from '@/lib/date-utils';
import { ProjectMemberGroup } from '../types';

interface MemberGroupsCardProps {
  groups: ProjectMemberGroup[];
  isAdminOrManager?: boolean;
  onEditGroup?: (group: ProjectMemberGroup) => void;
  onDeleteGroup?: (group: ProjectMemberGroup) => void;
}

export function MemberGroupsCard({
  groups,
  isAdminOrManager = false,
  onEditGroup,
  onDeleteGroup,
}: MemberGroupsCardProps) {
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
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-base font-semibold text-white">{group.name}</p>
                  <Badge variant="glass-secondary" className="border-white/20 text-white/80">
                    {group.members.length}名
                  </Badge>
                </div>
                {isAdminOrManager && (onEditGroup || onDeleteGroup) && (
                  <div className="flex shrink-0 items-center gap-2">
                    {onEditGroup && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditGroup(group)}
                        className="rounded-full border border-blue-400/30 text-blue-400 hover:bg-blue-400/10 hover:text-blue-300"
                        title="編集"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDeleteGroup && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteGroup(group)}
                        className="rounded-full border border-red-400/30 text-red-400 hover:bg-red-400/10 hover:text-red-300"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
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
