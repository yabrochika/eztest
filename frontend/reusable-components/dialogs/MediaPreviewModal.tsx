'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, X } from 'lucide-react';

interface MediaPreviewModalProps {
  /** モーダルを開くか */
  open: boolean;
  /** モーダルを閉じる際のコールバック */
  onClose: () => void;
  /** プレビュー対象の URL（画像/動画） */
  src: string | null;
  /** MIME タイプ（image/* または video/*） */
  mimeType: string;
  /** 表示用ファイル名（タイトル・ダウンロード用） */
  originalName?: string;
}

/**
 * 画像・動画をフルスクリーンモーダルでプレビュー表示する共通コンポーネント。
 * - 背景クリック / 右上 × / Esc で閉じる
 * - 画像はクリック領域内で原寸表示、動画はネイティブコントロール付きで再生
 * - 別タブで開くボタンも提供（ダウンロードはブラウザ既定動作に依存）
 */
export function MediaPreviewModal({
  open,
  onClose,
  src,
  mimeType,
  originalName,
}: MediaPreviewModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Esc で閉じる
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // body スクロール抑止
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!mounted || !open || !src) return null;

  const isImage = mimeType.startsWith('image/');
  const isVideo = mimeType.startsWith('video/');

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      style={{ zIndex: 10001 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={originalName || 'Media preview'}
    >
      {/* 上部ツールバー */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-white/90 truncate max-w-[70%]">
          {originalName || ''}
        </p>
        <div className="flex items-center gap-2">
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
            title="新しいタブで開く"
            aria-label="新しいタブで開く"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-red-500/40 border border-white/20 text-white transition-colors cursor-pointer"
            title="閉じる"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* メディア本体（クリック透過防止のため stopPropagation） */}
      <div
        className="max-w-[95vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={originalName || 'preview'}
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        ) : isVideo ? (
          <video
            src={src}
            controls
            autoPlay
            preload="metadata"
            className="max-w-[95vw] max-h-[90vh] rounded-lg shadow-2xl bg-black"
          />
        ) : (
          <div className="text-white/80 p-8 bg-[#1a2332] rounded-lg">
            このファイル形式はプレビューに対応していません。
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
