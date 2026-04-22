import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/frontend/reusable-elements/dialogs/Dialog';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/frontend/reusable-elements/avatars/Avatar';
import { AttachmentDisplay } from '@/frontend/reusable-components/attachments/AttachmentDisplay';
import { formatDateTime } from '@/lib/date-utils';
import { getDynamicBadgeProps } from '@/lib/badge-color-utils';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { Timer } from 'lucide-react';
import type { TestResult } from '../types';
import type { Attachment } from '@/lib/s3';

interface ViewResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: TestResult | null;
}

/**
 * テストラン内の実行済みテストケースをクリックしたときに、記録された結果
 * （ステータス・コメント・添付ファイル・実行者・実行日時・実行時間）を読み取り専用で表示する。
 * ステータスに関わらず（Passed / Failed / Blocked / Skipped / Retest など）利用可能。
 */
export function ViewResultDialog({ open, onOpenChange, result }: ViewResultDialogProps) {
  const { options: statusOptions, loading: loadingStatus } = useDropdownOptions('TestResult', 'status');

  if (!result) {
    return null;
  }

  const statusBadge = getDynamicBadgeProps(result.status, statusOptions);
  const statusLabel = !loadingStatus && statusOptions.length > 0
    ? statusOptions.find((opt) => opt.value === result.status)?.label || result.status
    : result.status;

  const attachments: Attachment[] = (result.attachments || []).map((a) => ({
    id: a.id,
    filename: a.filename,
    originalName: a.originalName,
    size: a.size,
    mimeType: a.mimeType,
    uploadedAt: typeof a.uploadedAt === 'string' ? a.uploadedAt : new Date(a.uploadedAt).toISOString(),
    fieldName: a.fieldName || 'comment',
    entityType: 'testresult' as const,
  }));

  const formatDuration = (t?: number) => {
    if (t == null || !Number.isFinite(t)) return '-';
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const user = result.executedBy;
  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((part) => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '';

  const testCaseName = result.testCase?.title || result.testCase?.name || '';
  const tcId = result.testCase?.tcId;
  const rtcId = result.testCase?.rtcId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh]">
        <DialogHeader className="mb-4 flex-shrink-0">
          <DialogTitle>テスト結果</DialogTitle>
          <DialogDescription>{testCaseName}</DialogDescription>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {tcId && (
              <span className="text-xs font-mono text-white/60">TC-ID: {tcId}</span>
            )}
            {rtcId && (
              <span className="text-xs font-mono text-white/60">RTC-ID: {rtcId}</span>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar space-y-4">
          {/* ステータス */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-white/40">結果ステータス</p>
            <Badge
              variant="outline"
              className={`text-xs px-2 py-0.5 ${statusBadge.className}`}
              style={statusBadge.style}
            >
              {statusLabel}
            </Badge>
          </div>

          {/* 実行者・日時・時間 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg bg-white/5 border border-white/10 p-3">
            <div>
              <p className="text-xs font-medium text-white/40 mb-1">実行者</p>
              {user?.name ? (
                <div className="flex items-center gap-2">
                  <Avatar className="size-7">
                    {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
                    <AvatarFallback className="text-[10px]">{initials || '?'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-white/80 truncate">{user.name}</span>
                </div>
              ) : (
                <span className="text-sm text-white/50">-</span>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-white/40 mb-1">実行日時</p>
              <span className="text-sm text-white/80">
                {result.executedAt ? formatDateTime(result.executedAt) : '-'}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-white/40 mb-1">実行時間</p>
              <span className="text-sm text-white/80 font-mono inline-flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-white/50" />
                {formatDuration(result.duration)}
              </span>
            </div>
          </div>

          {/* コメント */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-white/40">コメント</p>
            {result.comment ? (
              <p className="text-sm text-white/80 whitespace-pre-wrap bg-white/5 border border-white/10 rounded p-3">
                {result.comment}
              </p>
            ) : (
              <p className="text-sm text-white/50 italic bg-white/5 border border-white/10 rounded p-3">
                コメントはありません
              </p>
            )}
          </div>

          {/* 添付ファイル */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-white/40">
              添付ファイル（{attachments.length} 件）
            </p>
            {attachments.length > 0 ? (
              <div className="bg-white/5 border border-white/10 rounded p-3">
                <AttachmentDisplay
                  attachments={attachments}
                  showPreview
                  showDelete={false}
                />
              </div>
            ) : (
              <p className="text-sm text-white/50 italic bg-white/5 border border-white/10 rounded p-3">
                添付ファイルはありません
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button
            variant="glass"
            onClick={() => onOpenChange(false)}
            buttonName="View Test Result Dialog - Close"
          >
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
