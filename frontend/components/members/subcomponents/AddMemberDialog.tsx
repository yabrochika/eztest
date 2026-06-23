'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { Loader } from '@/frontend/reusable-elements/loaders/Loader';
import { ProjectMember } from '../types';

interface SelectableUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface CreateAddMemberDialogProps {
  projectId: string;
  /** Members already belonging to this project (used to exclude them from the list). */
  existingMembers: ProjectMember[];
  triggerOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onMembersAdded: (members: ProjectMember[]) => void;
}

export function CreateAddMemberDialog({
  projectId,
  existingMembers,
  triggerOpen,
  onOpenChange,
  onMembersAdded,
}: CreateAddMemberDialogProps) {
  const [users, setUsers] = useState<SelectableUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const existingUserIds = useMemo(
    () => new Set(existingMembers.map((member) => member.user.id)),
    [existingMembers]
  );

  useEffect(() => {
    if (!triggerOpen) {
      return;
    }

    let cancelled = false;

    const fetchUsers = async () => {
      setLoadingUsers(true);
      setError('');
      try {
        const response = await fetch('/api/users');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.message || 'ユーザーの取得に失敗しました');
        }

        if (!cancelled) {
          setUsers((data.data || []) as SelectableUser[]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'ユーザーの取得に失敗しました');
        }
      } finally {
        if (!cancelled) {
          setLoadingUsers(false);
        }
      }
    };

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [triggerOpen]);

  // Only show users who are not already members of this project.
  const selectableUsers = useMemo(
    () => users.filter((user) => !existingUserIds.has(user.id)),
    [users, existingUserIds]
  );

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return selectableUsers;
    }

    return selectableUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
    );
  }, [selectableUsers, search]);

  const resetForm = () => {
    setSearch('');
    setSelectedUserIds([]);
    setError('');
    setSubmitting(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange?.(open);
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddMembers = async () => {
    setSubmitting(true);
    setError('');

    const addedMembers: ProjectMember[] = [];
    const failures: string[] = [];

    for (const userId of selectedUserIds) {
      try {
        const response = await fetch(`/api/projects/${projectId}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.message || 'メンバーの追加に失敗しました');
        }

        addedMembers.push(data.data as ProjectMember);
      } catch (err) {
        const user = users.find((candidate) => candidate.id === userId);
        const label = user?.name || user?.email || userId;
        failures.push(`${label}: ${err instanceof Error ? err.message : '追加に失敗しました'}`);
      }
    }

    if (addedMembers.length > 0) {
      onMembersAdded(addedMembers);
    }

    if (failures.length > 0) {
      setError(failures.join('\n'));
      setSelectedUserIds((prev) =>
        prev.filter((id) => !addedMembers.some((member) => member.user.id === id))
      );
      setSubmitting(false);
      return;
    }

    handleOpenChange(false);
  };

  return (
    <Dialog open={triggerOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>プロジェクトメンバーを追加</DialogTitle>
          <DialogDescription>
            追加するメンバーをチェックボックスで選択してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="名前・メールで絞り込み"
            variant="glass"
          />

          <div className="max-h-72 overflow-y-auto rounded-xl border border-white/15 bg-white/5 p-2">
            {loadingUsers ? (
              <div className="py-8">
                <Loader text="ユーザーを読み込み中..." />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="px-3 py-4 text-sm text-white/60">
                {selectableUsers.length === 0
                  ? '追加できるユーザーがいません'
                  : '該当するユーザーがいません'}
              </p>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map((user) => (
                  <label
                    key={user.id}
                    htmlFor={`add-member-${user.id}`}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-white/10"
                  >
                    <Checkbox
                      id={`add-member-${user.id}`}
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={() => toggleUser(user.id)}
                      variant="glass"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white/90">{user.name}</p>
                      <p className="truncate text-xs text-white/60">{user.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="whitespace-pre-line rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="glass" onClick={() => handleOpenChange(false)} disabled={submitting}>
            キャンセル
          </Button>
          <ButtonPrimary
            onClick={handleAddMembers}
            disabled={submitting || selectedUserIds.length === 0}
          >
            {submitting ? '追加中...' : `追加 (${selectedUserIds.length})`}
          </ButtonPrimary>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { CreateAddMemberDialogProps };
