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
import { Label } from '@/frontend/reusable-elements/labels/Label';
import { Textarea } from '@/frontend/reusable-elements/textareas/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/frontend/reusable-elements/selects/Select';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { TestResult } from '../types';

/** ステータスを「変更しない」ことを表す Select 値（空文字 / 'none' は Select コンポーネントの仕様で予約されているため別値を使う） */
const STATUS_NO_CHANGE = '__KEEP__';

export interface BulkUpdateResultsDialogProps {
  open: boolean;
  /** 一括対象の TestResult 配列。コメント追記時の既存コメント参照に使う。 */
  selectedResults: TestResult[];
  /** 送信中フラグ（外部から制御） */
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * 一括適用処理。テストケース毎に必要なペイロードを生成して呼び出す。
   * - status が undefined の時はステータス据え置き（既存値）を送る
   * - newComment が undefined の時はコメント据え置き（既存値）を送る
   *   ※API は status 必須、comment は任意のため、呼び出し側で結合する
   */
  onSubmit: (payload: {
    status?: string;
    /** 追記モード時に入力されたコメント本文（空文字なら何も追記しない） */
    appendComment: string;
  }) => Promise<void>;
}

/**
 * テストランの複数テストケースに対して、ステータス変更とコメント追記を
 * 一括適用するためのモーダル。
 *
 * - ステータス: 「変更しない」を含む選択肢から1つ選ぶ
 * - コメント: 既存コメントの末尾に追記する（空欄なら何も追記しない）
 * - 少なくとも片方は変更する必要がある（バリデーション）
 */
export function BulkUpdateResultsDialog({
  open,
  selectedResults,
  loading = false,
  onOpenChange,
  onSubmit,
}: BulkUpdateResultsDialogProps) {
  const { options: statusOptions, loading: loadingStatusOptions } =
    useDropdownOptions('TestResult', 'status');

  const [status, setStatus] = useState<string>(STATUS_NO_CHANGE);
  const [appendComment, setAppendComment] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // ダイアログを閉じたらフォーム状態をリセット
  useEffect(() => {
    if (!open) {
      setStatus(STATUS_NO_CHANGE);
      setAppendComment('');
      setError(null);
    }
  }, [open]);

  const selectedCount = selectedResults.length;

  // プレビュー用: 「コメントが既に入っている件数」など
  const existingCommentCount = useMemo(
    () => selectedResults.filter((r) => (r.comment || '').trim().length > 0).length,
    [selectedResults]
  );

  const handleSubmit = async () => {
    setError(null);
    const trimmedComment = appendComment.trim();
    const hasStatusChange = status !== STATUS_NO_CHANGE;
    const hasCommentChange = trimmedComment.length > 0;

    if (!hasStatusChange && !hasCommentChange) {
      setError('ステータス変更とコメント追記の少なくとも一方を指定してください');
      return;
    }
    if (selectedCount === 0) {
      setError('対象のテストケースが選択されていません');
      return;
    }

    try {
      await onSubmit({
        status: hasStatusChange ? status : undefined,
        appendComment: trimmedComment,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '一括更新に失敗しました');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>選択したテストケースを一括更新</DialogTitle>
          <DialogDescription>
            選択中の {selectedCount} 件のテストケースについて、ステータス変更とコメント追記を一括で適用します。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-status">ステータス</Label>
            <Select value={status} onValueChange={setStatus} disabled={loading || loadingStatusOptions}>
              <SelectTrigger id="bulk-status" variant="glass">
                <SelectValue placeholder="ステータスを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_NO_CHANGE}>変更しない</SelectItem>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-comment">コメント（追記）</Label>
            <Textarea
              id="bulk-comment"
              variant="glass"
              value={appendComment}
              onChange={(e) => setAppendComment(e.target.value)}
              placeholder="入力した内容を、選択中の全テストケースの既存コメント末尾に追記します"
              rows={4}
              maxLength={2000}
              disabled={loading}
            />
            {existingCommentCount > 0 && (
              <p className="text-xs text-white/60 inline-flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {existingCommentCount} 件のテストケースには既存コメントがあります。追記モードのため上書きされません。
              </p>
            )}
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
            buttonName="Bulk Update Results Dialog - Cancel"
          >
            キャンセル
          </Button>
          <ButtonPrimary
            onClick={handleSubmit}
            disabled={loading || selectedCount === 0}
            className="cursor-pointer"
            buttonName="Bulk Update Results Dialog - Apply"
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
