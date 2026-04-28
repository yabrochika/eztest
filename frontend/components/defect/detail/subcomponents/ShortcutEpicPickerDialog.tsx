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

interface ShortcutEpic {
  id: number;
  name: string;
  state?: string;
  app_url: string;
  archived?: boolean;
  completed?: boolean;
  started?: boolean;
}

interface Props {
  projectId: string;
  defectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinked: (epic: { id: number; name: string }) => void;
  /** Persist the selected epic to the defect via API. Defaults to true. */
  persistToDefect?: boolean;
}

export function ShortcutEpicPickerDialog({
  projectId,
  defectId,
  open,
  onOpenChange,
  onLinked,
  persistToDefect = true,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [epics, setEpics] = useState<ShortcutEpic[]>([]);
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/shortcut/epics');
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          throw new Error(data?.message || 'Failed to load epics');
        }
        const arr: ShortcutEpic[] = Array.isArray(data?.data) ? data.data : [];
        setEpics(arr);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return epics
      .filter((e) => (showArchived ? true : !e.archived))
      .filter((e) => {
        if (!q) return true;
        return (
          e.name.toLowerCase().includes(q) || String(e.id).includes(q)
        );
      })
      .slice(0, 300);
  }, [epics, query, showArchived]);

  const handleSelect = async (epic: ShortcutEpic) => {
    try {
      setSaving(epic.id);
      setError(null);
      if (persistToDefect) {
        const res = await fetch(
          `/api/projects/${projectId}/defects/${defectId}/shortcut/epic`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ epicId: epic.id }),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || 'Failed to set epic');
        }
      }
      onLinked({ id: epic.id, name: epic.name });
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="glass" className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Shortcut Epic を選択</DialogTitle>
          <DialogDescription>
            この Defect に紐づける Epic を選びます。選択すると情報欄に epic-ID とタイトルが表示されます。
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="名前または ID で検索"
              className="flex-1 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white/40"
            />
            <label className="flex items-center gap-1.5 text-xs text-white/70 whitespace-nowrap">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              アーカイブ含む
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
                <Loader text="Epic を読み込み中..." />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-white/50">
                Epic が見つかりません
              </div>
            ) : (
              filtered.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => handleSelect(e)}
                  disabled={saving !== null}
                  className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors flex items-center gap-3 disabled:opacity-50"
                >
                  <span className="font-mono text-xs text-blue-300 shrink-0 w-20">
                    epic-{e.id}
                  </span>
                  <span className="flex-1 text-sm text-white/90 truncate">
                    {e.name}
                  </span>
                  {e.state && (
                    <span className="text-[10px] uppercase tracking-wide text-white/50 shrink-0">
                      {e.state}
                    </span>
                  )}
                  {saving === e.id && (
                    <span className="text-xs text-white/60">設定中...</span>
                  )}
                </button>
              ))
            )}
          </div>
          <div className="text-[11px] text-white/40">
            {epics.length > 0 && `全 ${epics.length} 件中 ${filtered.length} 件表示`}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
