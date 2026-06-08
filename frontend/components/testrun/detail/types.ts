export interface TestResultAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  fieldName?: string | null;
  uploadedAt: string;
}

export interface TestCaseStepSnapshot {
  id: string;
  stepNumber: number;
  action: string;
  expectedResult: string;
}

export interface TestCaseSnapshot {
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
  capturedAt: string;
}

export interface TestResult {
  id: string;
  status: 'NOT_STARTED' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'SKIPPED' | 'RETEST';
  /** マスターのテストケースが削除されている場合は null になる */
  testCaseId: string | null;
  testCase: TestCase;
  /** テストランへの追加時点で固定されたテストケースの内容（編集の影響を受けない） */
  testCaseSnapshot?: TestCaseSnapshot | null;
  /** マスターのテストケースが削除されている場合 true（snapshot から testCase を再構築している） */
  testCaseDeleted?: boolean;
  comment?: string;
  duration?: number;
  executedAt?: string;
  executedById?: string;
  executedBy?: {
    id?: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  attachments?: TestResultAttachment[];
}

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TestLayer = 'SMOKE' | 'CORE' | 'EXTENDED' | 'UNKNOWN';

export interface TestCase {
  id: string;
  tcId?: string;
  rtcId?: string | null;
  name?: string;
  title?: string;
  description?: string;
  priority: Priority | string;
  status: string;
  estimatedTime?: number | null;
  layer?: TestLayer | string | null;
  suiteId?: string | null;
  module?: {
    id: string;
    name: string;
  } | null;
  testCaseSuites?: Array<{
    testSuite: {
      id: string;
      name: string;
    };
  }>;
}

export interface TestRun {
  id: string;
  name: string;
  description?: string;
  executionType?: 'MANUAL' | 'AUTOMATION' | string;
  version?: string;
  status: 'NOT_STARTED' | 'PLANNED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  environment?: string;
  verificationEnvironment?: string;
  verificationEnvironmentNote?: string | null;
  platform?: string;
  device?: string;
  assignedToIds?: string[];
  assignedToList?: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  project: {
    id: string;
    name: string;
    key: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  results: TestResult[];
  testCases?: TestCase[];
  _count?: {
    results: number;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ResultFormData extends Record<string, string> {
  status: string;
  comment: string;
  executedById: string;
}

export interface TestSuite {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  testCases: TestCase[];
  _count?: {
    testCases: number;
  };
}

export interface TestRunStats {
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
  pending: number;
  total: number;
}
