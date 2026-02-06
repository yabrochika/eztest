import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed dropdown options data
 * This populates the DropdownOption table with initial values
 */
export async function seedDropdownOptions() {
  console.log('🎨 Seeding dropdown options...');

  const dropdownOptions = [
    // Priority options (used in TestCase, Requirement, Defect)
    { entity: 'TestCase', field: 'priority', value: 'CRITICAL', label: 'CRITICAL', order: 1 },
    { entity: 'TestCase', field: 'priority', value: 'HIGH', label: 'HIGH', order: 2 },
    { entity: 'TestCase', field: 'priority', value: 'MEDIUM', label: 'MEDIUM', order: 3 },
    { entity: 'TestCase', field: 'priority', value: 'LOW', label: 'LOW', order: 4 },

    // TestStatus options (used in TestCase)
    { entity: 'TestCase', field: 'status', value: 'ACTIVE', label: 'ACTIVE', order: 1 },
    { entity: 'TestCase', field: 'status', value: 'DEPRECATED', label: 'DEPRECATED', order: 2 },
    { entity: 'TestCase', field: 'status', value: 'DRAFT', label: 'DRAFT', order: 3 },

    // Domain options (used in TestCase)
    { entity: 'TestCase', field: 'domain', value: 'USER_MANAGEMENT', label: 'User Management', order: 1 },
    { entity: 'TestCase', field: 'domain', value: 'AUTH', label: 'Authentication', order: 2 },
    { entity: 'TestCase', field: 'domain', value: 'PAYMENT', label: 'Payment', order: 3 },
    { entity: 'TestCase', field: 'domain', value: 'REPORT', label: 'Report', order: 4 },
    { entity: 'TestCase', field: 'domain', value: 'SETTINGS', label: 'Settings', order: 5 },

    // Function options (used in TestCase)
    { entity: 'TestCase', field: 'function', value: 'LOGIN', label: 'Login', order: 1 },
    { entity: 'TestCase', field: 'function', value: 'REGISTER', label: 'Register', order: 2 },
    { entity: 'TestCase', field: 'function', value: 'SEARCH', label: 'Search', order: 3 },
    { entity: 'TestCase', field: 'function', value: 'LIST', label: 'List', order: 4 },
    { entity: 'TestCase', field: 'function', value: 'DETAIL', label: 'Detail', order: 5 },
    { entity: 'TestCase', field: 'function', value: 'CREATE', label: 'Create', order: 6 },
    { entity: 'TestCase', field: 'function', value: 'EDIT', label: 'Edit', order: 7 },
    { entity: 'TestCase', field: 'function', value: 'DELETE', label: 'Delete', order: 8 },

    // TestRunStatus options (used in TestRun)
    { entity: 'TestRun', field: 'status', value: 'PLANNED', label: 'PLANNED', order: 1 },
    { entity: 'TestRun', field: 'status', value: 'IN_PROGRESS', label: 'IN PROGRESS', order: 2 },
    { entity: 'TestRun', field: 'status', value: 'COMPLETED', label: 'COMPLETED', order: 3 },
    { entity: 'TestRun', field: 'status', value: 'CANCELLED', label: 'CANCELLED', order: 4 },

    // TestResultStatus options (used in TestResult)
    { entity: 'TestResult', field: 'status', value: 'PASSED', label: 'PASSED', order: 1 },
    { entity: 'TestResult', field: 'status', value: 'FAILED', label: 'FAILED', order: 2 },
    { entity: 'TestResult', field: 'status', value: 'BLOCKED', label: 'BLOCKED', order: 3 },
    { entity: 'TestResult', field: 'status', value: 'SKIPPED', label: 'SKIPPED', order: 4 },
    { entity: 'TestResult', field: 'status', value: 'RETEST', label: 'RETEST', order: 5 },

    // RequirementStatus options (used in Requirement)
    { entity: 'Requirement', field: 'status', value: 'DRAFT', label: 'DRAFT', order: 1 },
    { entity: 'Requirement', field: 'status', value: 'APPROVED', label: 'APPROVED', order: 2 },
    { entity: 'Requirement', field: 'status', value: 'IMPLEMENTED', label: 'IMPLEMENTED', order: 3 },
    { entity: 'Requirement', field: 'status', value: 'VERIFIED', label: 'VERIFIED', order: 4 },
    { entity: 'Requirement', field: 'status', value: 'DEPRECATED', label: 'DEPRECATED', order: 5 },

    // Priority options for Requirement
    { entity: 'Requirement', field: 'priority', value: 'CRITICAL', label: 'CRITICAL', order: 1 },
    { entity: 'Requirement', field: 'priority', value: 'HIGH', label: 'HIGH', order: 2 },
    { entity: 'Requirement', field: 'priority', value: 'MEDIUM', label: 'MEDIUM', order: 3 },
    { entity: 'Requirement', field: 'priority', value: 'LOW', label: 'LOW', order: 4 },

    // DefectSeverity options (used in Defect)
    { entity: 'Defect', field: 'severity', value: 'CRITICAL', label: 'CRITICAL', order: 1 },
    { entity: 'Defect', field: 'severity', value: 'HIGH', label: 'HIGH', order: 2 },
    { entity: 'Defect', field: 'severity', value: 'MEDIUM', label: 'MEDIUM', order: 3 },
    { entity: 'Defect', field: 'severity', value: 'LOW', label: 'LOW', order: 4 },

    // DefectStatus options (used in Defect)
    { entity: 'Defect', field: 'status', value: 'NEW', label: 'NEW', order: 1 },
    { entity: 'Defect', field: 'status', value: 'IN_PROGRESS', label: 'IN PROGRESS', order: 2 },
    { entity: 'Defect', field: 'status', value: 'FIXED', label: 'FIXED', order: 3 },
    { entity: 'Defect', field: 'status', value: 'TESTED', label: 'TESTED', order: 4 },
    { entity: 'Defect', field: 'status', value: 'CLOSED', label: 'CLOSED', order: 5 },

    // Priority options for Defect
    { entity: 'Defect', field: 'priority', value: 'CRITICAL', label: 'CRITICAL', order: 1 },
    { entity: 'Defect', field: 'priority', value: 'HIGH', label: 'HIGH', order: 2 },
    { entity: 'Defect', field: 'priority', value: 'MEDIUM', label: 'MEDIUM', order: 3 },
    { entity: 'Defect', field: 'priority', value: 'LOW', label: 'LOW', order: 4 },

    // Environment options for TestRun
    { entity: 'TestRun', field: 'environment', value: 'Production', label: 'PRODUCTION', order: 1 },
    { entity: 'TestRun', field: 'environment', value: 'Staging', label: 'STAGING', order: 2 },
    { entity: 'TestRun', field: 'environment', value: 'QA', label: 'QA', order: 3 },
    { entity: 'TestRun', field: 'environment', value: 'Development', label: 'DEVELOPMENT', order: 4 },

    // Environment options for Defect
    { entity: 'Defect', field: 'environment', value: 'Production', label: 'PRODUCTION', order: 1 },
    { entity: 'Defect', field: 'environment', value: 'Staging', label: 'STAGING', order: 2 },
    { entity: 'Defect', field: 'environment', value: 'QA', label: 'QA', order: 3 },
    { entity: 'Defect', field: 'environment', value: 'Development', label: 'DEVELOPMENT', order: 4 },

    // Layer options (used in TestCase)
    { entity: 'TestCase', field: 'layer', value: 'SMOKE', label: 'Smoke', order: 1 },
    { entity: 'TestCase', field: 'layer', value: 'CORE', label: 'Core', order: 2 },
    { entity: 'TestCase', field: 'layer', value: 'EXTENDED', label: 'Extended', order: 3 },

    // TestType options (used in TestCase - テスト種別)
    { entity: 'TestCase', field: 'testType', value: 'NORMAL', label: '正常系', order: 1 },
    { entity: 'TestCase', field: 'testType', value: 'ABNORMAL', label: '異常系', order: 2 },
    { entity: 'TestCase', field: 'testType', value: 'NON_FUNCTIONAL', label: '非機能', order: 3 },
    { entity: 'TestCase', field: 'testType', value: 'INITIAL_CHECK', label: '初期確認', order: 4 },
    { entity: 'TestCase', field: 'testType', value: 'DATA_INTEGRITY', label: 'データ整合性確認', order: 5 },
    { entity: 'TestCase', field: 'testType', value: 'STATE_TRANSITION', label: '状態遷移確認', order: 6 },
    { entity: 'TestCase', field: 'testType', value: 'OPERATION', label: '運用確認', order: 7 },
    { entity: 'TestCase', field: 'testType', value: 'FAILURE', label: '障害時確認', order: 8 },
    { entity: 'TestCase', field: 'testType', value: 'REGRESSION', label: '回帰', order: 9 },

    // Target options (used in TestCase - 対象)
    { entity: 'TestCase', field: 'target', value: 'API', label: 'API', order: 1 },
    { entity: 'TestCase', field: 'target', value: 'SCREEN', label: '画面', order: 2 },

    // Automation options (used in TestCase - 自動化)
    { entity: 'TestCase', field: 'automation', value: 'YES', label: '自動化あり', order: 1 },
    { entity: 'TestCase', field: 'automation', value: 'NO', label: '自動化なし', order: 2 },
    { entity: 'TestCase', field: 'automation', value: 'PLANNED', label: '自動化予定', order: 3 },

    // Environment options for TestCase (環境)
    { entity: 'TestCase', field: 'environment', value: 'IOS', label: 'iOS', order: 1 },
    { entity: 'TestCase', field: 'environment', value: 'ANDROID', label: 'Android', order: 2 },
    { entity: 'TestCase', field: 'environment', value: 'WEB', label: 'Web', order: 3 },

    // Module Category options for TestCase
    { entity: 'TestCase', field: 'moduleCategory', value: 'MODULE1', label: 'Module1', order: 1 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'MODULE2', label: 'Module2', order: 2 },

    // Feature Category options for TestCase
    { entity: 'TestCase', field: 'featureCategory', value: 'FEATURE1', label: 'Feature1', order: 1 },
    { entity: 'TestCase', field: 'featureCategory', value: 'FEATURE2', label: 'Feature2', order: 2 },
  ];

  console.log('  📝 Upserting dropdown options...');
  let created = 0;
  let updated = 0;

  for (const option of dropdownOptions) {
    const result = await prisma.dropdownOption.upsert({
      where: {
        entity_field_value: {
          entity: option.entity,
          field: option.field,
          value: option.value,
        },
      },
      update: {
        label: option.label,
        order: option.order,
        isActive: true, // Ensure all options are active
      },
      create: option,
    });

    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      created++;
    } else {
      updated++;
    }
  }

  console.log(`  ✅ Created ${created} new options, updated ${updated} existing options`);
  console.log('✅ Dropdown options seeded successfully!\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDropdownOptions()
    .catch((e) => {
      console.error('❌ Error seeding dropdown options:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
