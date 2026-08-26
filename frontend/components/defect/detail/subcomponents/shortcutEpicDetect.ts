export {
  extractEpicId,
  extractEpicIdFromString,
} from '@/lib/shortcut/ids';

export type ShortcutResolveResult = {
  kind: 'epic' | 'story' | 'unknown';
  epicId: number | null;
  epicName: string | null;
  storyId: number | null;
  storyName: string | null;
};

/**
 * Resolve an ambiguous id against Shortcut: is it an Epic, a Story, or unknown?
 * Returns the payload from `/api/shortcut/resolve/:id`.
 */
export async function resolveShortcutId(
  id: number
): Promise<ShortcutResolveResult> {
  const res = await fetch(`/api/shortcut/resolve/${id}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Failed to resolve id ${id}`);
  }
  return data?.data as ShortcutResolveResult;
}
