'use client';

import { useEffect, useState } from 'react';
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
import { Loader } from '@/frontend/reusable-elements/loaders/Loader';
import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import { ShortcutEpicPickerDialog } from './ShortcutEpicPickerDialog';
import { ShortcutStoryPickerDialog } from './ShortcutStoryPickerDialog';
import {
  extractEpicId,
  resolveShortcutId,
} from './shortcutEpicDetect';

interface LinkedDefect {
  id: string;
  defectId: string;
  title: string;
  status: string;
  severity?: string | null;
  priority?: string | null;
}

interface Props {
  projectId: string;
  testCase: {
    id: string;
    tcId?: string;
    title?: string;
    testCaseSuites?: Array<{ testSuite: { id: string; name: string } }>;
  };
  /** Extra hints for Epic id auto-detection (e.g. TestRun.name). */
  extraEpicHints?: Array<string | null | undefined>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (result: { shortcutStoryId: number; shortcutStoryUrl: string }) => void;
  /** Optional: triggered when the user clicks the "欠陥を作成" shortcut (0-defect state). */
  onRequestCreateDefect?: () => void;
}

export function CreateShortcutStoryFromTestCaseDialog({
  projectId,
  testCase,
  extraEpicHints = [],
  open,
  onOpenChange,
  onCreated,
  onRequestCreateDefect,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defects, setDefects] = useState<LinkedDefect[]>([]);
  const [selectedDefect, setSelectedDefect] = useState<LinkedDefect | null>(null);
  const [resolving, setResolving] = useState(false);
  const [epicPickerOpen, setEpicPickerOpen] = useState(false);
  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const [resolvedEpic, setResolvedEpic] =
    useState<{ id: number; name: string | null } | null>(null);
  // When only one defect is linked, we skip the intermediate picker entirely
  // and render only the downstream Story/Epic picker, mirroring the flow from
  // the Defect page (which goes straight to the Story picker).
  const [autoFlow, setAutoFlow] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedDefect(null);
      setResolvedEpic(null);
      setEpicPickerOpen(false);
      setStoryDialogOpen(false);
      setAutoFlow(false);
      setError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/testcases/${testCase.id}/defects`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data?.message || '欠陥の取得に失敗しました');
        const list: LinkedDefect[] = Array.isArray(data?.data) ? data.data : [];
        setDefects(list);
        if (list.length === 1) {
          setAutoFlow(true);
          void startEpicResolution(list[0]);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, testCase.id]);

  const startEpicResolution = async (defect: LinkedDefect) => {
    setSelectedDefect(defect);
    setError(null);

    const suiteStrings = (testCase.testCaseSuites || []).flatMap((s) => [
      s.testSuite?.name,
    ]);
    const hint = extractEpicId(
      defect.title,
      testCase.title,
      testCase.tcId,
      ...suiteStrings,
      ...extraEpicHints
    );

    if (!hint) {
      setEpicPickerOpen(true);
      return;
    }

    try {
      setResolving(true);
      const resolved = await resolveShortcutId(hint);
      if (resolved.kind === 'epic' && resolved.epicId) {
        setResolvedEpic({ id: resolved.epicId, name: resolved.epicName });
        setStoryDialogOpen(true);
        return;
      }
      if (resolved.kind === 'story' && resolved.epicId) {
        setResolvedEpic({ id: resolved.epicId, name: resolved.epicName });
        setStoryDialogOpen(true);
        return;
      }
      setEpicPickerOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setEpicPickerOpen(true);
    } finally {
      setResolving(false);
    }
  };

  const handleEpicPicked = (epic: { id: number; name: string | null }) => {
    setResolvedEpic(epic);
    setEpicPickerOpen(false);
    setStoryDialogOpen(true);
  };

  const handleAttached = (result: {
    shortcutStoryId: number;
    shortcutStoryUrl: string;
  }) => {
    onCreated?.(result);
    setStoryDialogOpen(false);
    onOpenChange(false);
  };

  const renderBody = () => {
    if (loading) {
      return (
        <div className="py-10 flex justify-center">
          <Loader text="欠陥を読み込み中..." />
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded px-2 py-1.5">
          {error}
        </div>
      );
    }
    if (defects.length === 0) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-white/70">
            このテストケースに紐づく欠陥がありません。Shortcut Story を作るには、先に欠陥を作成してください。
          </p>
          {onRequestCreateDefect && (
            <ButtonPrimary
              onClick={() => {
                onOpenChange(false);
                onRequestCreateDefect();
              }}
              buttonName="Shortcut - Create Defect Shortcut"
            >
              欠陥を作成する
            </ButtonPrimary>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <p className="text-sm text-white/70">
          Shortcut Sub-task の元になる欠陥を選択してください。
        </p>
        <div className="max-h-[45vh] overflow-y-auto rounded-md border border-white/10 divide-y divide-white/10">
          {defects.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => startEpicResolution(d)}
              disabled={resolving}
              className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors flex items-center gap-3 disabled:opacity-50"
            >
              <span className="font-mono text-xs text-blue-300 shrink-0 w-20">
                {d.defectId}
              </span>
              <span className="flex-1 text-sm text-white/90 truncate">
                {d.title}
              </span>
              <Badge variant="outline" className="text-[10px] uppercase shrink-0">
                {d.status}
              </Badge>
              {resolving && selectedDefect?.id === d.id && (
                <span className="text-xs text-white/60">判定中...</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // In auto-flow the outer defect picker is a transient shell that the user
  // should never see. We still mount it (to keep local state alive while the
  // downstream picker is open) but hide the outer dialog entirely.
  const showOuterDialog = open && !autoFlow;

  const handleDownstreamOpenChange = (nextOpen: boolean) => {
    if (nextOpen) return;
    // Closing the downstream picker in auto-flow should unwind the whole
    // flow since there's no meaningful state to fall back to.
    if (autoFlow) {
      onOpenChange(false);
    }
  };

  return (
    <>
      {showOuterDialog && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent variant="glass" className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Shortcut Story を作成</DialogTitle>
              <DialogDescription>
                {testCase.tcId ? `${testCase.tcId} ` : ''}
                {testCase.title || 'テストケース'}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">{renderBody()}</div>
            <DialogFooter className="mt-4">
              <Button
                variant="glass"
                onClick={() => onOpenChange(false)}
                buttonName="Shortcut - Close TestCase Picker"
              >
                閉じる
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedDefect && (
        <ShortcutEpicPickerDialog
          projectId={projectId}
          defectId={selectedDefect.id}
          open={epicPickerOpen}
          onOpenChange={(o) => {
            setEpicPickerOpen(o);
            handleDownstreamOpenChange(o);
          }}
          persistToDefect={false}
          onLinked={(epic) => handleEpicPicked({ id: epic.id, name: epic.name })}
        />
      )}

      {selectedDefect && resolvedEpic && (
        <ShortcutStoryPickerDialog
          projectId={projectId}
          defectId={selectedDefect.id}
          epicId={resolvedEpic.id}
          epicName={resolvedEpic.name}
          open={storyDialogOpen}
          onOpenChange={(o) => {
            setStoryDialogOpen(o);
            handleDownstreamOpenChange(o);
          }}
          onAttached={handleAttached}
        />
      )}
    </>
  );
}
