'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/frontend/reusable-elements/dialogs/Dialog';

interface Props {
  projectId: string;
  defectId: string;
  /** Default epic name to prefill the input with (usually the defect title). */
  defaultName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (result: {
    shortcutStoryId: number;
    shortcutStoryUrl: string;
    shortcutEpicId: number;
    shortcutEpicName: string | null;
  }) => void;
}

export function CreateShortcutEpicDialog({
  projectId,
  defectId,
  defaultName,
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const [name, setName] = useState(defaultName);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the name to the current default each time the dialog opens.
  useEffect(() => {
    if (open) {
      setName(defaultName);
      setError(null);
    }
  }, [open, defaultName]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Epic 名を入力してください');
      return;
    }
    try {
      setCreating(true);
      setError(null);
      const res = await fetch(
        `/api/projects/${projectId}/defects/${defectId}/shortcut/epic/create`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to create Shortcut epic');
      onCreated({
        shortcutStoryId: data?.data?.shortcutStoryId,
        shortcutStoryUrl: data?.data?.shortcutStoryUrl,
        shortcutEpicId: data?.data?.shortcutEpicId,
        shortcutEpicName: data?.data?.shortcutEpicName ?? trimmed,
      });
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="glass" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Shortcut Epic を新規作成</DialogTitle>
          <DialogDescription>
            新しい Epic を作成し、その配下に Bug ラベル付きで Defect の内容と添付ファイルを持つ
            Story を作成します。
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Epic 名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !creating) {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder="新しい Epic の名前"
              autoFocus
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/40"
            />
          </div>

          {error && (
            <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded px-2 py-1.5">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={creating}
              className="text-xs font-medium text-white/70 hover:text-white border border-white/15 rounded-md px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 shadow-md shadow-indigo-500/30 border border-white/20 rounded-md px-3 py-1.5 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              {creating ? '作成中...' : 'Epic を作成'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
