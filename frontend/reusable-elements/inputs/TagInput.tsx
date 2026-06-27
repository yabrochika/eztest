'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  maxTagLength?: number;
  id?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Chip-style free-form tag input. Tags are committed on Enter or comma,
 * and removed with the chip's close button or Backspace when the field is empty.
 * De-duplication is case-insensitive.
 */
export function TagInput({
  value,
  onChange,
  placeholder = 'タグを入力して Enter',
  maxTags = 20,
  maxTagLength = 30,
  id,
  className,
  disabled = false,
}: TagInputProps) {
  const [draft, setDraft] = React.useState('');

  const addTag = (raw: string) => {
    const name = raw.trim();
    if (!name) return;
    if (name.length > maxTagLength) return;
    if (value.length >= maxTags) return;
    const exists = value.some((t) => t.toLowerCase() === name.toLowerCase());
    if (exists) {
      setDraft('');
      return;
    }
    onChange([...value, name]);
    setDraft('');
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 min-h-10 w-full rounded-2xl border px-3 py-2 transition-all backdrop-blur-xl',
        'bg-[#101a2b]/70 border-white/15 text-white/90 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/40',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={() => {
        if (!disabled) document.getElementById(id || 'tag-input-field')?.focus();
      }}
    >
      {value.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-primary"
        >
          {tag}
          <button
            type="button"
            aria-label={`タグ「${tag}」を削除`}
            className="rounded-full p-0.5 hover:bg-primary/20"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(index);
            }}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id || 'tag-input-field'}
        type="text"
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(draft)}
        placeholder={value.length === 0 ? placeholder : ''}
        maxLength={maxTagLength}
        className="flex-1 min-w-[8ch] bg-transparent text-sm outline-none placeholder:text-white/50"
      />
    </div>
  );
}
