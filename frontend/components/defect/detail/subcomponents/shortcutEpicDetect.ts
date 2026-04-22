/**
 * Extract a Shortcut Epic/Story id from a single string.
 *
 * Recognises:
 *   - `epic-1234` / `EPIC-1234`  (explicit epic tag)
 *   - leading 2+ digit numeric prefix followed by `_` or `-`
 *     (e.g. `3569_march-cp-chore`, `2488-merpay-...`)
 *
 * The return value is ambiguous (could be an Epic id OR a Story id);
 * callers should resolve it via `/api/shortcut/resolve/:id`.
 */
export function extractEpicIdFromString(
  s: string | null | undefined
): number | null {
  if (!s) return null;
  const explicit = /epic-(\d+)/i.exec(s);
  if (explicit) {
    const id = parseInt(explicit[1], 10);
    if (Number.isFinite(id)) return id;
  }
  const leading = /^\s*(\d{2,})[_\-]/.exec(s);
  if (leading) {
    const id = parseInt(leading[1], 10);
    if (Number.isFinite(id)) return id;
  }
  return null;
}

/** First non-null id across the provided strings (in order). */
export function extractEpicId(
  ...sources: Array<string | null | undefined>
): number | null {
  for (const s of sources) {
    const id = extractEpicIdFromString(s);
    if (id !== null) return id;
  }
  return null;
}

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
