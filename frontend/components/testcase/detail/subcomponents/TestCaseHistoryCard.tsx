'use client';

import { useEffect, useState } from 'react';
import { formatDateTime } from '@/lib/date-utils';
import { DetailCard } from '@/frontend/reusable-components/cards/DetailCard';
import { Badge } from '@/frontend/reusable-elements/badges/Badge';
import { Loader } from '@/frontend/reusable-elements/loaders/Loader';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Circle,
  Calendar,
  User,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { getDynamicBadgeProps } from '@/lib/badge-color-utils';
import { AttachmentDisplay } from '@/frontend/reusable-components/attachments/AttachmentDisplay';
import type { Attachment } from '@/lib/s3';
import { ViewResultDialog } from '@/frontend/components/testrun/detail/subcomponents/ViewResultDialog';
import type { TestResult as TestRunTestResult } from '@/frontend/components/testrun/detail/types';

interface TestResultAttachment {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string | Date;
  fieldName?: string | null;
}

interface TestResult {
  id: string;
  status: string;
  comment?: string;
  duration?: number;
  executedAt: string;
  executedBy: {
    name: string;
    email: string;
    avatar?: string | null;
  };
  testRun: {
    id: string;
    name: string;
    environment?: string;
  };
  attachments?: TestResultAttachment[];
}

interface TestCaseSummary {
  id: string;
  title?: string;
  tcId?: string;
  rtcId?: string | null;
}

interface TestCaseHistoryCardProps {
  testCaseId: string;
  testCase?: TestCaseSummary;
}

export function TestCaseHistoryCard({ testCaseId, testCase }: TestCaseHistoryCardProps) {
  const [history, setHistory] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingResult, setViewingResult] = useState<TestRunTestResult | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const { options: statusOptions } = useDropdownOptions('TestResult', 'status');
  const { options: environmentOptions } = useDropdownOptions('TestRun', 'environment');

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testCaseId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/testcases/${testCaseId}/history`);
      const data = await response.json();
      if (data.data) {
        setHistory(data.data);
      }
    } catch (error) {
      console.error('Error fetching test case history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASSED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'BLOCKED':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'SKIPPED':
      case 'NOT_STARTED':
        return <Circle className="w-4 h-4 text-gray-500" />;
      case 'RETEST':
        return <AlertCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const mapAttachments = (atts?: TestResultAttachment[]): Attachment[] =>
    (atts || []).map((a) => ({
      id: a.id,
      filename: a.filename,
      originalName: a.originalName,
      size: a.size,
      mimeType: a.mimeType,
      uploadedAt:
        typeof a.uploadedAt === 'string'
          ? a.uploadedAt
          : new Date(a.uploadedAt).toISOString(),
      fieldName: a.fieldName || 'comment',
      entityType: 'testresult' as const,
    }));

  /** 結果モーダルを開くべき行か（NOT_STARTED の行はクリックしても表示する内容がない） */
  const isExecutedRow = (row: TestResult): boolean => {
    if (!row.status || row.status === 'NOT_STARTED') return false;
    return true;
  };

  const handleRowClick = (row: TestResult) => {
    if (!isExecutedRow(row)) return;
    const viewResult: TestRunTestResult = {
      id: row.id,
      status: row.status as TestRunTestResult['status'],
      testCaseId,
      testCase: {
        id: testCase?.id || testCaseId,
        title: testCase?.title,
        tcId: testCase?.tcId,
        rtcId: testCase?.rtcId ?? null,
        priority: '',
        status: '',
      },
      comment: row.comment,
      duration: row.duration,
      executedAt: row.executedAt,
      executedBy: row.executedBy
        ? {
            name: row.executedBy.name,
            email: row.executedBy.email,
            avatar: row.executedBy.avatar ?? null,
          }
        : undefined,
      attachments: (row.attachments || []).map((a) => ({
        id: a.id,
        filename: a.filename,
        originalName: a.originalName,
        size: a.size,
        mimeType: a.mimeType,
        fieldName: a.fieldName,
        uploadedAt:
          typeof a.uploadedAt === 'string'
            ? a.uploadedAt
            : new Date(a.uploadedAt).toISOString(),
      })),
    };
    setViewingResult(viewResult);
    setViewDialogOpen(true);
  };

  return (
    <DetailCard title="Execution History" contentClassName="">
      {loading ? (
        <div className="py-8 flex justify-center">
          <Loader fullScreen={false} text="Loading history..." />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-white/60 text-sm">No execution history yet</p>
          <p className="text-white/40 text-xs mt-1">
            This test case hasn&apos;t been executed in any test run
          </p>
        </div>
      ) : (
        <div className="w-full min-w-0 overflow-hidden space-y-0">
          {/* Header Row */}
          <div
            className="grid gap-3 px-3 py-2 text-xs font-semibold text-white/60 border-b border-white/10 rounded-t-md"
            style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr' }}
          >
            <div>Status</div>
            <div>Test Run</div>
            <div>Executed By</div>
            <div>Date</div>
            <div className="text-right">Duration</div>
          </div>

          {history.map((row, idx) => {
            const statusBadge = getDynamicBadgeProps(row.status, statusOptions);
            const envBadge = row.testRun.environment
              ? getDynamicBadgeProps(row.testRun.environment, environmentOptions)
              : null;
            const envLabel = row.testRun.environment
              ? environmentOptions.find((o) => o.value === row.testRun.environment)?.label ||
                row.testRun.environment.toUpperCase()
              : null;
            const attachments = mapAttachments(row.attachments);
            const hasComment = !!row.comment && row.comment.trim().length > 0;
            const hasAttachments = attachments.length > 0;
            const clickable = isExecutedRow(row);

            return (
              <div
                key={row.id}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? () => handleRowClick(row) : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleRowClick(row);
                        }
                      }
                    : undefined
                }
                className={`px-3 py-2.5 text-sm rounded-sm transition-colors ${
                  clickable ? 'cursor-pointer hover:bg-accent/20' : ''
                } ${
                  idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.04] border-b border-white/10'
                } ${idx === history.length - 1 ? 'rounded-b-md' : ''}`}
              >
                <div
                  className="grid gap-3 items-center"
                  style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr' }}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(row.status)}
                    <Badge
                      variant="outline"
                      className={`text-xs ${statusBadge.className}`}
                      style={statusBadge.style}
                    >
                      {row.status}
                    </Badge>
                  </div>
                  <div className="min-w-0 max-w-[150px] overflow-hidden">
                    <p className="text-sm text-white/90 font-medium truncate block">
                      {row.testRun.name}
                    </p>
                    {envBadge && envLabel && (
                      <Badge
                        variant="outline"
                        className={`text-xs mt-1 ${envBadge.className}`}
                        style={envBadge.style}
                      >
                        {envLabel}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/70 min-w-0">
                    <User className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{row.executedBy.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/70">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDateTime(row.executedAt)}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1 text-xs text-white/70">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(row.duration) || '-'}</span>
                  </div>
                </div>

                {(hasComment || hasAttachments) && (
                  <div className="mt-2 ml-1 pl-3 border-l-2 border-white/10 space-y-2">
                    {hasComment && (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-white/40 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-white/80 whitespace-pre-wrap break-words">
                          {row.comment}
                        </p>
                      </div>
                    )}
                    {hasAttachments && (
                      <div className="pl-5">
                        <AttachmentDisplay
                          attachments={attachments}
                          showPreview
                          showDelete={false}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ViewResultDialog
        open={viewDialogOpen}
        onOpenChange={(open) => {
          setViewDialogOpen(open);
          if (!open) setViewingResult(null);
        }}
        result={viewingResult}
      />
    </DetailCard>
  );
}
