'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/frontend/reusable-elements/dialogs/Dialog';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { ButtonPrimary } from '@/frontend/reusable-elements/buttons/ButtonPrimary';
import { Input } from '@/frontend/reusable-elements/inputs/Input';
import { Checkbox } from '@/frontend/reusable-elements/checkboxes/Checkbox';
import { ProjectMember, ProjectMemberGroup } from '../types';

interface CreateMemberGroupDialogProps {
  projectId: string;
  members: ProjectMember[];
  triggerOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated: (group: ProjectMemberGroup) => void;
}

export function CreateMemberGroupDialog({
  projectId,
  members,
  triggerOpen,
  onOpenChange,
  onGroupCreated,
}: CreateMemberGroupDialogProps) {
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return members;
    }

    return members.filter((member) => {
      return (
        member.user.name.toLowerCase().includes(keyword) ||
        member.user.email.toLowerCase().includes(keyword)
      );
    });
  }, [members, search]);

  const resetForm = () => {
    setGroupName('');
    setSearch('');
    setSelectedMemberIds([]);
    setError('');
    setSubmitting(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleCreateGroup = async () => {
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/projects/${projectId}/member-groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName,
          memberIds: selectedMemberIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create member group');
      }

      onGroupCreated(data.data as ProjectMemberGroup);
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'グループ作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={triggerOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>グループを作成</DialogTitle>
          <DialogDescription>
            グループ名を設定して、所属させるメンバーを選択してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="例: バックエンドチーム"
            variant="glass"
            maxLength={100}
          />

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="メンバー名・メールで絞り込み"
            variant="glass"
          />

          <div className="max-h-64 overflow-y-auto rounded-xl border border-white/15 bg-white/5 p-2">
            {filteredMembers.length === 0 ? (
              <p className="px-3 py-4 text-sm text-white/60">該当するメンバーがいません</p>
            ) : (
              <div className="space-y-1">
                {filteredMembers.map((member) => (
                  <label
                    key={member.id}
                    htmlFor={`group-member-${member.id}`}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-white/10"
                  >
                    <Checkbox
                      id={`group-member-${member.id}`}
                      checked={selectedMemberIds.includes(member.id)}
                      onCheckedChange={() => toggleMember(member.id)}
                      variant="glass"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white/90">{member.user.name}</p>
                      <p className="truncate text-xs text-white/60">{member.user.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="glass" onClick={() => handleOpenChange(false)} disabled={submitting}>
            キャンセル
          </Button>
          <ButtonPrimary
            onClick={handleCreateGroup}
            disabled={submitting || groupName.trim().length === 0 || selectedMemberIds.length === 0}
          >
            {submitting ? '作成中...' : `作成 (${selectedMemberIds.length})`}
          </ButtonPrimary>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
