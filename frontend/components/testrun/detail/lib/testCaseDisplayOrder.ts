import type { TestCase } from '../types';

/**
 * テストラン詳細画面のテストケース一覧で使用する「規定の表示順」を提供するユーティリティ。
 *
 * 規定の表示順:
 *   1. モジュール（モジュール名末尾の数字昇順、モジュール無しは末尾）
 *   2. Layer（SMOKE → CORE → EXTENDED → 未設定）
 *   3. タイトル先頭プレフィックスの番号（[SM-001]/[CR-007]/[EX-012] 等）
 *   4. tcId 数値昇順
 *
 * テストランのステータス（PLANNED / IN_PROGRESS / COMPLETED 等）によらず
 * 同じ並び順を維持し、画面表示と前後ナビゲーション（◀▶）の順序を一致させる。
 */

const LAYER_SORT_ORDER: Record<string, number> = {
  SMOKE: 0,
  CORE: 1,
  EXTENDED: 2,
  UNKNOWN: 3,
};

const TITLE_PREFIX_REGEX = /^\s*\[?\s*(SM|CR|EX)\s*-\s*(\d+)\s*\]?/i;

const TITLE_PREFIX_TO_LAYER: Record<string, string> = {
  SM: 'SMOKE',
  CR: 'CORE',
  EX: 'EXTENDED',
};

const parseTitlePrefix = (title?: string): { layer?: string; num?: number } => {
  if (!title) return {};
  const m = title.match(TITLE_PREFIX_REGEX);
  if (!m) return {};
  const prefix = m[1].toUpperCase();
  const num = parseInt(m[2], 10);
  return {
    layer: TITLE_PREFIX_TO_LAYER[prefix],
    num: Number.isNaN(num) ? undefined : num,
  };
};

/**
 * Layer ソートキー。
 * タイトル先頭の [SM-/CR-/EX-] プレフィックスを最優先する
 * （DB の layer フィールドが UNKNOWN のままインポートされたケースでも正しく分類するため）。
 */
export const getLayerSortKey = (layer?: string | null, title?: string): number => {
  const titleLayer = parseTitlePrefix(title).layer;
  const resolved = titleLayer || (layer && layer !== 'UNKNOWN' ? layer : undefined);
  if (!resolved) return 99;
  return LAYER_SORT_ORDER[resolved] ?? 98;
};

/** タイトル先頭プレフィックスの番号（昇順用）。なければ末尾扱い。 */
export const getTitleNumberSortKey = (title?: string): number => {
  const num = parseTitlePrefix(title).num;
  return num ?? Number.POSITIVE_INFINITY;
};

/**
 * モジュール並び替えキー。
 * モジュール名末尾の数字を取得し、無ければ 0、モジュール未設定は末尾（Infinity）。
 */
export const getModuleSortKey = (testCase: TestCase): number => {
  const name = testCase.module?.name;
  if (!name || !testCase.module?.id) return Number.POSITIVE_INFINITY;
  const matches = name.match(/\d+/g);
  if (!matches || matches.length === 0) return 0;
  const lastNum = parseInt(matches[matches.length - 1], 10);
  return Number.isNaN(lastNum) ? 0 : lastNum;
};

/**
 * 規定の表示順での比較関数。
 * モジュール → Layer → タイトル番号 → tcId の優先順位で昇順比較する。
 */
export const compareTestCasesByDisplayOrder = (a: TestCase, b: TestCase): number => {
  const moduleCmp = getModuleSortKey(a) - getModuleSortKey(b);
  if (moduleCmp !== 0) return moduleCmp;

  const layerCmp = getLayerSortKey(a.layer, a.title) - getLayerSortKey(b.layer, b.title);
  if (layerCmp !== 0) return layerCmp;

  const numCmp = getTitleNumberSortKey(a.title) - getTitleNumberSortKey(b.title);
  if (numCmp !== 0) return numCmp;

  return (a.tcId || '').localeCompare(b.tcId || '', undefined, {
    numeric: true,
    sensitivity: 'base',
  });
};
