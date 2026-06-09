/**
 * テストケースの曖昧検索ユーティリティ。
 *
 * - テストケースに紐づく「全ての文字列・数値データ」を横断して検索する
 *   （タイトルだけでなく、説明・期待結果・前提条件・優先度・モジュール名・
 *   スイート名・tcId など、オブジェクトに含まれる値すべてが対象）。
 * - タイトルはタイプミスや表記揺れがあってもヒットするよう、編集距離による
 *   曖昧（あいまい）一致に対応する。
 *
 * サーバー / クライアントの双方から利用できるよう、外部依存を持たない。
 */

/** 検索対象から除外するキー（UUID やタイムスタンプなど検索ノイズになるもの） */
const SKIP_KEYS = new Set<string>([
  'id',
  'avatar',
  'createdAt',
  'updatedAt',
  'capturedAt',
  'executedAt',
  'startedAt',
  'completedAt',
  'deletedAt',
  '_count',
]);

const MAX_DEPTH = 5;

/**
 * 比較用に文字列を正規化する。
 * NFKC で全角英数字・記号を半角へ統一し、小文字化・トリムする。
 */
export function normalizeText(value: string): string {
  return value.normalize('NFKC').toLowerCase().trim();
}

/**
 * オブジェクトに含まれる文字列・数値・真偽値の葉ノードを再帰的に集めて
 * 1 つの検索用テキストに連結する。
 */
export function collectSearchableText(value: unknown, depth = 0): string {
  if (value == null || depth > MAX_DEPTH) return '';

  const valueType = typeof value;

  if (valueType === 'string') return value as string;
  if (valueType === 'number' || valueType === 'boolean') return String(value);

  if (Array.isArray(value)) {
    return value.map((item) => collectSearchableText(item, depth + 1)).join(' ');
  }

  if (valueType === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SKIP_KEYS.has(key))
      .map(([, item]) => collectSearchableText(item, depth + 1))
      .join(' ');
  }

  return '';
}

/**
 * トークン長に応じて許容する編集距離（誤り数）を返す。
 * 短い語ほど厳しく、長い語ほど寛容にする。
 */
function maxErrorsFor(tokenLength: number): number {
  if (tokenLength <= 2) return 0;
  if (tokenLength <= 4) return 1;
  if (tokenLength <= 8) return 2;
  return 3;
}

/**
 * 近似部分文字列マッチの最小編集距離を返す。
 * pattern が text の「どこかの部分文字列」と何文字の違いで一致するかを計算する
 * （開始位置はどこでもよい = 部分一致）。
 */
export function fuzzySubstringDistance(text: string, pattern: string): number {
  const m = pattern.length;
  const n = text.length;
  if (m === 0) return 0;
  if (n === 0) return m;

  // 先頭行を 0 で初期化することで、pattern がどの位置から始まってもよくする。
  let prev = new Array<number>(n + 1).fill(0);
  let curr = new Array<number>(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    curr[0] = i; // pattern を i 文字消費した状態
    for (let j = 1; j <= n; j++) {
      const cost = pattern[i - 1] === text[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // pattern 側の削除
        curr[j - 1] + 1, // text 側の文字をスキップ（挿入）
        prev[j - 1] + cost // 置換 / 一致
      );
    }
    [prev, curr] = [curr, prev];
  }

  let best = prev[0];
  for (let j = 1; j <= n; j++) {
    if (prev[j] < best) best = prev[j];
  }
  return best;
}

/**
 * 1 つのトークンが対象テキスト群にマッチするか判定する。
 * - まず全データの連結テキストに対する部分一致（完全一致）を試す。
 * - ヒットしなければ、タイトルに対する曖昧（編集距離）一致を試す。
 */
function tokenMatches(
  token: string,
  haystack: string,
  fuzzyTarget: string
): boolean {
  if (haystack.includes(token)) return true;
  if (!fuzzyTarget) return false;
  return fuzzySubstringDistance(fuzzyTarget, token) <= maxErrorsFor(token.length);
}

export interface TestCaseSearchOptions {
  /**
   * 曖昧一致の対象にするフィールド値（通常はタイトル）。
   * 省略時は曖昧一致は行わず、全データの部分一致のみで判定する。
   */
  fuzzyTarget?: string | null;
}

/**
 * テストケース（任意のオブジェクト）が検索クエリにマッチするか判定する。
 *
 * クエリは空白区切りの複数トークンに分割され、全トークンを満たす（AND）場合に
 * マッチとみなす。各トークンは「全データの部分一致」または
 * 「fuzzyTarget への曖昧一致」のいずれかで成立する。
 */
export function testCaseMatchesQuery(
  testCase: unknown,
  query: string,
  options: TestCaseSearchOptions = {}
): boolean {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return true;

  const haystack = normalizeText(collectSearchableText(testCase));
  const fuzzyTarget = options.fuzzyTarget
    ? normalizeText(options.fuzzyTarget)
    : '';

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  return tokens.every((token) => tokenMatches(token, haystack, fuzzyTarget));
}
