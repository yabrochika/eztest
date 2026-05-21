import { TestRun } from '../types';

// テストラン名の先頭プレフィックスに対する優先度。
// 数字が小さいほど先に並ぶ。一覧表示時の運用ルール
// （SM → CR → EZ → EX → その他）に合わせる。
const PREFIX_PRIORITY: Record<string, number> = {
  SM: 0,
  CR: 1,
  EZ: 2,
  EX: 3,
};

const UNKNOWN_PREFIX_PRIORITY = Number.MAX_SAFE_INTEGER;

interface ParsedName {
  prefix: string;
  prefixPriority: number;
  numeric: number;
  rest: string;
  raw: string;
}

// "SM01" → { prefix: "SM", numeric: 1, rest: "" }
// "CR12_smoke" → { prefix: "CR", numeric: 12, rest: "_smoke" }
// "Release v1" → { prefix: "", numeric: NaN, rest: "Release v1" }
function parseName(name: string): ParsedName {
  const raw = name ?? '';
  const match = raw.match(/^\s*([A-Za-z]+)(\d+)?(.*)$/);

  if (!match) {
    return {
      prefix: '',
      prefixPriority: UNKNOWN_PREFIX_PRIORITY,
      numeric: Number.NaN,
      rest: raw,
      raw,
    };
  }

  const prefix = match[1].toUpperCase();
  const numericPart = match[2];
  const rest = match[3] ?? '';

  const prefixPriority = prefix in PREFIX_PRIORITY
    ? PREFIX_PRIORITY[prefix]
    : UNKNOWN_PREFIX_PRIORITY;

  return {
    prefix,
    prefixPriority,
    numeric: numericPart ? Number.parseInt(numericPart, 10) : Number.NaN,
    rest,
    raw,
  };
}

function compareParsedNames(a: ParsedName, b: ParsedName): number {
  if (a.prefixPriority !== b.prefixPriority) {
    return a.prefixPriority - b.prefixPriority;
  }

  // 同優先度（=同プレフィックス、または共に未知プレフィックス）の場合は
  // プレフィックス自体をアルファベット順で揃えてから番号比較に進む。
  if (a.prefix !== b.prefix) {
    return a.prefix.localeCompare(b.prefix);
  }

  const aHasNumber = !Number.isNaN(a.numeric);
  const bHasNumber = !Number.isNaN(b.numeric);

  if (aHasNumber && bHasNumber && a.numeric !== b.numeric) {
    return a.numeric - b.numeric;
  }
  if (aHasNumber !== bHasNumber) {
    return aHasNumber ? -1 : 1;
  }

  if (a.rest !== b.rest) {
    return a.rest.localeCompare(b.rest, undefined, { numeric: true, sensitivity: 'base' });
  }

  return a.raw.localeCompare(b.raw, undefined, { numeric: true, sensitivity: 'base' });
}

export type SortDirection = 'asc' | 'desc';

export function sortTestRunsByPrefix<T extends Pick<TestRun, 'name'>>(
  testRuns: T[],
  direction: SortDirection = 'asc',
): T[] {
  const sign = direction === 'desc' ? -1 : 1;
  return [...testRuns].sort(
    (a, b) => compareParsedNames(parseName(a.name), parseName(b.name)) * sign,
  );
}
