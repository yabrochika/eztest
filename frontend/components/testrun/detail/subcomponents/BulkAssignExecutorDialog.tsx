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
import { Label } from '@/frontend/reusable-elements/labels/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/frontend/reusable-elements/selects/Select';
import { Loader2 } from 'lucide-react';

interface ExecutorOption {
  id: string;
  name: string;
  email: string;
}

export interface BulkAssignExecutorDialogProps {
  open: boolean;
  /** 一括対象のテストケース件数（表示用） */
  selectedCount: number;
  /** プロジェクトメンバー取得用 */
  projectId: string;
  /** 送信中フラグ（外部から制御） */
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  /** 選択中の全テストケースに実行者を一括登録する */
  onSubmit: (payload: { executedById: string }) => Promise<void>;
}

/**
 * テストランの複数テストケースに対して、実行者（担当者）を一括登録するためのモーダル。
 *
 * - 実行者: プロジェクトメンバーから1人選ぶ
 * - 適用すると選択中の全テストケースの実行者が上書きされる
 */
export function BulkAssignExecutorDialog({
  open,
  selectedCount,
  projectId,
  loading = false,
  onOpenChange,
  onSubmit,
}: BulkAssignExecutorDialogProps) {
  const [executorOptions, setExecutorOptions] = useState<ExecutorOption[]>([]);
  const [loadingExecutors, setLoadingExecutors] = useState(false);
  const [executedById, setExecutedById] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // ダイアログを閉じたらフォーム状態をリセット
  useEffect(() => {
    if (!open) {
      setExecutedById('');
      setError(null);
    }
  }, [open]);

  // プロジェクトメンバーを取得（実行者の選択肢）
  useEffect(() => {
    if (!open || !projectId) return;
    let cancelled = false;
    const fetchMembers = async () => {
      setLoadingExecutors(true);
      try {
        const response = await fetch(`/api/projects/${projectId}/members`);
        if (!response.ok) return;
        const data = await response.json();
        const members: Array<{ user: { id: string; name?: string | null; email: string } }> =
          data.data || [];
        if (cancelled) return;
        setExecutorOptions(
          members.map((m) => ({
            id: m.user.id,
            name: m.user.name || m.user.email,
            email: m.user.email,
          }))
        );
      } catch {
        // メンバー取得に失敗してもダイアログ自体は使えるようにフォールバック
      } finally {
        if (!cancelled) setLoadingExecutors(false);
      }
    };
    fetchMembers();
    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  const handleSubmit = async () => {
    setError(null);
    if (!executedById) {
      setError('実行者を選択してください');
      return;
    }
    if (selectedCount === 0) {
      setError('対象のテストケースが選択されていません');
      return;
    }

    try {
      await onSubmit({ executedById });
    } catch (e) {
      setError(e instanceof Error ? e.message : '実行者の一括変更に失敗しました');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>実行者を一括変更</DialogTitle>
          <DialogDescription>
            選択中の {selectedCount} 件に、同じ実行者を設定します。すでに実行者がいる場合は上書きされます。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-executor">実行者</Label>
            <Select
              value={executedById}
              onValueChange={setExecutedById}
              disabled={loading || loadingExecutors}
            >
              <SelectTrigger id="bulk-executor" variant="glass">
                <SelectValue placeholder="実行者を選択" />
              </SelectTrigger>
              <SelectContent>
                {loadingExecutors ? (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-white/50">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    メンバーを読み込み中...
                  </div>
                ) : executorOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-white/50">
                    プロジェクトメンバーが見つかりません
                  </div>
                ) : (
                  executorOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <span>{option.name}</span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="glass"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
            disabled={loading}
            buttonName="Bulk Assign Executor Dialog - Cancel"
          >
            キャンセル
          </Button>
          <ButtonPrimary
            onClick={handleSubmit}
            disabled={loading || selectedCount === 0 || !executedById}
            className="cursor-pointer"
            buttonName="Bulk Assign Executor Dialog - Apply"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                適用中...
              </>
            ) : (
              `${selectedCount} 件に適用`
            )}
          </ButtonPrimary>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
