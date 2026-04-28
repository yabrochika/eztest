'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/frontend/reusable-elements/dialogs/Dialog';
import { Loader } from '@/frontend/reusable-elements/loaders/Loader';

interface ShortcutStory {
  id: number;
  name: string;
  story_type: 'feature' | 'bug' | 'chore';
  app_url: string;
  archived?: boolean;
  completed?: boolean;
}

interface Props {
  projectId: string;
  defectId: string;
  epicId: number;
  epicName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAttached: (result: { shortcutStoryId: number; shortcutStoryUrl: string }) => void;
}

export function ShortcutStoryPickerDialog({
  projectId,
  defectId,
  epicId,
  epicName,
  open,
  onOpenChange,
  onAttached,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [attaching, setAttaching] = useState<number | null>(null);
  const [stories, setStories] = useState<ShortcutStory[]>([]);
  const [query, setQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/shortcut/epics/${epicId}/stories`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data?.message || 'Failed to load stories');
        setStories(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, epicId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stories
      .filter((s) => (showCompleted ? true : !s.completed && !s.archived))
      .filter((s) => (q ? s.name.toLowerCase().includes(q) || String(s.id).includes(q) : true));
  }, [stories, query, showCompleted]);

  const handleAttach = async (s: ShortcutStory) => {
    const ok = window.confirm(
      `Story #${s.id}「${s.name}」の Sub-task としてこの Defect を作成します。\nBug ラベル付与・内容・添付ファイルを含む子ストーリーが追加されます。よろしいですか?`
    );
    if (!ok) return;
    try {
      setAttaching(s.id);
      setError(null);
      const res = await fetch(
        `/api/projects/${projectId}/defects/${defectId}/shortcut/stories/${s.id}/attach`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to attach defect to story');
      onAttached({
        shortcutStoryId: data?.data?.shortcutStoryId ?? s.id,
        shortcutStoryUrl: data?.data?.shortcutStoryUrl ?? s.app_url,
      });
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAttaching(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="glass" className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Story を選択 (epic-{epicId})</DialogTitle>
          <DialogDescription>
            {epicName ? `Epic: ${epicName} ` : ''}
            選んだ Story の Sub-task として、Bug ラベル付きで Defect の内容と添付ファイルを持つ子ストーリーを作成します。
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Story 名または ID で検索"
              className="flex-1 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/40"
            />
            <label className="flex items-center gap-1.5 text-xs text-white/70 whitespace-nowrap">
              <input
                type="checkbox"
                checked={!showCompleted}
                onChange={(e) => setShowCompleted(!e.target.checked)}
              />
              未完了のみ
            </label>
          </div>

          {error && (
            <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded px-2 py-1.5">
              {error}
            </div>
          )}

          <div className="max-h-[50vh] overflow-y-auto rounded-md border border-white/10 divide-y divide-white/10">
            {loading ? (
              <div className="py-10 flex justify-center">
                <Loader text="Story を読み込み中..." />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-white/50">
                Story が見つかりません
              </div>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleAttach(s)}
                  disabled={attaching !== null}
                  className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors flex items-center gap-3 disabled:opacity-50"
                >
                  <span className="font-mono text-xs text-blue-300 shrink-0 w-20">
                    #{s.id}
                  </span>
                  <span className="flex-1 text-sm text-white/90 truncate">{s.name}</span>
                  <span className="text-[10px] uppercase tracking-wide text-white/50 shrink-0">
                    {s.story_type}
                  </span>
                  {attaching === s.id && (
                    <span className="text-xs text-white/60">添付中...</span>
                  )}
                </button>
              ))
            )}
          </div>
          <div className="text-[11px] text-white/40">
            {stories.length > 0 && `全 ${stories.length} 件中 ${filtered.length} 件表示`}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
