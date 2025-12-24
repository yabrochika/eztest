'use client';

import { MembersList } from '@/frontend/reusable-components/users/MembersList';
import { Users } from 'lucide-react';
import { ProjectMember } from '../types';

interface MembersCardProps {
  members: ProjectMember[];
  isAdminOrManager: boolean;
  onRemoveMember: (memberId: string, memberName: string) => void;
}

export function MembersCard({ members, isAdminOrManager, onRemoveMember }: MembersCardProps) {
  return (
    <MembersList
      members={members.map((member) => ({
        id: member.id,
        user: {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          avatar: member.user.avatar,
          role: member.user.role,
        },
        createdAt: member.joinedAt,
      }))}
      title={`Project Members (${members.length})`}
      description="People who have access to this project"
      emptyTitle="No members yet"
      emptyDescription={isAdminOrManager ? 'Add project members to collaborate on this project' : 'Waiting for project manager or admin to add members'}
      emptyIcon={Users}
      onDelete={isAdminOrManager ? onRemoveMember : undefined}
      showProjects={false}
    />
  );
}
