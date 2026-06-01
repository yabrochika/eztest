import { testRunService } from '@/backend/services/testrun/services';
import { emailService } from '@/backend/services/email/services';
import { 
  createTestRunSchema, 
  updateTestRunSchema, 
  addTestResultSchema 
} from '@/backend/validators/testrun.validator';
import { ValidationException } from '@/backend/utils/exceptions';
import { TestRunMessages } from '@/backend/constants/static_messages';

function normalizeMultiSelectInput(value?: string | string[]): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const normalizedValues = value.map((item) => item.trim()).filter(Boolean);
    return normalizedValues.length > 0 ? normalizedValues.join(',') : undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeIdArray(value?: string[]): string[] | undefined {
  if (!value || value.length === 0) {
    return undefined;
  }

  const normalized = value.map((item) => item.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized : undefined;
}

export class TestRunController {
  /**
   * Get all test runs for a project
   */
  async getProjectTestRuns(
    projectId: string,
    filters?: {
      status?: string;
      assignedToId?: string;
      environment?: string;
      search?: string;
    }
  ) {
    const testRuns = await testRunService.getProjectTestRuns(
      projectId,
      filters
    );

    return { data: testRuns };
  }

  /**
   * Get a single test run by ID
   */
  async getTestRunById(
    testRunId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userId: string
  ) {
    const testRun = await testRunService.getTestRunById(testRunId);

    if (!testRun) {
      throw new ValidationException(TestRunMessages.TestRunNotFound);
    }

    // Get statistics
    const stats = await testRunService.getTestRunStats(testRunId);

    return {
      data: {
        ...testRun,
        stats,
      },
    };
  }

  /**
   * Create a new test run
   */
  async createTestRun(
    body: unknown,
    projectId: string,
    userId: string
  ) {
    const validationResult = createTestRunSchema.safeParse(body);
    if (!validationResult.success) {
      throw new ValidationException(
        'Validation failed',
        validationResult.error.issues
      );
    }

    const validatedData = validationResult.data;
    const assignedToIds = normalizeIdArray(validatedData.assignedToIds);
    const environment = normalizeMultiSelectInput(validatedData.environment);
    const verificationEnvironment = normalizeMultiSelectInput(
      validatedData.verificationEnvironment
    );
    const verificationEnvironmentNote =
      validatedData.verificationEnvironmentNote?.trim() || undefined;
    const platform = normalizeMultiSelectInput(validatedData.platform);
    const device = normalizeMultiSelectInput(validatedData.device);

    // Sanitize assignedToId - convert empty string or 'none' to undefined
    let assignedToId = validatedData.assignedToId || assignedToIds?.[0];
    if (!assignedToId || assignedToId === 'none' || assignedToId === '') {
      assignedToId = undefined;
    }

    const testRun = await testRunService.createTestRun({
      projectId,
      name: validatedData.name,
      description: validatedData.description,
      executionType: validatedData.executionType,
      assignedToId,
      assignedToIds,
      environment,
      verificationEnvironment,
      verificationEnvironmentNote,
      version: validatedData.version,
      platform,
      device,
      status: validatedData.status,
      testCaseIds: validatedData.testCaseIds,
      testSuiteIds: validatedData.testSuiteIds,
      createdById: userId,
    });

    return { data: testRun, statusCode: 201 };
  }

  /**
   * Update a test run
   */
  async updateTestRun(
    body: unknown,
    testRunId: string
  ) {
    const validationResult = updateTestRunSchema.safeParse(body);
    if (!validationResult.success) {
      throw new ValidationException(
        'Validation failed',
        validationResult.error.issues
      );
    }

    const validatedData = validationResult.data;
    const assignedToIds = normalizeIdArray(validatedData.assignedToIds);
    const environment = normalizeMultiSelectInput(validatedData.environment);
    const verificationEnvironment = normalizeMultiSelectInput(
      validatedData.verificationEnvironment
    );
    // Use null when explicitly cleared (empty string) so Prisma sets it to NULL.
    // Use undefined when not provided so Prisma leaves it untouched.
    const verificationEnvironmentNote =
      validatedData.verificationEnvironmentNote === undefined
        ? undefined
        : validatedData.verificationEnvironmentNote.trim() || null;
    const platform = normalizeMultiSelectInput(validatedData.platform);
    const device = normalizeMultiSelectInput(validatedData.device);

    const testRun = await testRunService.updateTestRun(testRunId, {
      ...validatedData,
      assignedToId: validatedData.assignedToId || assignedToIds?.[0],
      assignedToIds,
      environment,
      verificationEnvironment,
      verificationEnvironmentNote,
      platform,
      device,
    });

    return { data: testRun };
  }

  /**
   * Delete a test run
   */
  async deleteTestRun(testRunId: string) {
    await testRunService.deleteTestRun(testRunId);

    return { message: TestRunMessages.TestRunDeletedSuccessfully };
  }

  /**
   * Start a test run
   */
  async startTestRun(testRunId: string) {
    const testRun = await testRunService.startTestRun(testRunId);

    return { data: testRun };
  }

  /**
   * Complete a test run
   */
  async completeTestRun(testRunId: string) {
    const testRun = await testRunService.completeTestRun(testRunId);
    
    // Check if email service is available for report sending
    const emailAvailable = await emailService.isEmailServiceAvailable();

    return {
      data: {
        ...testRun,
        emailAvailable,
        emailStatusMessage: emailAvailable
          ? 'Email service is available. You can send report to recipients.'
          : 'Email service is not configured. Report cannot be sent.',
      },
    };
  }

  /**
   * Reopen a completed test run
   */
  async reopenTestRun(testRunId: string) {
    const testRun = await testRunService.reopenTestRun(testRunId);

    return { data: testRun };
  }

  /**
   * Add test result to test run
   */
  async addTestResult(
    body: unknown,
    testRunId: string,
    userId: string
  ) {
    const validationResult = addTestResultSchema.safeParse(body);
    if (!validationResult.success) {
      throw new ValidationException(
        'Validation failed',
        validationResult.error.issues
      );
    }

    const validatedData = validationResult.data;

    // 実行者は既定で認証ユーザー。明示指定された場合は、対象テストランの
    // プロジェクトに所属するメンバーであることを検証し、任意ユーザーへの
    // なりすまし帰属を防ぐ。
    const executedById = validatedData.executedById ?? userId;
    if (executedById !== userId) {
      const isProjectMember = await testRunService.hasAccessToTestRun(
        testRunId,
        executedById
      );
      if (!isProjectMember) {
        throw new ValidationException(
          '指定された実行者はこのテストランのプロジェクトメンバーではありません'
        );
      }
    }

    const result = await testRunService.addTestResult(
      testRunId,
      validatedData.testCaseId,
      {
        status: validatedData.status,
        executedById,
        duration: validatedData.duration,
        comment: validatedData.comment,
        errorMessage: validatedData.errorMessage,
        stackTrace: validatedData.stackTrace,
      }
    );

    return { data: result, statusCode: 201 };
  }

  /**
   * テストランから特定のテストケースを除外する
   */
  async removeTestCaseFromTestRun(testRunId: string, testCaseId: string) {
    if (!testCaseId) {
      throw new ValidationException('testCaseId is required');
    }

    // テストランの存在確認（404 vs 200 を明確化するため）
    const testRun = await testRunService.getTestRunById(testRunId);
    if (!testRun) {
      throw new ValidationException(TestRunMessages.TestRunNotFound);
    }

    const result = await testRunService.removeTestCaseFromTestRun(
      testRunId,
      testCaseId
    );

    if (!result.removed) {
      // 既に除外済み・存在しない場合も冪等に成功扱い
      return {
        data: {
          removed: false,
          message: '対象テストケースは既にテストランに含まれていません',
        },
      };
    }

    return {
      data: {
        removed: true,
        previousStatus: result.previousStatus,
        message: 'テストケースをテストランから除外しました',
      },
    };
  }

  /**
   * Check XML for matching test cases before import
   */
  async checkXMLMatches(
    xmlContent: string,
    projectId: string
  ) {
    const result = await testRunService.checkXMLTestCasesMatch(
      xmlContent,
      projectId
    );

    return {
      data: result,
      statusCode: 200,
    };
  }

  /**
   * Upload and parse TestNG XML results
   */
  async uploadTestNGXML(
    xmlContent: string,
    testRunId: string,
    userId: string
  ) {
    // Get test run to get projectId
    const testRun = await testRunService.getTestRunById(testRunId);
    if (!testRun) {
      throw new ValidationException(TestRunMessages.TestRunNotFound);
    }

    const result = await testRunService.parseTestNGXMLAndImportResults(
      xmlContent,
      testRunId,
      testRun.projectId,
      userId
    );

    return {
      data: result,
      statusCode: 200,
    };
  }

  /**
   * Send test run report via email
   */
  async sendTestRunReport(testRunId: string, userId: string) {
    // Check if test run exists
    const testRun = await testRunService.getTestRunById(testRunId);
    if (!testRun) {
      throw new ValidationException(TestRunMessages.TestRunNotFound);
    }

    const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000';

    // Delegate to service to get validated recipients and send emails
    const result = await testRunService.sendTestRunReport(
      testRunId,
      userId,
      appUrl
    );

    return { data: result };
  }
}

export const testRunController = new TestRunController();
