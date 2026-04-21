export function parseMultiValueField(value?: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeMultiValueField(values: string[]): string | undefined {
  const normalized = values.map((value) => value.trim()).filter(Boolean);
  if (normalized.length === 0) {
    return undefined;
  }

  return normalized.join(',');
}

export function includesMultiValueField(value: string | null | undefined, target: string): boolean {
  if (!target) {
    return false;
  }

  return parseMultiValueField(value).includes(target);
}
