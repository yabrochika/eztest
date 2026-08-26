import type { Project } from '@/frontend/components/project/types';

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
  testRuns: number;
  testRunSuites: number;
  resultCounts: PieStatusCounts;
  runs: WeeklyRunDetail[];
}

export interface TimelineRun {
  id: string;
  name: string;
  status: string;
  projectId: string;
  projectName: string;
  projectKey: string;
  startAt: string;
  endAt: string;
  resultCounts: PieStatusCounts;
}

export interface DashboardRunItem {
  id: string;
  title: string;
  status: string;
  tcId?: string | null;
}

export interface DashboardRecentRun {
  id: string;
  name: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  resultCounts: PieStatusCounts;
  suites: Array<{ id: string; name: string }>;
  items: DashboardRunItem[];
}

export interface DashboardExecutor {
  id: string;
  name: string;
  email: string;
  resultCounts: PieStatusCounts;
  lastExecutedAt: string | null;
}

export interface DashboardProject extends Project {
  lastActivityAt: string | null;
  resultCounts: ResultStatusCounts;
  recentActivity: ActivityDay[];
  openTestRuns: number;
  weeklyTrend: WeeklyTrendPoint[];
  recentRuns: DashboardRecentRun[];
  executors: DashboardExecutor[];
}

export interface DashboardTodoTestRun {
  id: string;
  name: string;
  status: string;
  projectId: string;
  projectName: string;
  projectKey: string;
}

export interface DashboardTodoDefect {
  id: string;
  defectId: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
  projectName: string;
  projectKey: string;
}

export interface InProgressRun {
  id: string;
  name: string;
  status: string;
  projectId: string;
  projectName: string;
  projectKey: string;
  startedAt: string | null;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  resultCounts: PieStatusCounts;
}

export interface DashboardData {
  rangeDays: number;
  weekCount: number;
  weekRange: {
    start: string;
    end: string;
  };
  timeline: TimelineRun[];
  inProgressRuns: InProgressRun[];
  activity: {
    days: ActivityDay[];
    totals: ResultStatusCounts;
  };
  projects: DashboardProject[];
  todos: {
    testRuns: DashboardTodoTestRun[];
    defects: DashboardTodoDefect[];
  };
}
