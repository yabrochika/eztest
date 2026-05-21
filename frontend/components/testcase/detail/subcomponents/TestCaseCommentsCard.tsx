'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Maximize2 } from 'lucide-react';
import { DetailCard } from '@/frontend/reusable-components/cards/DetailCard';
import { MediaPreviewModal } from '@/frontend/reusable-components/dialogs/MediaPreviewModal';
import {
  TextareaWithAttachments,
  Attachment as TextareaAttachment,
} from '@/frontend/reusable-elements/textareas/TextareaWithAttachments';
import { ButtonPrimary } from '@/frontend/reusable-elements/buttons/ButtonPrimary';
import { AttachmentDisplay } from '@/frontend/reusable-components/attachments/AttachmentDisplay';
import { uploadFileToS3 } from '@/lib/s3';

interface PendingAttachment extends TextareaAttachment {
  _pendingFile?: File;
}

interface CommentAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  fieldName?: string | null;
}

interface TestCaseComment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  attachments: CommentAttachment[];
}

interface TestCaseCommentsCardProps {
  projectId: string;
  testCaseId: string;
}

function CommentAttachmentItem({ attachment }: { attachment: CommentAttachment }) {
  const isImage = attachment.mimeType.startsWith('image/');
  const isVideo = attachment.mimeType.startsWith('video/');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!isImage && !isVideo) return;
    fetch(`/api/attachments/${attachment.id}`)
      .then((res) => res.json())
      .then((data) => {
        const url = data?.data?.url ?? data?.url;
        if (url) setMediaUrl(url);
      })
      .catch((error) => {
        console.error('Failed to load attachment URL:', error);
      });
  }, [attachment.id, isImage, isVideo]);

  if (isImage && mediaUrl) {
    return (
      <>
        <div className="rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl}
            alt={attachment.originalName}
            className="max-w-full h-auto max-h-[64rem] rounded-lg cursor-zoom-in hover:opacity-90 transition-opacity object-contain"
            onClick={() => setPreviewOpen(true)}
          />
        </div>
        <MediaPreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          src={mediaUrl}
          mimeType={attachment.mimeType}
          originalName={attachment.originalName}
        />
      </>
    );
  }

  if (isVideo && mediaUrl) {
    return (
      <>
        <div className="relative rounded-lg overflow-hidden bg-black group">
          <video
            src={mediaUrl}
            className="max-w-full h-auto max-h-[64rem] rounded-lg"
            controls
            preload="metadata"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewOpen(true);
            }}
            className="absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 rounded-md bg-black/55 hover:bg-black/80 text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            title="拡大表示"
            aria-label="拡大表示"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
        <MediaPreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          src={mediaUrl}
          mimeType={attachment.mimeType}
          originalName={attachment.originalName}
        />
      </>
    );
  }

  return (
    <AttachmentDisplay
      attachments={[
        {
          id: attachment.id,
          filename: attachment.filename,
          originalName: attachment.originalName,
          size: attachment.size,
          mimeType: attachment.mimeType,
          uploadedAt: attachment.uploadedAt,
          // entityType is informational; download URL works via /api/attachments/[id]
          entityType: 'testcase',
        },
      ]}
      showPreview
    />
  );
}

export const TestCaseCommentsCard: React.FC<TestCaseCommentsCardProps> = ({
  projectId,
  testCaseId,
}) => {
  const { data: session } = useSession();
  const [comments, setComments] = useState<TestCaseComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<TextareaAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const uploadCommentAttachmentWithFallback = async (file: File): Promise<TextareaAttachment> => {
    const uploadResult = await uploadFileToS3({
      file,
      fieldName: 'comment',
      entityType: 'testcase',
      projectId,
      onProgress: () => {},
    });

    if (uploadResult.success && uploadResult.attachment) {
      return uploadResult.attachment;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fieldName', 'comment');
    formData.append('entityType', 'testcase');
    formData.append('projectId', projectId);

    const localResponse = await fetch('/api/attachments/upload-local', {
      method: 'POST',
      body: formData,
    });

    if (!localResponse.ok) {
      const localError = await localResponse
        .json()
        .catch(() => ({ error: 'Failed to upload attachment' }));
      throw new Error(uploadResult.error || localError.error || 'Failed to upload attachment');
    }

    const localData = await localResponse.json();
    if (!localData?.attachment) {
      throw new Error('アップロード結果が不正です');
    }

    return localData.attachment as TextareaAttachment;
  };

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/testcases/${testCaseId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data = await response.json();
      setComments(data.data ?? []);
    } catch (error) {
      console.error('Failed to load test case comments:', error);
    } finally {
      setLoading(false);
    }
  }, [testCaseId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = newComment.trim().length > 0;
    const hasAttachments = pendingAttachments.length > 0;
    if (!hasText && !hasAttachments) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      // Upload pending attachments first (yields S3 / local file metadata)
      const uploadedAttachments: TextareaAttachment[] = [];
      for (const attachment of pendingAttachments) {
        if (attachment.id.startsWith('pending-')) {
          const file = (attachment as PendingAttachment)._pendingFile;
          if (!file) continue;
          uploadedAttachments.push(await uploadCommentAttachmentWithFallback(file));
        } else {
          uploadedAttachments.push(attachment);
        }
      }

      // Create the comment
      const createResponse = await fetch(`/api/testcases/${testCaseId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (!createResponse.ok) throw new Error('Failed to add comment');
      const created = await createResponse.json();
      const createdComment = created.data;

      // Link attachments to the new comment
      for (const attachment of uploadedAttachments) {
        const linkResponse = await fetch(
          `/api/testcases/${testCaseId}/comments/${createdComment.id}/attachments`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: attachment.filename,
              originalName: attachment.originalName,
              mimeType: attachment.mimeType,
              size: attachment.size,
              path: attachment.filename,
              fieldName: 'comment',
            }),
          }
        );
        if (!linkResponse.ok) {
          const errText = await linkResponse.text();
          throw new Error(`添付ファイルの関連付けに失敗しました: ${errText}`);
        }
      }

      await fetchComments();
      setNewComment('');
      setPendingAttachments([]);
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Failed to add test case comment:', error);
      setSubmitError(error instanceof Error ? error.message : 'コメント投稿に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimestamp = (date: string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    return commentDate.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      year: commentDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <DetailCard title="コメント" contentClassName="!p-0">
      <div className="flex flex-col h-[500px]">
        <div
          className={`flex-1 p-6 space-y-4 ${
            comments.length > 0 ? 'overflow-y-auto custom-scrollbar' : 'overflow-y-hidden'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              コメントを読み込み中...
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="bg-gray-800/50 rounded-xl p-8 text-center">
                <p className="text-base font-medium text-gray-300">まだコメントがありません</p>
                <p className="text-sm mt-2 text-gray-500">
                  最初のコメントを投稿してみましょう
                </p>
              </div>
            </div>
          ) : (
            comments.map((comment) => {
              const currentUserId = session?.user?.id;
              const isCurrentUser =
                currentUserId === comment.userId || currentUserId === comment.user.id;
              return (
                <div
                  key={comment.id}
                  className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className="w-10 h-10 flex-shrink-0 ring-2 ring-white/10 rounded-full overflow-hidden">
                    {comment.user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={comment.user.avatar}
                        alt={comment.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold text-sm">
                        {comment.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div
                    className={`flex-1 ${
                      isCurrentUser ? 'items-end' : 'items-start'
                    } flex flex-col max-w-[75%]`}
                  >
                    <div
                      className={`flex items-center gap-2 mb-1.5 ${
                        isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <span
                        className={`text-sm font-semibold ${
                          isCurrentUser ? 'text-blue-400' : 'text-gray-200'
                        }`}
                      >
                        {isCurrentUser ? 'あなた' : comment.user.name}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {formatTimestamp(comment.createdAt)}
                      </span>
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-lg ${
                        isCurrentUser
                          ? 'bg-gray-800/90 backdrop-blur-sm text-gray-100 border border-blue-500/30'
                          : 'bg-gray-800/80 backdrop-blur-sm text-gray-100 border border-gray-700/50'
                      }`}
                    >
                      {comment.content && comment.content.trim() && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      )}
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div
                          className={`space-y-2 ${
                            comment.content && comment.content.trim()
                              ? 'mt-3 pt-3 border-t border-white/10'
                              : ''
                          }`}
                        >
                          {comment.attachments.map((att) => (
                            <CommentAttachmentItem key={att.id} attachment={att} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={commentsEndRef} />
        </div>

        <div className="border-t border-gray-700/50 p-5 bg-gradient-to-b from-gray-900 to-gray-900/95">
          <form onSubmit={handleSubmit} className="space-y-3">
            <TextareaWithAttachments
              variant="glass"
              fieldName="comment"
              value={newComment}
              onChange={setNewComment}
              attachments={pendingAttachments}
              onAttachmentsChange={setPendingAttachments}
              entityType="testcase"
              projectId={projectId}
              forceShowAttachments
              uploadOnSave
              placeholder="コメントを入力..."
              rows={2}
              disabled={submitting}
            />
            <div className="flex justify-end">
              <ButtonPrimary
                type="submit"
                disabled={
                  (!newComment.trim() && pendingAttachments.length === 0) || submitting
                }
                size="sm"
                className="min-w-[120px]"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitting ? '保存中...' : '保存する'}
              </ButtonPrimary>
            </div>
            {submitError && <p className="text-xs text-red-400">{submitError}</p>}
          </form>
        </div>
      </div>
    </DetailCard>
  );
};
