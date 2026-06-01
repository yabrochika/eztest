/**
 * テストケースの「テストランに追加した時点でのスナップショット」を構築・適用するヘルパー。
 *
 * テストランは「過去のエビデンス」として固定されるべきなので、テストランに追加された
 * 時点のテストケース内容を TestResult.testCaseSnapshot に保存し、テストラン詳細の
 * 読み取り時にはこのスナップショットを優先的に表示する。マスターのテストケースは
 * 自由に編集できるが、その変更は既存テストランの表示には反映されない。
 */
import { prisma } from '@/lib/prisma';

export interface TestCaseStepSnapshot {
  id: string;
  stepNumber: number;
  action: string;
  expectedResult: string;
}

export interface TestCaseSnapshot {
  /** スナップショット作成時点の元テストケース ID（参照のみ用途） */
  id: string;
  tcId?: string | null;
  rtcId?: string | null;
  title: string;
  description?: string | null;
  expectedResult?: string | null;
  preconditions?: string | null;
  postconditions?: string | null;
  testData?: string | null;
  priority?: string | null;
  status?: string | null;
  estimatedTime?: number | null;
  layer?: string | null;
  testType?: string | null;
  steps: TestCaseStepSnapshot[];
  /** ISO 8601 文字列 */
  capturedAt: string;
}

/**
 * 与えられたテストケース ID リストに対してスナップショットを構築して返す。
 * 戻り値は testCaseId → snapshot の Map。
 */
export async function buildTestCaseSnapshots(
  testCaseIds: string[]
): Promise<Map<string, TestCaseSnapshot>> {
  const map = new Map<string, TestCaseSnapshot>();
  if (testCaseIds.length === 0) return map;

  const testCases = await prisma.testCase.findMany({
    where: { id: { in: testCaseIds } },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
    },
  });

  const capturedAt = new Date().toISOString();
  for (const tc of testCases) {
    map.set(tc.id, {
      id: tc.id,
      tcId: tc.tcId,
      rtcId: tc.rtcId,
      title: tc.title,
      description: tc.description,
      expectedResult: tc.expectedResult,
      preconditions: tc.preconditions,
      postconditions: tc.postconditions,
      testData: tc.testData,
      priority: tc.priority,
      status: tc.status,
      estimatedTime: tc.estimatedTime,
      layer: tc.layer,
      testType: tc.testType,
      steps: tc.steps.map((s) => ({
        id: s.id,
        stepNumber: s.stepNumber,
        action: s.action,
        expectedResult: s.expectedResult,
      })),
      capturedAt,
    });
  }
  return map;
}

export async function buildTestCaseSnapshot(
  testCaseId: string
): Promise<TestCaseSnapshot | null> {
  const map = await buildTestCaseSnapshots([testCaseId]);
  return map.get(testCaseId) ?? null;
}

/**
 * 与えられた TestResult のリストに対し、表示用の testCase オブジェクトを構築する。
 *
 * - testCaseSnapshot がある場合は、スナップショットの値を優先して上書きする
 *   （マスターのテストケースを後から編集してもテストランの表示は固定される）
 * - マスターのテストケースが削除されて live testCase が null の場合でも、
 *   snapshot から testCase 相当のオブジェクトを再構築して返す（「過去のエビデンス」維持）
 * - snapshot もなく live もない（旧データかつ削除）場合は testCase は null のまま
 *
 * 注意: id / module / testCaseSuites などの「リレーション系」は live を維持。
 *       タイトル・説明・優先度などの「テストケース本体の編集可能フィールド」のみ
 *       スナップショットで上書きする。
 *
 * 削除済みかどうかは `testCaseDeleted` フラグでクライアントに伝える。
 */
export function overlaySnapshotOnTestCase<
  T extends {
    id?: string;
    testCaseId?: string | null;
    testCaseSnapshot?: unknown;
    testCase?: Record<string, unknown> | null;
  },
>(result: T): T & { testCaseDeleted?: boolean } {
  const snapshot = result.testCaseSnapshot as TestCaseSnapshot | null | undefined;
  const liveTestCase = result.testCase;
  const isDeleted = !liveTestCase;

  // live もスナップショットも無い場合は、行が消えないようプレースホルダーの
  // testCase を返す。スナップショット導入前の古いデータでテストケースが
  // 削除されたケース。`testCaseDeleted: true` を付けて UI 側で「削除済み」
  // バッジを出す。
  if (!liveTestCase && !snapshot) {
    return {
      ...result,
      testCase: {
        id: `deleted-${result.id ?? ''}`,
        tcId: null,
        rtcId: null,
        title: '(削除されたテストケース)',
        description: null,
        expectedResult: null,
        preconditions: null,
        postconditions: null,
        testData: null,
        priority: null,
        status: null,
        estimatedTime: null,
        layer: null,
        testType: null,
        module: null,
        testCaseSuites: [],
      },
      testCaseDeleted: true,
    };
  }

  // live が削除済みで snapshot だけある場合は snapshot から testCase を再構築
  if (!liveTestCase && snapshot) {
    const reconstructed = {
      id: snapshot.id,
      tcId: snapshot.tcId ?? null,
      rtcId: snapshot.rtcId ?? null,
      title: snapshot.title,
      description: snapshot.description ?? null,
      expectedResult: snapshot.expectedResult ?? null,
      preconditions: snapshot.preconditions ?? null,
      postconditions: snapshot.postconditions ?? null,
      testData: snapshot.testData ?? null,
      priority: snapshot.priority ?? null,
      status: snapshot.status ?? null,
      estimatedTime: snapshot.estimatedTime ?? null,
      layer: snapshot.layer ?? null,
      testType: snapshot.testType ?? null,
      module: null,
      testCaseSuites: [],
    };
    return {
      ...result,
      testCase: reconstructed,
      testCaseDeleted: true,
    };
  }

  // live + snapshot 両方ある場合は snapshot を live にオーバーレイ
  if (liveTestCase && snapshot) {
    const overlaidTestCase = {
      ...liveTestCase,
      tcId: snapshot.tcId ?? liveTestCase.tcId,
      rtcId: snapshot.rtcId ?? liveTestCase.rtcId,
      title: snapshot.title ?? liveTestCase.title,
      description: snapshot.description ?? liveTestCase.description,
      expectedResult: snapshot.expectedResult ?? liveTestCase.expectedResult,
      preconditions: snapshot.preconditions ?? liveTestCase.preconditions,
      postconditions: snapshot.postconditions ?? liveTestCase.postconditions,
      testData: snapshot.testData ?? liveTestCase.testData,
      priority: snapshot.priority ?? liveTestCase.priority,
      estimatedTime: snapshot.estimatedTime ?? liveTestCase.estimatedTime,
      layer: snapshot.layer ?? liveTestCase.layer,
      testType: snapshot.testType ?? liveTestCase.testType,
    };
    return { ...result, testCase: overlaidTestCase, testCaseDeleted: false };
  }

  // live のみ（旧データ・スナップショットなし）: 何もしない
  return { ...result, testCaseDeleted: false };
}
