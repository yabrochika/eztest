import { prisma } from '@/lib/prisma';
import { ParsedRow } from '@/lib/file-parser';
import { ValidationException } from '@/backend/utils/exceptions';
import { defectService } from '@/backend/services/defect/services';

export type ImportType = 'testcases' | 'defects';

export interface MigrationResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{
    row: number;
    title: string;
    error: string;
  }>;
  skippedItems: Array<{
    row: number;
    title: string;
    reason: string;
  }>;
  imported: Array<{
    tcId?: string;
    defectId?: string;
    title: string;
  }>;
}

export class ImportService {
  /**
   * Normalize column names to handle both export format and import format
   */
  private normalizeColumnName(columnName: string): string {
    const normalized = columnName.trim().toLowerCase();
    
    // Map export format column names to import format
    const columnMap: Record<string, string> = {
      // New test case fields
      'test case id': 'testCaseId',
      'testcase id': 'testCaseId',
      'テストケースid': 'testCaseId',
      'test case title': 'title',
      'testcase title': 'title',
      'title': 'title',
      'テストケースタイトル': 'title',
      'module / feature': 'moduleFeature',
      'module/feature': 'moduleFeature',
      'module': 'module',
      'feature': 'module',
      'モジュール/機能': 'moduleFeature',
      'モジュール': 'module',
      'domain': 'domain',
      'ドメイン': 'domain',
      'function': 'function',
      '機能': 'function',
      'priority': 'priority',
      '優先度': 'priority',
      'preconditions': 'preconditions',
      '事前条件': 'preconditions',
      'test steps': 'testSteps',
      'teststeps': 'testSteps',
      'テストステップ': 'testSteps',
      'test data': 'testData',
      'testdata': 'testData',
      'テストデータ': 'testData',
      'expected result': 'expectedResult',
      'expectedresult': 'expectedResult',
      '期待結果': 'expectedResult',
      'status': 'status',
      'ステータス': 'status',
      // Defect linking for test cases
      'defect id': 'defectId',
      'defectid': 'defectId',
      'defect': 'defectId',
      '欠陥id': 'defectId',
      // Older fields (kept for backward compatibility)
      'description': 'description',
      '説明': 'description',
      'estimated time (minutes)': 'estimatedTime',
      'estimated time': 'estimatedTime',
      '見積時間（分）': 'estimatedTime',
      '見積時間': 'estimatedTime',
      'postconditions': 'postconditions',
      '事後条件': 'postconditions',
      'test suites': 'testsuite',
      'testsuite': 'testsuite',
      'test suite': 'testsuite',
      'テストスイート': 'testsuite',
      // Additional test case fields
      'rtc-id': 'rtcId',
      'rtcid': 'rtcId',
      'rtc id': 'rtcId',
      'flow-id': 'flowId',
      'flowid': 'flowId',
      'flow id': 'flowId',
      'layer': 'layer',
      'レイヤー': 'layer',
      'target': 'target',
      '対象': 'target',
      'test type': 'testType',
      'testtype': 'testType',
      'テスト種別': 'testType',
      'evidence': 'evidence',
      'evidence code': 'evidence',
      'evidencecode': 'evidence',
      '根拠コード': 'evidence',
      'notes': 'notes',
      '備考': 'notes',
      'automation': 'automation',
      '自動化': 'automation',
      'environment': 'environment',
      '環境': 'environment',
      'module category': 'moduleCategory',
      'modulecategory': 'moduleCategory',
      'domain category': 'moduleCategory',
      'domaincategory': 'moduleCategory',
      'ドメインカテゴリ': 'moduleCategory',
      'ドメイン': 'moduleCategory',
      'feature category': 'featureCategory',
      'featurecategory': 'featureCategory',
      '機能カテゴリ': 'featureCategory',
      '機能': 'featureCategory',
      // Defect columns (for defect import)
      'defect title / summary': 'title',
      'defect title': 'title',
      'summary': 'title',
      'severity': 'severity',
      'assigned to': 'assignedTo',
      'environment': 'environment',
      'reported by': 'reportedBy',
      'reportedby': 'reportedBy',
      'reported date': 'reportedDate',
      'reporteddate': 'reportedDate',
      'due date': 'dueDate',
    };
    
    return columnMap[normalized] || normalized;
  }

  /**
   * Get value from row using normalized column name
   */
  private getRowValue(row: ParsedRow, normalizedKey: string): string | number | null | undefined {
    // Try normalized key first
    if (row[normalizedKey] !== undefined) {
      return row[normalizedKey];
    }
    
    // Try to find by case-insensitive match
    const foundKey = Object.keys(row).find(
      (key) => this.normalizeColumnName(key) === normalizedKey
    );
    
    return foundKey ? row[foundKey] : undefined;
  }

  /**
   * Import data based on type
   */
  async importData(
    type: ImportType,
    projectId: string,
    userId: string,
    data: ParsedRow[]
  ): Promise<MigrationResult> {
    switch (type) {
      case 'testcases':
        return this.importTestCases(projectId, userId, data);
      case 'defects':
        return this.importDefects(projectId, userId, data);
      default:
        throw new ValidationException(`Unsupported import type: ${type}`);
    }
  }

  /**
   * Import test cases from parsed data
   */
  private async importTestCases(
    projectId: string,
    userId: string,
    data: ParsedRow[]
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      skippedItems: [],
      imported: [],
    };

    // Get project to validate
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        modules: true,
        testSuites: true,
      },
    });

    if (!project) {
      throw new ValidationException('Project not found');
    }

    // Get existing test cases to generate next tcId
    const existingTestCases = await prisma.testCase.findMany({
      where: { projectId },
      select: { tcId: true, title: true },
      orderBy: { tcId: 'desc' },
    });

    // Create a set of existing tcIds for quick lookup
    const existingTcIds = new Set(existingTestCases.map((tc) => tc.tcId));

    // Get existing defects to validate defect IDs
    const existingDefects = await prisma.defect.findMany({
      where: { projectId },
      select: { id: true, defectId: true, title: true },
    });

    // Create a map of defectId (display ID) to defect database id and title
    // Case-sensitive matching - preserve original case
    const defectIdToDefect = new Map(
      existingDefects.map((d) => [d.defectId, { id: d.id, title: d.title }])
    );

    let nextTcIdNumber = 1;
    if (existingTestCases.length > 0) {
      const lastTcId = existingTestCases[0].tcId;
      // Extract number from TC-XXX or tcXXX format
      const match = lastTcId.match(/\d+/);
      if (match) {
        nextTcIdNumber = parseInt(match[0], 10) + 1;
      }
    }

    // Get dropdown options for validation
    const [priorities, statuses] = await Promise.all([
      prisma.dropdownOption.findMany({
        where: { entity: 'TestCase', field: 'priority' },
        select: { value: true },
      }),
      prisma.dropdownOption.findMany({
        where: { entity: 'TestCase', field: 'status' },
        select: { value: true },
      }),
    ]);

    const validPriorities = new Set(priorities.map((p) => p.value.toUpperCase()));
    const validStatuses = new Set(statuses.map((s) => s.value.toUpperCase()));

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because of header row and 1-based indexing

      try {
        // Get values using normalized column names
        // Note: Test Case ID is always auto-generated, not read from import
        const title = this.getRowValue(row, 'title');
        const description = this.getRowValue(row, 'description');
        const expectedResult = this.getRowValue(row, 'expectedResult');
        const priority = this.getRowValue(row, 'priority');
        const status = this.getRowValue(row, 'status');
        const domain = this.getRowValue(row, 'domain');
        const functionValue = this.getRowValue(row, 'function');
        const estimatedTime = this.getRowValue(row, 'estimatedTime');
        const preconditions = this.getRowValue(row, 'preconditions');
        const postconditions = this.getRowValue(row, 'postconditions');
        const moduleValue = this.getRowValue(row, 'module');
        const moduleFeature = this.getRowValue(row, 'moduleFeature');
        const testsuite = this.getRowValue(row, 'testsuite');
        
        // Debug log for Test Suite
        console.log(`Row ${rowNumber}: title="${title}"`);
        console.log(`  moduleValue="${moduleValue}", moduleFeature="${moduleFeature}", testsuite="${testsuite}"`);
        console.log(`  Row keys: ${Object.keys(row).join(', ')}`);
        const testSteps = this.getRowValue(row, 'testSteps');
        const testData = this.getRowValue(row, 'testData');
        const defectId = this.getRowValue(row, 'defectId');
        // Additional fields
        const rtcId = this.getRowValue(row, 'rtcId');
        const flowId = this.getRowValue(row, 'flowId');
        const layer = this.getRowValue(row, 'layer');
        const target = this.getRowValue(row, 'target');
        const testType = this.getRowValue(row, 'testType');
        const evidence = this.getRowValue(row, 'evidence');
        const notes = this.getRowValue(row, 'notes');
        const automation = this.getRowValue(row, 'automation');
        const environment = this.getRowValue(row, 'environment');
        const moduleCategory = this.getRowValue(row, 'moduleCategory');
        const featureCategory = this.getRowValue(row, 'featureCategory');

        // Validate required field
        if (!title || typeof title !== 'string' || title.toString().trim() === '') {
          throw new Error('Test Case Title is required');
        }

        const testCaseTitle = title.toString().trim();

        // Process defect IDs if provided (supports multiple defects: comma or semicolon separated)
        // Store all defect IDs (both existing and pending) for later linking
        const defectsToLink: Array<{ id: string; title: string; defectId: string }> = [];
        const pendingDefectIds: string[] = [];
        
        if (defectId && typeof defectId === 'string' && defectId.toString().trim()) {
          // Parse multiple defect IDs (comma or semicolon separated)
          // Preserve original case for case-sensitive matching
          const defectIdString = defectId.toString().trim();
          const defectIdList = defectIdString
            .split(/[,;]/)
            .map(id => id.trim())
            .filter(id => id.length > 0);
          
          for (const providedDefectId of defectIdList) {
            // Check for existing defect (case-sensitive match - exact case required)
            const foundDefect = defectIdToDefect.get(providedDefectId);
            
            if (foundDefect) {
              // Defect exists - link immediately
              defectsToLink.push({
                ...foundDefect,
                defectId: providedDefectId, // Preserve original case
              });
            } else {
              // Defect doesn't exist yet - store for later linking (preserve original case)
              pendingDefectIds.push(providedDefectId);
            }
          }
        }

        // Find or create module first
        // Use moduleFeature (Module / Feature column) or moduleValue (Module column)
        let moduleId: string | undefined;
        const moduleNameToUse = moduleFeature || moduleValue;
        if (moduleNameToUse && typeof moduleNameToUse === 'string' && moduleNameToUse.toString().trim()) {
          const moduleName = moduleNameToUse.toString().trim();
          let foundModule = project.modules.find(
            (m) => m.name.toLowerCase() === moduleName.toLowerCase()
          );

          if (!foundModule) {
            // Create module
            foundModule = await prisma.module.create({
              data: {
                name: moduleName,
                projectId,
              },
            });
            // Add to project modules array to avoid duplicate creation
            project.modules.push(foundModule);
          }
          moduleId = foundModule.id;
        }

        // Find or create suite (needed for duplicate check)
        // Use testsuite (Test Suites column) for Test Suite
        let suiteId: string | undefined;
        console.log(`  -> Checking testsuite: "${testsuite}" (type: ${typeof testsuite})`);
        if (testsuite && typeof testsuite === 'string' && testsuite.toString().trim()) {
          const suiteName = testsuite.toString().trim();
          console.log(`  -> Creating/finding suite: "${suiteName}"`);
          let foundSuite = project.testSuites.find(
            (s) => s.name.toLowerCase() === suiteName.toLowerCase()
          );

          if (!foundSuite) {
            // Create suite
            foundSuite = await prisma.testSuite.create({
              data: {
                name: suiteName,
                projectId,
              },
            });
            // Add to project test suites array to avoid duplicate creation
            project.testSuites.push(foundSuite);
            console.log(`  -> Created new suite: "${suiteName}" with ID: ${foundSuite.id}`);
          } else {
            console.log(`  -> Found existing suite: "${suiteName}" with ID: ${foundSuite.id}`);
          }
          suiteId = foundSuite.id;
        } else {
          console.log(`  -> No testsuite value found for this row`);
        }

        // Check if test case with same title AND same test suite already exists
        // This allows same title in different test suites
        let existingTestCase = null;
        if (suiteId) {
          // If suite is specified, check for title + suite combination
          existingTestCase = await prisma.testCase.findFirst({
            where: {
              projectId,
              title: {
                equals: testCaseTitle,
                mode: 'insensitive',
              },
              testCaseSuites: {
                some: {
                  testSuiteId: suiteId,
                },
              },
            },
          });
        } else {
          // If no suite specified, check for title without any suite
          existingTestCase = await prisma.testCase.findFirst({
            where: {
              projectId,
              title: {
                equals: testCaseTitle,
                mode: 'insensitive',
              },
              testCaseSuites: {
                none: {},
              },
            },
          });
        }

        // Flag to track if this is an update or create
        const isUpdate = !!existingTestCase;

        // Validate priority - use default if invalid
        let priorityValue = priority
          ? priority.toString().toUpperCase()
          : 'MEDIUM';
        if (!validPriorities.has(priorityValue)) {
          // Try to extract valid priority from value (e.g., "High" -> "HIGH")
          const upperPriority = priorityValue.toUpperCase();
          if (validPriorities.has(upperPriority)) {
            priorityValue = upperPriority;
          } else {
            // Use default if invalid
            priorityValue = 'MEDIUM';
          }
        }

        // Validate status - use default if invalid
        let statusValue = status ? status.toString().toUpperCase() : 'ACTIVE';
        if (!validStatuses.has(statusValue)) {
          // Try to extract valid status from value (e.g., "ACTIVE_iOS" -> check if starts with valid status)
          let foundStatus = false;
          for (const validStatus of validStatuses) {
            if (statusValue.startsWith(validStatus)) {
              statusValue = validStatus;
              foundStatus = true;
              break;
            }
          }
          if (!foundStatus) {
            // Use default if invalid
            statusValue = 'ACTIVE';
          }
        }

        // Parse estimated time
        let estimatedTimeValue: number | undefined;
        if (estimatedTime) {
          const parsed = parseInt(estimatedTime.toString(), 10);
          if (!isNaN(parsed) && parsed > 0) {
            estimatedTimeValue = parsed;
          }
        }

        // Parse expected results if provided (can be numbered list, newline-separated, or single value)
        let expectedResultsList: string[] = [];
        let singleExpectedResult: string | null = null;
        
        if (expectedResult && typeof expectedResult === 'string' && expectedResult.toString().trim()) {
          const expectedResultText = expectedResult.toString().trim();
          
          // Check if it contains numbered points at the start of lines
          // Pattern: line starting with number followed by dot or space (e.g., "1.", "2.", "1 ", "2 ")
          const numberedPointPattern = /(?:^|\n)\s*(\d+)[.\s]+/g;
          const numberedPointsMatches = expectedResultText.match(numberedPointPattern);
          const numberedPointsCount = numberedPointsMatches ? numberedPointsMatches.length : 0;
          
          if (numberedPointsCount > 1) {
            // Multiple numbered points - split by numbered points while preserving content between them
            // This keeps all content (including newlines, bullet points) between numbered points together
            const items: string[] = [];
            
            // Find all numbered point positions
            const positions: { index: number; number: number; matchLength: number }[] = [];
            const regex = /(?:^|\n)\s*(\d+)[.\s]+/g;
            let match;
            while ((match = regex.exec(expectedResultText)) !== null) {
              positions.push({
                index: match.index,
                number: parseInt(match[1]),
                matchLength: match[0].length
              });
            }
            
            // Extract content between numbered points
            for (let i = 0; i < positions.length; i++) {
              const current = positions[i];
              const nextIndex = i + 1 < positions.length ? positions[i + 1].index : expectedResultText.length;
              
              // Get content from after the number prefix to the next number (or end)
              const startIndex = current.index + current.matchLength;
              // Adjust for newline at the start of match (if not the first match)
              const adjustedStart = current.index > 0 && expectedResultText[current.index] === '\n' 
                ? startIndex 
                : startIndex;
              const content = expectedResultText.substring(adjustedStart, nextIndex).trim();
              
              if (content) {
                items.push(content);
              }
            }
            
            expectedResultsList = items;
          } else if (numberedPointsCount === 1) {
            // Single numbered point - treat as single result, remove the number prefix
            singleExpectedResult = expectedResultText.replace(/^\s*\d+[.\s]+/, '').trim();
          } else {
            // No numbered points - single expected result
            singleExpectedResult = expectedResultText;
          }
        }

        // Parse test steps if provided
        // Also handle case where Expected Result column has values but Test Steps is empty
        let testStepsData: Array<{ stepNumber: number; action: string; expectedResult: string }> | undefined;
        
        // If Test Steps is empty but Expected Result has values, create steps from expected results
        if (!testSteps && (expectedResultsList.length > 0 || singleExpectedResult)) {
          if (expectedResultsList.length > 0) {
            // Multiple expected results - create one step per expected result
            testStepsData = expectedResultsList.map((expectedResult, index) => ({
              stepNumber: index + 1,
              action: '', // No action, only expected result
              expectedResult: expectedResult,
            }));
          } else if (singleExpectedResult) {
            // Single expected result - create one step
            testStepsData = [{
              stepNumber: 1,
              action: '', // No action, only expected result
              expectedResult: singleExpectedResult,
            }];
          }
        } else if (testSteps) {
          try {
            // Check if it's already an array
            if (Array.isArray(testSteps)) {
              testStepsData = testSteps
                .filter((step) => {
                  // Filter out invalid steps
                  if (typeof step === 'object' && step !== null) {
                    return step.action || step.step;
                  }
                  return Boolean(step);
                })
                .map((step, index) => {
                  const stepAction = (typeof step === 'object' && step !== null) 
                    ? (step.action || step.step || '') 
                    : String(step);
                  const stepExpectedResult = (typeof step === 'object' && step !== null) 
                    ? (step.expectedResult || step.expected || '') 
                    : '';
                  // Use Expected Result column if step doesn't have expected result
                  const finalExpectedResult = stepExpectedResult || expectedResultsList[index] || singleExpectedResult || '';
                  
                  return {
                    stepNumber: step.stepNumber || (typeof step === 'object' && step !== null ? index + 1 : index + 1),
                    action: stepAction,
                    expectedResult: finalExpectedResult,
                  };
                });
            }
            // If it's a string, try to parse it
            else if (typeof testSteps === 'string' && testSteps.trim()) {
              try {
                // Try to parse as JSON first (if it's a JSON array string)
                const parsed = JSON.parse(testSteps);
                if (Array.isArray(parsed)) {
                  testStepsData = parsed
                    .filter((step) => step && (step.action || step.step)) // Filter out invalid steps
                    .map((step, index) => {
                      const stepAction = step.action || step.step || '';
                      const stepExpectedResult = step.expectedResult || step.expected || '';
                      // Use Expected Result column if step doesn't have expected result
                      const finalExpectedResult = stepExpectedResult || expectedResultsList[index] || singleExpectedResult || '';
                      
                      return {
                        stepNumber: step.stepNumber || index + 1,
                        action: stepAction,
                        expectedResult: finalExpectedResult,
                      };
                    });
                }
              } catch {
                // If not JSON, try to parse as numbered list
                const stepsText = testSteps.trim();
                
                // Parse test steps using the same method as expected results
                // Check for numbered points (1., 2., or 1 , 2 )
                const numberedPointPattern = /(?:^|\n)\s*(\d+)[.\s]+/g;
                const numberedPointsMatches = stepsText.match(numberedPointPattern);
                const numberedPointsCount = numberedPointsMatches ? numberedPointsMatches.length : 0;
                
                if (numberedPointsCount > 1) {
                  // Multiple numbered points - split by numbered points
                  const stepItems: string[] = [];
                  const stepNumbers: number[] = [];
                  
                  // Find all numbered point positions
                  const positions: { index: number; number: number; matchLength: number }[] = [];
                  const regex = /(?:^|\n)\s*(\d+)[.\s]+/g;
                  let match;
                  while ((match = regex.exec(stepsText)) !== null) {
                    positions.push({
                      index: match.index,
                      number: parseInt(match[1]),
                      matchLength: match[0].length
                    });
                  }
                  
                  // Extract content between numbered points
                  for (let j = 0; j < positions.length; j++) {
                    const current = positions[j];
                    const nextIndex = j + 1 < positions.length ? positions[j + 1].index : stepsText.length;
                    
                    const startIndex = current.index + current.matchLength;
                    const content = stepsText.substring(startIndex, nextIndex).trim();
                    
                    if (content) {
                      stepItems.push(content);
                      stepNumbers.push(current.number);
                    }
                  }
                  
                  testStepsData = stepItems.map((action, index) => {
                    const stepNumber = stepNumbers[index];
                    // Get expected result matching by step number (1-based index in expectedResultsList)
                    const expectedResultValue = expectedResultsList[index] || singleExpectedResult || '';
                    
                    return {
                      stepNumber: stepNumber,
                      action: action,
                      expectedResult: expectedResultValue,
                    };
                  });
                } else if (numberedPointsCount === 1) {
                  // Single numbered step
                  const action = stepsText.replace(/^\s*\d+[.\s]+/, '').trim();
                  const expectedResultValue = expectedResultsList[0] || singleExpectedResult || '';
                  
                  testStepsData = [{
                    stepNumber: 1,
                    action: action,
                    expectedResult: expectedResultValue,
                  }];
                } else {
                  // No numbered points - check for newlines or pipe separator
                  let stepLines: string[] = [];
                  
                  if (stepsText.includes('\n')) {
                    stepLines = stepsText.split('\n').map(s => s.trim()).filter(s => s);
                  } else if (stepsText.includes('|')) {
                    stepLines = stepsText.split('|').map(s => s.trim()).filter(s => s);
                  } else {
                    stepLines = [stepsText];
                  }
                  
                  testStepsData = stepLines.map((line, index) => {
                    const expectedResultValue = expectedResultsList[index] || singleExpectedResult || '';
                    return {
                      stepNumber: index + 1,
                      action: line,
                      expectedResult: expectedResultValue,
                    };
                  });
                }
              }
            }
          } catch (error) {
            console.warn(`Failed to parse test steps for row ${rowNumber}:`, error);
            // Continue without steps if parsing fails
          }
        }

        // Parse test data
        const testDataValue = testData && typeof testData === 'string' && testData.toString().trim()
          ? testData.toString().trim()
          : null;

        // Determine the expected result value to use for the test case
        // If there are no test steps, use the parsed expected result (singleExpectedResult) or original value
        // If there are test steps with individual expected results, only set test case level if single value
        let finalExpectedResult: string | null = null;
        if (!testStepsData || testStepsData.length === 0) {
          // No test steps - use the parsed expected result if available, otherwise use original value
          finalExpectedResult = singleExpectedResult || (expectedResult && typeof expectedResult === 'string' && expectedResult.toString().trim() ? expectedResult.toString().trim() : null);
        } else {
          // Has test steps - check if multiple expected results were parsed
          if (expectedResultsList.length > 1) {
            // Multiple expected results assigned to steps - don't set test case level expectedResult
            // to avoid overwriting first step's individual expected result in the UI
            finalExpectedResult = null;
          } else if (expectedResultsList.length === 1) {
            // Single expected result in list - use it for test case level
            finalExpectedResult = expectedResultsList[0];
          } else if (singleExpectedResult) {
            // Single expected result - use it for test case level
            finalExpectedResult = singleExpectedResult;
          } else {
            // No expected results parsed - use original value if provided
            finalExpectedResult = expectedResult && typeof expectedResult === 'string' && expectedResult.toString().trim() ? expectedResult.toString().trim() : null;
          }
        }

        // Prepare update/create data
        const testCaseData = {
          title: testCaseTitle,
          description: description
            ? description.toString().trim()
            : null,
          expectedResult: finalExpectedResult,
          priority: priorityValue,
          status: statusValue,
          domain: domain
            ? domain.toString().trim()
            : null,
          function: functionValue
            ? functionValue.toString().trim()
            : null,
          estimatedTime: estimatedTimeValue,
          preconditions: preconditions
            ? preconditions.toString().trim()
            : null,
          postconditions: postconditions
            ? postconditions.toString().trim()
            : null,
          testData: testDataValue,
          pendingDefectIds: pendingDefectIds.length > 0 ? pendingDefectIds.join(', ') : null,
          moduleId,
          suiteId,
          // Additional fields
          rtcId: rtcId ? rtcId.toString().trim() : null,
          flowId: flowId ? flowId.toString().trim() : null,
          layer: layer ? layer.toString().trim() : null,
          target: target ? target.toString().trim() : null,
          testType: testType ? testType.toString().trim() : null,
          evidence: evidence ? evidence.toString().trim() : null,
          notes: notes ? notes.toString().trim() : null,
          automation: automation ? automation.toString().trim() : null,
          environment: environment ? environment.toString().trim() : null,
          moduleCategory: moduleCategory ? moduleCategory.toString().trim() : null,
          featureCategory: featureCategory ? featureCategory.toString().trim() : null,
        };

        let testCase;
        
        console.log(`  -> Creating/updating test case: isUpdate=${isUpdate}, existingTestCase=${!!existingTestCase}, moduleId=${moduleId}, suiteId=${suiteId}`);
        
        if (isUpdate && existingTestCase) {
          // Update existing test case
          // First, delete existing steps
          await prisma.testStep.deleteMany({
            where: { testCaseId: existingTestCase.id },
          });

          // Update the test case
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          testCase = await (prisma.testCase.update as any)({
            where: { id: existingTestCase.id },
            data: {
              ...testCaseData,
              steps: testStepsData && testStepsData.length > 0
                ? {
                    create: testStepsData
                      .filter((step) => (step.action && step.action.trim()) || (step.expectedResult && step.expectedResult.trim()))
                      .map((step) => ({
                        stepNumber: step.stepNumber,
                        action: step.action && step.action.trim() ? step.action.trim() : '',
                        expectedResult: step.expectedResult && step.expectedResult.trim() 
                          ? step.expectedResult.trim() 
                          : '',
                      })),
                  }
                : undefined,
            },
          });

          // Update test suite link if suite changed
          if (suiteId) {
            // Remove existing suite links
            await prisma.testCaseSuite.deleteMany({
              where: { testCaseId: testCase.id },
            });
            // Create new suite link
            await prisma.testCaseSuite.create({
              data: {
                testCaseId: testCase.id,
                testSuiteId: suiteId,
              },
            });
          }
        } else {
          // Create new test case
          // Auto-generate tcId in TC-XXX format without padding (TC-1, TC-2, etc.)
          let tcId = `TC-${nextTcIdNumber}`;
          while (existingTcIds.has(tcId)) {
            nextTcIdNumber++;
            tcId = `TC-${nextTcIdNumber}`;
          }
          nextTcIdNumber++;
          existingTcIds.add(tcId);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          testCase = await (prisma.testCase.create as any)({
            data: {
              tcId,
              projectId,
              ...testCaseData,
              createdById: userId,
              steps: testStepsData && testStepsData.length > 0
                ? {
                    create: testStepsData
                      .filter((step) => (step.action && step.action.trim()) || (step.expectedResult && step.expectedResult.trim()))
                      .map((step) => ({
                        stepNumber: step.stepNumber,
                        action: step.action && step.action.trim() ? step.action.trim() : '',
                        expectedResult: step.expectedResult && step.expectedResult.trim() 
                          ? step.expectedResult.trim() 
                          : '',
                      })),
                  }
                : undefined,
            },
          });

          // Link to test suite via junction table if suite exists
          if (suiteId) {
            await prisma.testCaseSuite.create({
              data: {
                testCaseId: testCase.id,
                testSuiteId: suiteId,
              },
            });
          }
          console.log(`  -> Created new test case: id=${testCase.id}, tcId=${testCase.tcId}`);
        }

        console.log(`  -> Test case processed successfully: moduleId=${testCase.moduleId}`);

        // Link to defects if defect IDs were provided and found
        if (defectsToLink.length > 0) {
          for (const defect of defectsToLink) {
            try {
              // Check if link already exists
              const existingLink = await prisma.testCaseDefect.findFirst({
                where: {
                  testCaseId: testCase.id,
                  defectId: defect.id,
                },
              });
              if (!existingLink) {
                await prisma.testCaseDefect.create({
                  data: {
                    testCaseId: testCase.id,
                    defectId: defect.id,
                  },
                });
              }
            } catch {
              // If link already exists, that's okay - just log it
              console.warn(`Defect ${defect.defectId} (${defect.id}) already linked to test case ${testCase.id}`);
            }
          }
        }

        result.success++;
        result.imported.push({
          tcId: testCase.tcId,
          title: testCase.title + (isUpdate ? ' (更新)' : ''),
        });
      } catch (error) {
        result.failed++;
        const titleValue = this.getRowValue(row, 'title');
        result.errors.push({
          row: rowNumber,
          title: titleValue ? titleValue.toString() : 'N/A',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Debug: Log the test case import result before returning
    console.log('Test case import result:', {
      success: result.success,
      failed: result.failed,
      skipped: result.skipped,
      errorsCount: result.errors.length,
      skippedItemsCount: result.skippedItems.length,
      importedCount: result.imported.length,
    });

    return result;
  }

  /**
   * Import defects from parsed data
   */
  private async importDefects(
    projectId: string,
    userId: string,
    data: ParsedRow[]
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      skippedItems: [],
      imported: [],
    };

    // Get project to validate
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!project) {
      throw new ValidationException('Project not found');
    }

    // Get existing defects to generate next defectId
    const existingDefects = await prisma.defect.findMany({
      where: { projectId },
      select: { defectId: true },
    });

    // Create a set of existing defectIds for quick lookup
    const existingDefectIds = new Set(existingDefects.map((d) => d.defectId));

    // Find the highest DEF-X number from existing defects
    // Only consider defects in DEF-X format (not custom formats like DEF-LOGIN-001)
    let nextDefectIdNumber = 1;
    const defectNumberPattern = /^DEF-(\d+)$/;
    
    for (const defect of existingDefects) {
      const match = defect.defectId.match(defectNumberPattern);
      if (match) {
        const number = parseInt(match[1], 10);
        if (number >= nextDefectIdNumber) {
          nextDefectIdNumber = number + 1;
        }
      }
    }

    // Get dropdown options for validation
    const [severities, priorities, statuses, environments] = await Promise.all([
      prisma.dropdownOption.findMany({
        where: { entity: 'Defect', field: 'severity' },
        select: { value: true },
      }),
      prisma.dropdownOption.findMany({
        where: { entity: 'Defect', field: 'priority' },
        select: { value: true },
      }),
      prisma.dropdownOption.findMany({
        where: { entity: 'Defect', field: 'status' },
        select: { value: true },
      }),
      prisma.dropdownOption.findMany({
        where: { entity: 'TestRun', field: 'environment' },
        select: { value: true },
      }),
    ]);

    const validSeverities = new Set(severities.map((s) => s.value.toUpperCase()));
    const validPriorities = new Set(priorities.map((p) => p.value.toUpperCase()));
    const validStatuses = new Set(statuses.map((s) => s.value.toUpperCase()));
    const validEnvironments = new Set(
      environments.map((e) => e.value.toUpperCase())
    );

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because of header row and 1-based indexing

      try {
        // Get values using normalized column names
        const defectId = this.getRowValue(row, 'defectId');
        const title = this.getRowValue(row, 'title');
        const description = this.getRowValue(row, 'description');
        const severity = this.getRowValue(row, 'severity');
        const priority = this.getRowValue(row, 'priority');
        const status = this.getRowValue(row, 'status');
        const environment = this.getRowValue(row, 'environment');
        const reportedBy = this.getRowValue(row, 'reportedBy');
        const reportedDate = this.getRowValue(row, 'reportedDate');
        const assignedTo = this.getRowValue(row, 'assignedTo');
        const dueDate = this.getRowValue(row, 'dueDate');

        // Validate required field
        if (!title || typeof title !== 'string' || title.toString().trim() === '') {
          throw new Error('Title is required');
        }

        const defectTitle = title.toString().trim();

        // Check if defect with same title already exists
        const existingDefect = await prisma.defect.findFirst({
          where: {
            projectId,
            title: {
              equals: defectTitle,
              mode: 'insensitive',
            },
          },
        });

        if (existingDefect) {
          result.skipped++;
          result.skippedItems.push({
            row: rowNumber,
            title: defectTitle,
            reason: `Already exists (${existingDefect.defectId})`,
          });
          continue; // Skip this row
        }

        // Validate severity
        const severityValue = severity
          ? severity.toString().toUpperCase()
          : 'MEDIUM';
        if (!validSeverities.has(severityValue)) {
          throw new Error(
            `Invalid severity: ${severity}. Valid values are: ${Array.from(validSeverities).join(', ')}`
          );
        }

        // Validate priority
        const priorityValue = priority
          ? priority.toString().toUpperCase()
          : 'MEDIUM';
        if (!validPriorities.has(priorityValue)) {
          throw new Error(
            `Invalid priority: ${priority}. Valid values are: ${Array.from(validPriorities).join(', ')}`
          );
        }

        // Validate status
        const statusValue = status ? status.toString().toUpperCase() : 'NEW';
        if (!validStatuses.has(statusValue)) {
          throw new Error(
            `Invalid status: ${status}. Valid values are: ${Array.from(validStatuses).join(', ')}`
          );
        }

        // Validate environment
        let environmentValue: string | undefined;
        if (environment && typeof environment === 'string') {
          environmentValue = environment.toString().toUpperCase();
          if (!validEnvironments.has(environmentValue)) {
            throw new Error(
              `Invalid environment: ${environment}. Valid values are: ${Array.from(validEnvironments).join(', ')}`
            );
          }
        }

        // Find reported by user (name or email)
        let createdById = userId; // Default to current user
        if (reportedBy && typeof reportedBy === 'string') {
          const reportedByValue = reportedBy.toString().trim();
          // Try to find by email first, then by name
          const projectMember = project.members.find(
            (m) => 
              m.user.email.toLowerCase() === reportedByValue.toLowerCase() ||
              m.user.name?.toLowerCase() === reportedByValue.toLowerCase()
          );

          if (projectMember) {
            createdById = projectMember.userId;
          } else {
            // Log warning but use current user as fallback
            console.warn(
              `User "${reportedByValue}" not found in project members. Using current user as reporter.`
            );
          }
        }

        // Parse reported date
        let createdAtValue: Date | undefined;
        if (reportedDate && typeof reportedDate === 'string') {
          const parsedDate = new Date(reportedDate);
          if (!isNaN(parsedDate.getTime())) {
            createdAtValue = parsedDate;
          } else {
            console.warn(`Invalid reported date format: ${reportedDate}. Using current date.`);
          }
        }

        // Find assignee by name or email (optional field)
        let assignedToId: string | undefined;
        
        if (assignedTo && typeof assignedTo === 'string' && assignedTo.toString().trim() !== '') {
          const assignedToValue = assignedTo.toString().trim();
          // Try to find by email first, then by name
          const projectMember = project.members.find(
            (m) => 
              m.user.email.toLowerCase() === assignedToValue.toLowerCase() ||
              m.user.name?.toLowerCase() === assignedToValue.toLowerCase()
          );

          if (!projectMember) {
            throw new Error(
              `User "${assignedToValue}" not found in project members. Please provide a valid name or email of a project member, or leave empty if unassigned.`
            );
          }

          assignedToId = projectMember.userId;
        }

        // Parse due date
        let dueDateValue: Date | undefined;
        if (dueDate && typeof dueDate === 'string') {
          const parsedDate = new Date(dueDate);
          if (!isNaN(parsedDate.getTime())) {
            dueDateValue = parsedDate;
          }
        }

        // Prepare defectId - will be validated and used/auto-generated by defectService
        // Accept any value, preserve original case (case-sensitive matching)
        const providedDefectId = defectId && typeof defectId === 'string' && defectId.toString().trim()
          ? defectId.toString().trim() // Preserve original case
          : null;

        // Check if defect ID already exists (for better error message during import)
        if (providedDefectId && existingDefectIds.has(providedDefectId)) {
          const existingDefect = await prisma.defect.findFirst({
            where: {
              projectId,
              defectId: providedDefectId,
            },
            select: { title: true },
          });
          const existingTitle = existingDefect?.title || 'Unknown';
          result.skipped++;
          result.skippedItems.push({
            row: rowNumber,
            title: defectTitle,
            reason: `Defect ID already exists: ${providedDefectId} (Existing: "${existingTitle}")`,
          });
          continue;
        }

        // Create defect using defectService to trigger auto-linking with test cases
        // defectService will validate format, check uniqueness, and auto-generate if needed
        const defect = await defectService.createDefect({
          defectId: providedDefectId, // null if not provided, will be auto-generated
          projectId,
          title: title.toString().trim(),
          description: description
            ? description.toString().trim()
            : null,
          severity: severityValue,
          priority: priorityValue,
          status: statusValue,
          assignedToId: assignedToId || null,
          environment: environmentValue || null,
          dueDate: dueDateValue ? dueDateValue.toISOString() : null,
          createdById,
        });

        // Track the created defect ID for uniqueness check in subsequent rows
        existingDefectIds.add(defect.defectId);
        
        // Update nextDefectIdNumber if the created defect is in DEF-X format
        const match = defect.defectId.match(/^DEF-(\d+)$/);
        if (match) {
          const number = parseInt(match[1], 10);
          if (number >= nextDefectIdNumber) {
            nextDefectIdNumber = number + 1;
          }
        }

        // If reportedDate is provided, update the createdAt timestamp
        if (createdAtValue) {
          await prisma.defect.update({
            where: { id: defect.id },
            data: { createdAt: createdAtValue },
          });
        }

        result.success++;
        result.imported.push({
          defectId: defect.defectId,
          title: defect.title,
        });
      } catch (error) {
        result.failed++;
        const titleValue = this.getRowValue(row, 'title');
        result.errors.push({
          row: rowNumber,
          title: titleValue ? titleValue.toString() : 'N/A',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Debug: Log the result before returning
    console.log('Defect import result:', {
      success: result.success,
      failed: result.failed,
      skipped: result.skipped,
      errorsCount: result.errors.length,
      skippedItemsCount: result.skippedItems.length,
      importedCount: result.imported.length,
    });

    return result;
  }
}

export const importService = new ImportService();

