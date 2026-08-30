export type DueTone = 'overdue' | 'soon' | 'ok' | 'none';

export interface DueBadge {
  tone: DueTone;
  label: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function resolveDueBadge(
  dueDate: string | null | undefined,
  scheduledEndAt?: string | null
): DueBadge {
  const raw = dueDate ?? scheduledEndAt ?? null;
  if (!raw) return { tone: 'none', label: '' };

  const due = new Date(raw);
  if (Number.isNaN(due.getTime())) return { tone: 'none', label: '' };

  const now = Date.now();
  if (due.getTime() < now) {
    return { tone: 'overdue', label: '超過' };
  }

  const daysLeft = (due.getTime() - now) / MS_PER_DAY;
  if (daysLeft <= 3) {
    return { tone: 'soon', label: '期日間近' };
  }

  return { tone: 'ok', label: '期限内' };
}

export const DUE_BADGE_CLASS: Record<Exclude<DueTone, 'none'>, string> = {
  overdue: 'border-red-500/40 bg-red-600 text-white',
  soon: 'border-[#ff7a18]/40 bg-[#ff7a18] text-white',
  ok: 'border-[#0b72ff]/40 bg-[#0b72ff] text-white',
};
