import { prisma } from '@/lib/prisma';
import {
  DASHBOARD_WEEK_COUNT,
  buildFridayWeeks,
  weekIndexFor,
} from '@/backend/services/dashboard/weeks';

const PLACEHOLDER_SKIPPED = {
  AND: [{ status: 'SKIPPED' }, { comment: null }],
};

function emptyBarCounts() {
  return { PASSED: 0, FAILED: 0, BLOCKED: 0, UNTESTED: 0 };
}

function incrementBar(
  counts: ReturnType<typeof emptyBarCounts>,
  status: string,
  amount = 1
) {
  if (status === 'PASSED') counts.PASSED += amount;
  else if (status === 'FAILED') counts.FAILED += amount;
  else if (status === 'BLOCKED') counts.BLOCKED += amount;
  else if (status === 'NOT_STARTED') counts.UNTESTED += amount;
}

function parseAssignedIds(value?: string | null): string[] {
  if (!value) return [];
  return value.split(',').map((id) => id.trim()).filter(Boolean);
}

export class AnalyticsService {
  async getProjectAnalytics(projectId: string) {
    const weeks = buildFridayWeeks(DASHBOARD_WEEK_COUNT);
    const since = weeks[0].start;

    const [inProgressRuns, resultGroups, executorGroups, weeklyResults, testCases, suiteLinks] =
      await Promise.all([
        prisma.testRun.findMany({
          where: { projectId, status: 'IN_PROGRESS' },
          select: {
            id: true,
            name: true,
            status: true,
            startedAt: true,
            scheduledEndAt: true,
            assignedToId: true,
            assignedToIds: true,
          },
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.testResult.groupBy({
          by: ['testRunId', 'status'],
          where: { testRun: { projectId, status: 'IN_PROGRESS' } },
          _count: { id: true },
        }),
        prisma.testResult.groupBy({
          by: ['testRunId', 'executedById'],
          where: {
            testRun: { projectId, status: 'IN_PROGRESS' },
            NOT: {
              OR: [{ status: 'NOT_STARTED' }, PLACEHOLDER_SKIPPED],
            },
          },
          _count: { id: true },
        }),
        prisma.testResult.findMany({
          where: {
            executedAt: { gte: since },
            testRun: { projectId },
            NOT: {
              OR: [{ status: 'NOT_STARTED' }, PLACEHOLDER_SKIPPED],
            },
          },
          select: { status: true, executedAt: true },
        }),
        prisma.testCase.findMany({
          where: { projectId },
          select: { id: true, createdAt: true, suiteId: true },
        }),
        prisma.testCaseSuite.findMany({
          where: { testSuite: { projectId } },
          select: { addedAt: true, testCaseId: true, testSuiteId: true },
        }),
      ]);

    const countsByRun = new Map<string, ReturnType<typeof emptyBarCounts>>();
    for (const run of inProgressRuns) {
      countsByRun.set(run.id, emptyBarCounts());
    }
    for (const row of resultGroups) {
      const counts = countsByRun.get(row.testRunId);
      if (!counts) continue;
      incrementBar(counts, row.status, row._count.id);
    }

    const extraByRun = new Map<string, { RETEST: number; SKIPPED: number }>();
    for (const row of resultGroups) {
      if (row.status !== 'RETEST' && row.status !== 'SKIPPED') continue;
      const current = extraByRun.get(row.testRunId) ?? { RETEST: 0, SKIPPED: 0 };
      current[row.status] += row._count.id;
      extraByRun.set(row.testRunId, current);
    }

    const executedIdsByRun = new Map<string, string[]>();
    for (const row of executorGroups) {
      if (!row.executedById) continue;
      const list = executedIdsByRun.get(row.testRunId) ?? [];
      if (!list.includes(row.executedById)) list.push(row.executedById);
      executedIdsByRun.set(row.testRunId, list);
    }

    const userIds = new Set<string>();
    for (const run of inProgressRuns) {
      if (run.assignedToId) userIds.add(run.assignedToId);
      for (const id of parseAssignedIds(run.assignedToIds)) userIds.add(id);
    }
    for (const ids of executedIdsByRun.values()) {
      for (const id of ids) userIds.add(id);
    }

    const users = userIds.size
      ? await prisma.user.findMany({
          where: { id: { in: [...userIds] } },
          select: { id: true, name: true },
        })
      : [];
    const userMap = new Map(users.map((user) => [user.id, user.name]));

    const inProgress = inProgressRuns.map((run) => {
      const counts = countsByRun.get(run.id) ?? emptyBarCounts();
      const extra = extraByRun.get(run.id);
      const executedExtra = (extra?.RETEST ?? 0) + (extra?.SKIPPED ?? 0);
      const total = counts.PASSED + counts.FAILED + counts.BLOCKED + counts.UNTESTED + executedExtra;
      const untested = counts.UNTESTED;
      const executed = total - untested;
      const assignedIds = parseAssignedIds(run.assignedToIds);
      if (run.assignedToId) assignedIds.push(run.assignedToId);
      const ids = [...new Set([...assignedIds, ...(executedIdsByRun.get(run.id) ?? [])])];
      return {
        id: run.id,
        name: run.name,
        status: run.status,
        dueDate: run.scheduledEndAt?.toISOString() ?? null,
        scheduledEndAt: run.scheduledEndAt?.toISOString() ?? null,
        startedAt: run.startedAt?.toISOString() ?? null,
        counts,
        total,
        untested,
        progressPercent: total === 0 ? 0 : Math.round((executed / total) * 100),
        executedBy: ids.map((id) => ({
          id,
          name: userMap.get(id) || '不明な実施者',
        })),
      };
    });

    const weeklyBuckets = weeks.map((week) => ({
      weekStart: week.startKey,
      weekEnd: week.endKey,
      executed: 0,
      passed: 0,
      failed: 0,
    }));
    for (const result of weeklyResults) {
      if (!result.executedAt) continue;
      const index = weekIndexFor(result.executedAt, weeks);
      if (index < 0) continue;
      weeklyBuckets[index].executed += 1;
      if (result.status === 'PASSED') weeklyBuckets[index].passed += 1;
      if (result.status === 'FAILED') weeklyBuckets[index].failed += 1;
    }

    const weeklyActivity = weeklyBuckets.map((bucket) => ({
      ...bucket,
      passRate: bucket.executed === 0 ? 0 : bucket.passed / bucket.executed,
    }));

    const testCaseSeries = cumulativeByWeek(weeks, testCases.map((item) => item.createdAt));
    const suiteItemDates: Date[] = [];
    const seen = new Set<string>();
    for (const link of suiteLinks) {
      const key = `${link.testCaseId}:${link.testSuiteId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      suiteItemDates.push(link.addedAt);
    }
    for (const testCase of testCases) {
      if (!testCase.suiteId) continue;
      const key = `${testCase.id}:${testCase.suiteId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      suiteItemDates.push(testCase.createdAt);
    }
    const suiteItemSeries = cumulativeByWeek(weeks, suiteItemDates);

    const latestTestCases = testCaseSeries.at(-1) ?? 0;
    const prevTestCases = testCaseSeries.at(-2) ?? latestTestCases;
    const latestSuiteItems = suiteItemSeries.at(-1) ?? 0;
    const prevSuiteItems = suiteItemSeries.at(-2) ?? latestSuiteItems;

    return {
      inProgressRuns: inProgress,
      weeklyActivity,
      inventoryTrend: {
        weeks: weeks.map((week) => ({ weekStart: week.startKey, weekEnd: week.endKey })),
        testCases: testCaseSeries,
        suiteItems: suiteItemSeries,
        latestTestCases,
        latestSuiteItems,
        testCasesDelta: latestTestCases - prevTestCases,
        suiteItemsDelta: latestSuiteItems - prevSuiteItems,
      },
    };
  }
}

function cumulativeByWeek(
  weeks: ReturnType<typeof buildFridayWeeks>,
  dates: Date[]
): number[] {
  const added = weeks.map(() => 0);
  let before = 0;
  for (const date of dates) {
    const index = weekIndexFor(date, weeks);
    if (index >= 0) added[index] += 1;
    else if (date.getTime() < weeks[0].start.getTime()) before += 1;
  }
  let cumulative = before;
  return added.map((value) => {
    cumulative += value;
    return cumulative;
  });
}

export const analyticsService = new AnalyticsService();
