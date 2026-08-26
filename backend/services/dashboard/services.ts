import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { projectService } from '@/backend/services/project/services';
import {
  DASHBOARD_WEEK_COUNT,
  buildFridayWeeks,
  weekIndexFor,
  type WeekWindow,
} from '@/backend/services/dashboard/weeks';
import { extractEpicId } from '@/lib/shortcut/ids';

export const DASHBOARD_RANGE_DAYS = 14;
export { DASHBOARD_WEEK_COUNT };

export const RESULT_STATUSES = ['PASSED', 'FAILED', 'BLOCKED', 'RETEST', 'SKIPPED'] as const;
export type ResultStatus = (typeof RESULT_STATUSES)[number];

export const PIE_STATUSES = [...RESULT_STATUSES, 'NOT_STARTED'] as const;
export type PieStatus = (typeof PIE_STATUSES)[number];

export type ResultStatusCounts = Record<ResultStatus, number>;
export type PieStatusCounts = Record<PieStatus, number>;

export interface ActivityDay {
  date: string;
  counts: ResultStatusCounts;
}

export interface WeeklyRunDetail {
  id: string;
  name: string;
  status: string;
  suiteCount: number;
  suiteNames: string[];
  resultCounts: PieStatusCounts;
}

export interface WeeklyTrendPoint {
  weekStart: string;
  weekEnd: string;
  testCases: number;
  testCasesAdded: number;
  testSuites: number;
  testSuitesAdded: number;
  suiteItems: number;
  suiteItemsAdded: number;
  testRuns: number;
  testRunSuites: number;
  resultCounts: PieStatusCounts;
  runs: WeeklyRunDetail[];
}

function emptyWeeklyPoint(week: WeekWindow): WeeklyTrendPoint {
  return {
    weekStart: week.startKey,
    weekEnd: week.endKey,
    testCases: 0,
    testCasesAdded: 0,
    testSuites: 0,
    testSuitesAdded: 0,
    suiteItems: 0,
    suiteItemsAdded: 0,
    testRuns: 0,
    testRunSuites: 0,
    resultCounts: emptyPieCounts(),
    runs: [],
  };
}

function emptyWeeklySeries(weeks: WeekWindow[]): WeeklyTrendPoint[] {
  return weeks.map((week) => emptyWeeklyPoint(week));
}

function applyCreatedCounts(
  series: WeeklyTrendPoint[],
  weeks: WeekWindow[],
  items: Array<{ createdAt: Date }>,
  field: 'testCases' | 'testSuites' | 'suiteItems',
  addedField: 'testCasesAdded' | 'testSuitesAdded' | 'suiteItemsAdded'
) {
  const added = weeks.map(() => 0);
  let beforeRange = 0;

  for (const item of items) {
    const index = weekIndexFor(item.createdAt, weeks);
    if (index >= 0) {
      added[index] += 1;
    } else if (item.createdAt.getTime() < weeks[0].start.getTime()) {
      beforeRange += 1;
    }
  }

  let cumulative = beforeRange;
  for (let i = 0; i < weeks.length; i += 1) {
    series[i][addedField] = added[i];
    cumulative += added[i];
    series[i][field] = cumulative;
  }
}

const CLOSED_TEST_RUN_STATUSES = ['COMPLETED', 'CANCELLED'];

function emptyCounts(): ResultStatusCounts {
  return {
    PASSED: 0,
    FAILED: 0,
    BLOCKED: 0,
    RETEST: 0,
    SKIPPED: 0,
  };
}

function emptyPieCounts(): PieStatusCounts {
  return {
    ...emptyCounts(),
    NOT_STARTED: 0,
  };
}

type DashboardShortcutLink = {
  storyId: number | null;
  storyUrl: string | null;
  epicId: number | null;
  epicName: string | null;
};

function emptyShortcut(): DashboardShortcutLink {
  return {
    storyId: null,
    storyUrl: null,
    epicId: null,
    epicName: null,
  };
}

function hasShortcutLink(link: DashboardShortcutLink): boolean {
  return !!(link.storyId || link.storyUrl || link.epicId);
}

function shortcutFromDefect(defect: {
  shortcutStoryId?: number | null;
  shortcutStoryUrl?: string | null;
  shortcutEpicId?: number | null;
  shortcutEpicName?: string | null;
}): DashboardShortcutLink {
  return {
    storyId: defect.shortcutStoryId ?? null,
    storyUrl: defect.shortcutStoryUrl ?? null,
    epicId: defect.shortcutEpicId ?? null,
    epicName: defect.shortcutEpicName ?? null,
  };
}

function shortcutFromRunTexts(
  name: string,
  suites: Array<{ name: string; tsId?: string | null }>
): DashboardShortcutLink {
  const epicId = extractEpicId(name, ...suites.flatMap((suite) => [suite.name, suite.tsId]));
  if (!epicId) return emptyShortcut();
  return {
    storyId: null,
    storyUrl: null,
    epicId,
    epicName: null,
  };
}

function overallRunStatus(counts: PieStatusCounts): string {
  if (counts.FAILED > 0) return 'FAILED';
  if (counts.BLOCKED > 0) return 'BLOCKED';
  if (counts.RETEST > 0) return 'RETEST';
  const executed = counts.PASSED + counts.FAILED + counts.BLOCKED + counts.RETEST + counts.SKIPPED;
  if (executed === 0) return 'NOT_STARTED';
  if (counts.NOT_STARTED > 0 || counts.SKIPPED > 0) return 'IN_PROGRESS';
  return 'PASSED';
}

function incrementCount(counts: ResultStatusCounts, status: string) {
  if (status in counts) {
    counts[status as ResultStatus] += 1;
  }
}

function incrementPie(counts: PieStatusCounts, status: string) {
  if (status in counts) {
    counts[status as PieStatus] += 1;
  }
}

function pieTotal(counts: PieStatusCounts): number {
  return PIE_STATUSES.reduce((sum, status) => sum + (counts[status] || 0), 0);
}

function sumCounts(days: ActivityDay[]): ResultStatusCounts {
  const totals = emptyCounts();
  for (const day of days) {
    for (const status of RESULT_STATUSES) {
      totals[status] += day.counts[status];
    }
  }
  return totals;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function eachDayKeys(days: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    keys.push(toDateKey(day));
  }
  return keys;
}

function parseAssignedIds(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isAssignedToUser(
  assignedToId: string | null,
  assignedToIds: string | null,
  userId: string
): boolean {
  if (assignedToId === userId) return true;
  return parseAssignedIds(assignedToIds).includes(userId);
}

function emptyActivity(rangeDays: number) {
  const days = eachDayKeys(rangeDays).map((date) => ({
    date,
    counts: emptyCounts(),
  }));
  return {
    days,
    totals: emptyCounts(),
  };
}

export class DashboardService {
  async getDashboard(userId: string, scope: string, rangeDays: number = DASHBOARD_RANGE_DAYS) {
    const projects = await projectService.getAllProjects(userId, scope);
    const projectIds = projects.map((project) => project.id);

    const weeks = buildFridayWeeks(DASHBOARD_WEEK_COUNT);

    if (projectIds.length === 0) {
      return {
        rangeDays,
        weekCount: DASHBOARD_WEEK_COUNT,
        weekRange: {
          start: weeks[0].startKey,
          end: weeks[weeks.length - 1].endKey,
        },
        activity: emptyActivity(rangeDays),
        timeline: [],
        inProgressRuns: [],
        projects: [],
        todos: { testRuns: [], defects: [] },
        shortcuts: [],
      };
    }

    const since = weeks[0].start;

    const placeholderSkipped = {
      AND: [{ status: 'SKIPPED' }, { comment: null }],
    };

    const [recentResults, lastActivityRows, openRunCounts, assignedRuns, assignedDefects, testCases, testSuites, suiteLinks, testRuns, runResultGroups, executorGroups] =
      await Promise.all([
        prisma.testResult.findMany({
          where: {
            executedAt: { gte: since },
            testRun: { projectId: { in: projectIds } },
            NOT: {
              OR: [{ status: 'NOT_STARTED' }, placeholderSkipped],
            },
          },
          select: {
            status: true,
            executedAt: true,
            testRun: { select: { projectId: true } },
          },
        }),
        prisma.$queryRaw<Array<{ projectId: string; lastActivityAt: Date }>>`
          SELECT t."projectId", MAX(r."executedAt") as "lastActivityAt"
          FROM "TestResult" r
          INNER JOIN "TestRun" t ON t.id = r."testRunId"
          WHERE t."projectId" IN (${Prisma.join(projectIds)})
            AND r.status <> 'NOT_STARTED'
            AND NOT (r.status = 'SKIPPED' AND r.comment IS NULL)
          GROUP BY t."projectId"
        `,
        prisma.testRun.groupBy({
          by: ['projectId'],
          where: {
            projectId: { in: projectIds },
            status: { notIn: CLOSED_TEST_RUN_STATUSES },
          },
          _count: { id: true },
        }),
        prisma.testRun.findMany({
          where: {
            projectId: { in: projectIds },
            status: { notIn: CLOSED_TEST_RUN_STATUSES },
            OR: [{ assignedToId: userId }, { assignedToIds: { contains: userId } }],
          },
          select: {
            id: true,
            name: true,
            status: true,
            assignedToId: true,
            assignedToIds: true,
            project: { select: { id: true, name: true, key: true } },
            suites: {
              select: {
                testSuite: { select: { name: true, tsId: true } },
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: 50,
        }),
        prisma.defect.findMany({
          where: {
            projectId: { in: projectIds },
            assignedToId: userId,
            status: { not: 'CLOSED' },
          },
          select: {
            id: true,
            defectId: true,
            title: true,
            status: true,
            priority: true,
            shortcutStoryId: true,
            shortcutStoryUrl: true,
            shortcutEpicId: true,
            shortcutEpicName: true,
            project: { select: { id: true, name: true, key: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: 50,
        }),
        prisma.testCase.findMany({
          where: { projectId: { in: projectIds } },
          select: { id: true, projectId: true, suiteId: true, createdAt: true },
        }),
        prisma.testSuite.findMany({
          where: { projectId: { in: projectIds } },
          select: { projectId: true, createdAt: true },
        }),
        prisma.testCaseSuite.findMany({
          where: { testSuite: { projectId: { in: projectIds } } },
          select: {
            addedAt: true,
            testCaseId: true,
            testSuiteId: true,
            testSuite: { select: { projectId: true } },
          },
        }),
        prisma.testRun.findMany({
          where: { projectId: { in: projectIds } },
          select: {
            id: true,
            name: true,
            status: true,
            projectId: true,
            createdAt: true,
            startedAt: true,
            completedAt: true,
            scheduledStartAt: true,
            scheduledEndAt: true,
            assignedToId: true,
            assignedToIds: true,
            updatedAt: true,
            suites: {
              select: {
                testSuite: { select: { id: true, name: true, tsId: true } },
              },
            },
            results: {
              where: {
                NOT: {
                  OR: [{ status: 'NOT_STARTED' }, placeholderSkipped],
                },
              },
              select: { executedAt: true },
              orderBy: { executedAt: 'asc' },
              take: 1,
            },
          },
        }),
        prisma.testResult.groupBy({
          by: ['testRunId', 'status'],
          where: { testRun: { projectId: { in: projectIds } } },
          _count: { id: true },
        }),
        prisma.testResult.groupBy({
          by: ['testRunId', 'executedById', 'status'],
          where: {
            testRun: { projectId: { in: projectIds } },
            NOT: {
              OR: [{ status: 'NOT_STARTED' }, placeholderSkipped],
            },
          },
          _count: { id: true },
          _max: { executedAt: true },
        }),
      ]);

    const inferredSuitesByRun = new Map<string, Array<{ id: string; name: string }>>();
    const runsMissingSuites = testRuns.filter((run) => run.suites.length === 0).map((run) => run.id);
    if (runsMissingSuites.length > 0) {
      const resultCases = await prisma.testResult.findMany({
        where: {
          testRunId: { in: runsMissingSuites },
          testCaseId: { not: null },
        },
        select: { testRunId: true, testCaseId: true },
      });
      const caseIds = [...new Set(resultCases.map((row) => row.testCaseId).filter((id): id is string => Boolean(id)))];
      if (caseIds.length > 0) {
        const cases = await prisma.testCase.findMany({
          where: { id: { in: caseIds } },
          select: {
            id: true,
            suite: { select: { id: true, name: true } },
            testCaseSuites: { select: { testSuite: { select: { id: true, name: true } } } },
          },
        });
        const suitesByCase = new Map(
          cases.map((testCase) => {
            const suites = [
              ...(testCase.suite ? [testCase.suite] : []),
              ...testCase.testCaseSuites.map((link) => link.testSuite),
            ];
            const unique = new Map(suites.map((suite) => [suite.id, suite]));
            return [testCase.id, [...unique.values()]];
          })
        );
        for (const row of resultCases) {
          if (!row.testCaseId) continue;
          const suites = suitesByCase.get(row.testCaseId) ?? [];
          const current = inferredSuitesByRun.get(row.testRunId) ?? [];
          const merged = new Map(current.map((suite) => [suite.id, suite]));
          for (const suite of suites) {
            merged.set(suite.id, suite);
          }
          inferredSuitesByRun.set(row.testRunId, [...merged.values()]);
        }
      }
    }

    const dayKeys = eachDayKeys(rangeDays);
    const globalByDay = new Map<string, ResultStatusCounts>(
      dayKeys.map((date) => [date, emptyCounts()])
    );
    const projectByDay = new Map<string, Map<string, ResultStatusCounts>>();
    const projectResultCounts = new Map<string, ResultStatusCounts>();

    for (const projectId of projectIds) {
      projectByDay.set(
        projectId,
        new Map(dayKeys.map((date) => [date, emptyCounts()]))
      );
      projectResultCounts.set(projectId, emptyCounts());
    }

    for (const result of recentResults) {
      const dateKey = toDateKey(result.executedAt);
      const projectId = result.testRun.projectId;
      incrementCount(globalByDay.get(dateKey) ?? emptyCounts(), result.status);

      const projectDays = projectByDay.get(projectId);
      if (projectDays?.has(dateKey)) {
        incrementCount(projectDays.get(dateKey)!, result.status);
      }
      const projectCounts = projectResultCounts.get(projectId);
      if (projectCounts) {
        incrementCount(projectCounts, result.status);
      }
    }

    const activityDays: ActivityDay[] = dayKeys.map((date) => ({
      date,
      counts: globalByDay.get(date) ?? emptyCounts(),
    }));

    const lastActivityMap = new Map(
      lastActivityRows.map((row) => [row.projectId, row.lastActivityAt.toISOString()])
    );
    const openRunCountMap = new Map(
      openRunCounts.map((row) => [row.projectId, row._count.id])
    );

    const weeklyByProject = new Map<string, WeeklyTrendPoint[]>();
    for (const projectId of projectIds) {
      weeklyByProject.set(projectId, emptyWeeklySeries(weeks));
    }

    const suiteItemKeys = new Set<string>();
    const suiteItemsByProject = new Map<string, Array<{ createdAt: Date }>>();
    for (const projectId of projectIds) {
      suiteItemsByProject.set(projectId, []);
    }
    for (const link of suiteLinks) {
      const key = `${link.testCaseId}:${link.testSuiteId}`;
      if (suiteItemKeys.has(key)) continue;
      suiteItemKeys.add(key);
      suiteItemsByProject.get(link.testSuite.projectId)?.push({ createdAt: link.addedAt });
    }
    for (const testCase of testCases) {
      if (!testCase.suiteId) continue;
      const key = `${testCase.id}:${testCase.suiteId}`;
      if (suiteItemKeys.has(key)) continue;
      suiteItemKeys.add(key);
      suiteItemsByProject.get(testCase.projectId)?.push({ createdAt: testCase.createdAt });
    }

    for (const projectId of projectIds) {
      const series = weeklyByProject.get(projectId)!;
      applyCreatedCounts(
        series,
        weeks,
        testCases.filter((item) => item.projectId === projectId),
        'testCases',
        'testCasesAdded'
      );
      applyCreatedCounts(
        series,
        weeks,
        testSuites.filter((item) => item.projectId === projectId),
        'testSuites',
        'testSuitesAdded'
      );
      applyCreatedCounts(
        series,
        weeks,
        suiteItemsByProject.get(projectId) ?? [],
        'suiteItems',
        'suiteItemsAdded'
      );
    }

    const pieByRun = new Map<string, PieStatusCounts>();
    for (const row of runResultGroups) {
      const counts = pieByRun.get(row.testRunId) ?? emptyPieCounts();
      if (row.status in counts) {
        counts[row.status as PieStatus] += row._count.id;
      }
      pieByRun.set(row.testRunId, counts);
    }

    for (const result of recentResults) {
      const index = weekIndexFor(result.executedAt, weeks);
      if (index < 0) continue;
      const series = weeklyByProject.get(result.testRun.projectId);
      if (!series) continue;
      incrementPie(series[index].resultCounts, result.status);
    }

    const weekSuiteIds = new Map<string, Set<string>[]>();
    for (const projectId of projectIds) {
      weekSuiteIds.set(projectId, weeks.map(() => new Set<string>()));
    }

    for (const run of testRuns) {
      const series = weeklyByProject.get(run.projectId);
      const suiteSets = weekSuiteIds.get(run.projectId);
      if (!series || !suiteSets) continue;

      const executedAt = run.results[0]?.executedAt ?? run.startedAt;
      if (!executedAt) continue;
      const index = weekIndexFor(executedAt, weeks);
      if (index < 0) continue;

      const linkedSuites = run.suites.map((link) => link.testSuite);
      const suites = linkedSuites.length > 0 ? linkedSuites : (inferredSuitesByRun.get(run.id) ?? []);
      const suiteNames = suites.map((suite) => suite.name);
      const suiteIds = suites.map((suite) => suite.id);
      series[index].testRuns += 1;
      series[index].runs.push({
        id: run.id,
        name: run.name,
        status: run.status,
        suiteCount: suiteIds.length,
        suiteNames,
        resultCounts: pieByRun.get(run.id) ?? emptyPieCounts(),
      });
      for (const suiteId of suiteIds) {
        suiteSets[index].add(suiteId);
      }
      series[index].testRunSuites = suiteSets[index].size;
    }

    const projectMeta = new Map(projects.map((project) => [project.id, project]));
    const now = new Date();

    const timeline = testRuns.flatMap((run) => {
      const isClosed = CLOSED_TEST_RUN_STATUSES.includes(run.status);
      const startAt = run.scheduledStartAt ?? run.startedAt ?? run.createdAt;
      const endAt = run.scheduledEndAt
        ?? (run.scheduledStartAt && !run.completedAt ? run.scheduledStartAt : null)
        ?? run.completedAt
        ?? (isClosed ? run.updatedAt : now);
      const project = projectMeta.get(run.projectId);
      if (!project) return [];
      return [{
        id: run.id,
        name: run.name,
        status: run.status,
        projectId: run.projectId,
        projectName: project.name,
        projectKey: project.key,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        resultCounts: pieByRun.get(run.id) ?? emptyPieCounts(),
      }];
    }).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    const inProgressRuns = testRuns.flatMap((run) => {
      if (run.status !== 'IN_PROGRESS') return [];
      const project = projectMeta.get(run.projectId);
      if (!project) return [];
      return [{
        id: run.id,
        name: run.name,
        status: run.status,
        projectId: run.projectId,
        projectName: project.name,
        projectKey: project.key,
        startedAt: run.startedAt?.toISOString() ?? null,
        scheduledStartAt: run.scheduledStartAt?.toISOString() ?? null,
        scheduledEndAt: run.scheduledEndAt?.toISOString() ?? null,
        resultCounts: pieByRun.get(run.id) ?? emptyPieCounts(),
        shortcut: shortcutFromRunTexts(
          run.name,
          run.suites.map((link) => link.testSuite)
        ),
      }];
    }).sort((a, b) => {
      const projectDiff = a.projectKey.localeCompare(b.projectKey, 'ja');
      if (projectDiff !== 0) return projectDiff;
      const aTime = new Date(a.startedAt ?? a.scheduledStartAt ?? 0).getTime();
      const bTime = new Date(b.startedAt ?? b.scheduledStartAt ?? 0).getTime();
      return bTime - aTime;
    });

    const runsByProject = new Map<string, typeof testRuns>();
    for (const run of testRuns) {
      const list = runsByProject.get(run.projectId) ?? [];
      list.push(run);
      runsByProject.set(run.projectId, list);
    }

    const recentRunIds: string[] = [];
    const recentRunsByProject = new Map<string, Array<{
      id: string;
      name: string;
      status: string;
      startedAt: string | null;
      completedAt: string | null;
      scheduledStartAt: string | null;
      scheduledEndAt: string | null;
      resultCounts: PieStatusCounts;
      suites: Array<{ id: string; name: string }>;
      items: Array<{ id: string; title: string; status: string; tcId?: string | null }>;
    }>>();

    for (const projectId of projectIds) {
      const list = (runsByProject.get(projectId) ?? []).slice().sort((a, b) => {
        const aOpen = CLOSED_TEST_RUN_STATUSES.includes(a.status) ? 1 : 0;
        const bOpen = CLOSED_TEST_RUN_STATUSES.includes(b.status) ? 1 : 0;
        if (aOpen !== bOpen) return aOpen - bOpen;
        const aTime = (a.startedAt ?? a.updatedAt ?? a.createdAt).getTime();
        const bTime = (b.startedAt ?? b.updatedAt ?? b.createdAt).getTime();
        return bTime - aTime;
      }).slice(0, 6);

      recentRunIds.push(...list.map((run) => run.id));
      recentRunsByProject.set(
        projectId,
        list.map((run) => {
          const linkedSuites = run.suites.map((link) => link.testSuite);
          const suites = linkedSuites.length > 0 ? linkedSuites : (inferredSuitesByRun.get(run.id) ?? []);
          return {
            id: run.id,
            name: run.name,
            status: run.status,
            startedAt: run.startedAt?.toISOString() ?? null,
            completedAt: run.completedAt?.toISOString() ?? null,
            scheduledStartAt: run.scheduledStartAt?.toISOString() ?? null,
            scheduledEndAt: run.scheduledEndAt?.toISOString() ?? null,
            resultCounts: pieByRun.get(run.id) ?? emptyPieCounts(),
            suites: suites.map((suite) => ({ id: suite.id, name: suite.name })),
            items: [],
          };
        })
      );
    }

    if (recentRunIds.length > 0) {
      const notableResults = await prisma.testResult.findMany({
        where: {
          testRunId: { in: recentRunIds },
        },
        select: {
          id: true,
          status: true,
          testRunId: true,
          testCase: { select: { title: true, tcId: true } },
          testCaseSnapshot: true,
        },
        orderBy: { executedAt: 'desc' },
        take: 240,
      });

      const itemsByRun = new Map<string, Array<{ id: string; title: string; status: string; tcId?: string | null }>>();
      const notableOrder = ['FAILED', 'BLOCKED', 'RETEST', 'PASSED', 'SKIPPED', 'NOT_STARTED'];
      const ranked = notableResults.slice().sort((a, b) => {
        return notableOrder.indexOf(a.status) - notableOrder.indexOf(b.status);
      });
      for (const result of ranked) {
        const snapshot = result.testCaseSnapshot as { title?: string; tcId?: string } | null;
        const title = result.testCase?.title || snapshot?.title || result.testCase?.tcId || 'テスト';
        const tcId = result.testCase?.tcId || snapshot?.tcId || null;
        const list = itemsByRun.get(result.testRunId) ?? [];
        if (list.length < 6) {
          list.push({ id: result.id, title, status: result.status, tcId });
          itemsByRun.set(result.testRunId, list);
        }
      }

      for (const [projectId, runs] of recentRunsByProject) {
        recentRunsByProject.set(
          projectId,
          runs.map((run) => {
            const notable = itemsByRun.get(run.id) ?? [];
            if (notable.length > 0) {
              return { ...run, items: notable };
            }
            const fallbackStatus = overallRunStatus(run.resultCounts);
            return {
              ...run,
              items: run.suites.map((suite) => ({
                id: suite.id,
                title: suite.name,
                status: fallbackStatus,
              })),
            };
          })
        );
      }
    }

    const runProjectId = new Map(testRuns.map((run) => [run.id, run.projectId]));
    const executorAcc = new Map<string, Map<string, { counts: PieStatusCounts; lastExecutedAt: Date | null }>>();

    for (const row of executorGroups) {
      const projectId = runProjectId.get(row.testRunId);
      if (!projectId) continue;
      const byUser = executorAcc.get(projectId) ?? new Map();
      const current = byUser.get(row.executedById) ?? { counts: emptyPieCounts(), lastExecutedAt: null };
      if (row.status in current.counts) {
        current.counts[row.status as PieStatus] += row._count.id;
      }
      const executedAt = row._max.executedAt;
      if (executedAt && (!current.lastExecutedAt || executedAt > current.lastExecutedAt)) {
        current.lastExecutedAt = executedAt;
      }
      byUser.set(row.executedById, current);
      executorAcc.set(projectId, byUser);
    }

    const assignedIdsForInProgress = [
      ...new Set(
        testRuns.flatMap((run) => {
          if (run.status !== 'IN_PROGRESS') return [];
          const ids = parseAssignedIds(run.assignedToIds);
          if (run.assignedToId) ids.push(run.assignedToId);
          return ids;
        })
      ),
    ];
    const executedIdsByRun = new Map<string, string[]>();
    for (const row of executorGroups) {
      const list = executedIdsByRun.get(row.testRunId) ?? [];
      if (!list.includes(row.executedById)) list.push(row.executedById);
      executedIdsByRun.set(row.testRunId, list);
    }
    const executorUserIds = [...new Set([
      ...[...executorAcc.values()].flatMap((byUser) => [...byUser.keys()]),
      ...assignedIdsForInProgress,
    ])];
    const executorUsers = executorUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: executorUserIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const executorUserMap = new Map(executorUsers.map((user) => [user.id, user]));

    const executorsByProject = new Map<string, Array<{
      id: string;
      name: string;
      email: string;
      resultCounts: PieStatusCounts;
      lastExecutedAt: string | null;
    }>>();

    for (const [projectId, byUser] of executorAcc) {
      const list = [...byUser.entries()].map(([userId, stats]) => {
        const user = executorUserMap.get(userId);
        return {
          id: userId,
          name: user?.name || '不明な実施者',
          email: user?.email || '',
          resultCounts: stats.counts,
          lastExecutedAt: stats.lastExecutedAt?.toISOString() ?? null,
        };
      }).sort((a, b) => {
        const totalDiff = pieTotal(b.resultCounts) - pieTotal(a.resultCounts);
        if (totalDiff !== 0) return totalDiff;
        return a.name.localeCompare(b.name, 'ja');
      });
      executorsByProject.set(projectId, list);
    }

    const dashboardProjects = projects.map((project) => {
      const recentDays = dayKeys.map((date) => ({
        date,
        counts: projectByDay.get(project.id)?.get(date) ?? emptyCounts(),
      }));

      return {
        ...project,
        lastActivityAt: lastActivityMap.get(project.id) ?? null,
        resultCounts: projectResultCounts.get(project.id) ?? emptyCounts(),
        recentActivity: recentDays,
        openTestRuns: openRunCountMap.get(project.id) ?? 0,
        weeklyTrend: weeklyByProject.get(project.id) ?? emptyWeeklySeries(weeks),
        recentRuns: recentRunsByProject.get(project.id) ?? [],
        executors: executorsByProject.get(project.id) ?? [],
      };
    });

    const todos = {
      testRuns: assignedRuns
        .filter((run) => isAssignedToUser(run.assignedToId, run.assignedToIds, userId))
        .map((run) => ({
          id: run.id,
          name: run.name,
          status: run.status,
          projectId: run.project.id,
          projectName: run.project.name,
          projectKey: run.project.key,
          shortcut: shortcutFromRunTexts(
            run.name,
            run.suites.map((link) => link.testSuite)
          ),
        })),
      defects: assignedDefects.map((defect) => ({
        id: defect.id,
        defectId: defect.defectId,
        title: defect.title,
        status: defect.status,
        priority: defect.priority,
        projectId: defect.project.id,
        projectName: defect.project.name,
        projectKey: defect.project.key,
        shortcut: shortcutFromDefect(defect),
      })),
    };

    const inProgressRunIds = testRuns
      .filter((run) => run.status === 'IN_PROGRESS')
      .map((run) => run.id);

    const linkedShortcutDefects = await prisma.defect.findMany({
      where: {
        projectId: { in: projectIds },
        status: { not: 'CLOSED' },
        OR: [
          { shortcutStoryId: { not: null } },
          { shortcutEpicId: { not: null } },
        ],
        AND: [
          {
            OR: [
              { assignedToId: userId },
              ...(inProgressRunIds.length > 0
                ? [{ testRunId: { in: inProgressRunIds } }]
                : []),
            ],
          },
        ],
      },
      select: {
        id: true,
        defectId: true,
        title: true,
        status: true,
        shortcutStoryId: true,
        shortcutStoryUrl: true,
        shortcutEpicId: true,
        shortcutEpicName: true,
        project: { select: { id: true, name: true, key: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 80,
    });

    const shortcutSeen = new Set<string>();
    const shortcuts: Array<{
      workType: 'defect' | 'testrun';
      workId: string;
      workLabel: string;
      workTitle: string;
      status: string;
      projectId: string;
      projectName: string;
      projectKey: string;
      shortcut: DashboardShortcutLink;
    }> = [];

    const pushShortcutWork = (work: (typeof shortcuts)[number]) => {
      const key = `${work.workType}:${work.workId}`;
      if (shortcutSeen.has(key) || !hasShortcutLink(work.shortcut)) return;
      shortcutSeen.add(key);
      shortcuts.push(work);
    };

    for (const defect of linkedShortcutDefects) {
      pushShortcutWork({
        workType: 'defect',
        workId: defect.id,
        workLabel: defect.defectId,
        workTitle: defect.title,
        status: defect.status,
        projectId: defect.project.id,
        projectName: defect.project.name,
        projectKey: defect.project.key,
        shortcut: shortcutFromDefect(defect),
      });
    }

    for (const defect of todos.defects) {
      pushShortcutWork({
        workType: 'defect',
        workId: defect.id,
        workLabel: defect.defectId,
        workTitle: defect.title,
        status: defect.status,
        projectId: defect.projectId,
        projectName: defect.projectName,
        projectKey: defect.projectKey,
        shortcut: defect.shortcut,
      });
    }

    for (const run of inProgressRuns) {
      pushShortcutWork({
        workType: 'testrun',
        workId: run.id,
        workLabel: run.name,
        workTitle: run.name,
        status: run.status,
        projectId: run.projectId,
        projectName: run.projectName,
        projectKey: run.projectKey,
        shortcut: run.shortcut,
      });
    }

    for (const run of todos.testRuns) {
      pushShortcutWork({
        workType: 'testrun',
        workId: run.id,
        workLabel: run.name,
        workTitle: run.name,
        status: run.status,
        projectId: run.projectId,
        projectName: run.projectName,
        projectKey: run.projectKey,
        shortcut: run.shortcut,
      });
    }

    return {
      rangeDays,
      weekCount: DASHBOARD_WEEK_COUNT,
      weekRange: {
        start: weeks[0].startKey,
        end: weeks[weeks.length - 1].endKey,
      },
      activity: {
        days: activityDays,
        totals: sumCounts(activityDays),
      },
      timeline,
      inProgressRuns: inProgressRuns.map((run) => {
        const source = testRuns.find((item) => item.id === run.id);
        const assignedIds = parseAssignedIds(source?.assignedToIds);
        if (source?.assignedToId) assignedIds.push(source.assignedToId);
        const uniqueAssigned = [...new Set(assignedIds)];
        const executedIds = executedIdsByRun.get(run.id) ?? [];
        const ids = [...uniqueAssigned];
        for (const id of executedIds) {
          if (!ids.includes(id)) ids.push(id);
        }
        return {
          ...run,
          executors: ids.map((id) => ({
            id,
            name: executorUserMap.get(id)?.name || '不明な実施者',
          })),
        };
      }),
      projects: dashboardProjects,
      todos,
      shortcuts,
    };
  }
}

export const dashboardService = new DashboardService();
