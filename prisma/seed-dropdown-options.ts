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

    // Module Category (Domain) options for TestCase
    { entity: 'TestCase', field: 'moduleCategory', value: '認証', label: '認証', order: 1 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'オンボーディング', label: 'オンボーディング', order: 2 },
    { entity: 'TestCase', field: 'moduleCategory', value: '決済', label: '決済', order: 3 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'ランク', label: 'ランク', order: 4 },
    { entity: 'TestCase', field: 'moduleCategory', value: '招待', label: '招待', order: 5 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'イベント', label: 'イベント', order: 6 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'ポイント管理', label: 'ポイント管理', order: 7 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'オリパ', label: 'オリパ', order: 8 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'LINE連携', label: 'LINE連携', order: 9 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'マイル', label: 'マイル', order: 10 },
    { entity: 'TestCase', field: 'moduleCategory', value: '結果処理', label: '結果処理', order: 11 },
    { entity: 'TestCase', field: 'moduleCategory', value: '配送', label: '配送', order: 12 },
    { entity: 'TestCase', field: 'moduleCategory', value: '住所管理', label: '住所管理', order: 13 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'カード管理', label: 'カード管理', order: 14 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'プロフィール', label: 'プロフィール', order: 15 },
    { entity: 'TestCase', field: 'moduleCategory', value: '通知', label: '通知', order: 16 },
    { entity: 'TestCase', field: 'moduleCategory', value: '統合', label: '統合', order: 17 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'セキュリティ', label: 'セキュリティ', order: 18 },
    { entity: 'TestCase', field: 'moduleCategory', value: '同時実行', label: '同時実行', order: 19 },
    { entity: 'TestCase', field: 'moduleCategory', value: '決済障害', label: '決済障害', order: 20 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'パフォーマンス', label: 'パフォーマンス', order: 21 },
    { entity: 'TestCase', field: 'moduleCategory', value: '国際化', label: '国際化', order: 22 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'アクセシビリティ', label: 'アクセシビリティ', order: 23 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'GDPR', label: 'GDPR', order: 24 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'E2E統合', label: 'E2E統合', order: 25 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'エッジケース', label: 'エッジケース', order: 26 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'KYC', label: 'KYC', order: 27 },
    { entity: 'TestCase', field: 'moduleCategory', value: '年齢確認', label: '年齢確認', order: 28 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'オリパギフト', label: 'オリパギフト', order: 29 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'リトライ抽選', label: 'リトライ抽選', order: 30 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'チャージ抽選', label: 'チャージ抽選', order: 31 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'デジタルコード', label: 'デジタルコード', order: 32 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'クーポン', label: 'クーポン', order: 33 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'バナー', label: 'バナー', order: 34 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'ニュース', label: 'ニュース', order: 35 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'マスタプロダクト', label: 'マスタプロダクト', order: 36 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'コイン管理', label: 'コイン管理', order: 37 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'オファーウォール', label: 'オファーウォール', order: 38 },
    { entity: 'TestCase', field: 'moduleCategory', value: '注文', label: '注文', order: 39 },
    { entity: 'TestCase', field: 'moduleCategory', value: '課金', label: '課金', order: 40 },
    { entity: 'TestCase', field: 'moduleCategory', value: 'ユーザー管理', label: 'ユーザー管理', order: 41 },

    // Feature Category (Function) options for TestCase
    { entity: 'TestCase', field: 'featureCategory', value: '新規登録', label: '新規登録', order: 1 },
    { entity: 'TestCase', field: 'featureCategory', value: 'ログイン', label: 'ログイン', order: 2 },
    { entity: 'TestCase', field: 'featureCategory', value: '外部認証', label: '外部認証', order: 3 },
    { entity: 'TestCase', field: 'featureCategory', value: 'セッション管理', label: 'セッション管理', order: 4 },
    { entity: 'TestCase', field: 'featureCategory', value: 'パスワード管理', label: 'パスワード管理', order: 5 },
    { entity: 'TestCase', field: 'featureCategory', value: 'アカウント管理', label: 'アカウント管理', order: 6 },
    { entity: 'TestCase', field: 'featureCategory', value: '初期設定', label: '初期設定', order: 7 },
    { entity: 'TestCase', field: 'featureCategory', value: '決済処理', label: '決済処理', order: 8 },
    { entity: 'TestCase', field: 'featureCategory', value: 'コイン購入', label: 'コイン購入', order: 9 },
    { entity: 'TestCase', field: 'featureCategory', value: 'コンビニ決済', label: 'コンビニ決済', order: 10 },
    { entity: 'TestCase', field: 'featureCategory', value: 'Apple Pay決済', label: 'Apple Pay決済', order: 11 },
    { entity: 'TestCase', field: 'featureCategory', value: 'Google Pay決済', label: 'Google Pay決済', order: 12 },
    { entity: 'TestCase', field: 'featureCategory', value: 'ランク昇格', label: 'ランク昇格', order: 13 },
    { entity: 'TestCase', field: 'featureCategory', value: 'ボーナスポイント', label: 'ボーナスポイント', order: 14 },
    { entity: 'TestCase', field: 'featureCategory', value: '招待機能', label: '招待機能', order: 15 },
    { entity: 'TestCase', field: 'featureCategory', value: 'コインマラソン', label: 'コインマラソン', order: 16 },
    { entity: 'TestCase', field: 'featureCategory', value: 'スタンプカード', label: 'スタンプカード', order: 17 },
    { entity: 'TestCase', field: 'featureCategory', value: '期限管理', label: '期限管理', order: 18 },
    { entity: 'TestCase', field: 'featureCategory', value: 'オリパ情報表示', label: 'オリパ情報表示', order: 19 },
    { entity: 'TestCase', field: 'featureCategory', value: '当選履歴', label: '当選履歴', order: 20 },
    { entity: 'TestCase', field: 'featureCategory', value: '当選情報', label: '当選情報', order: 21 },
    { entity: 'TestCase', field: 'featureCategory', value: 'オリパ検索', label: 'オリパ検索', order: 22 },
    { entity: 'TestCase', field: 'featureCategory', value: 'LINE連携', label: 'LINE連携', order: 23 },
    { entity: 'TestCase', field: 'featureCategory', value: '配送申請', label: '配送申請', order: 24 },
    { entity: 'TestCase', field: 'featureCategory', value: 'オリパ抽選', label: 'オリパ抽選', order: 25 },
    { entity: 'TestCase', field: 'featureCategory', value: 'マイル獲得', label: 'マイル獲得', order: 26 },
    { entity: 'TestCase', field: 'featureCategory', value: 'ポイント交換', label: 'ポイント交換', order: 27 },
    { entity: 'TestCase', field: 'featureCategory', value: 'その他機能', label: 'その他機能', order: 28 },
    { entity: 'TestCase', field: 'featureCategory', value: 'カテゴリ設定', label: 'カテゴリ設定', order: 29 },
    { entity: 'TestCase', field: 'featureCategory', value: 'SQLインジェクション対策', label: 'SQLインジェクション対策', order: 30 },
    { entity: 'TestCase', field: 'featureCategory', value: 'XSS対策', label: 'XSS対策', order: 31 },
    { entity: 'TestCase', field: 'featureCategory', value: 'クエスト', label: 'クエスト', order: 32 },
    { entity: 'TestCase', field: 'featureCategory', value: 'PayPay決済', label: 'PayPay決済', order: 33 },
    { entity: 'TestCase', field: 'featureCategory', value: 'ミッション', label: 'ミッション', order: 34 },
    { entity: 'TestCase', field: 'featureCategory', value: 'スペシャルアイテム', label: 'スペシャルアイテム', order: 35 },
    { entity: 'TestCase', field: 'featureCategory', value: 'チャージリワード', label: 'チャージリワード', order: 36 },
    { entity: 'TestCase', field: 'featureCategory', value: '特別友達招待', label: '特別友達招待', order: 37 },
    { entity: 'TestCase', field: 'featureCategory', value: 'クーポンロッテリー', label: 'クーポンロッテリー', order: 38 },
    { entity: 'TestCase', field: 'featureCategory', value: '発送報酬', label: '発送報酬', order: 39 },
    { entity: 'TestCase', field: 'featureCategory', value: 'チャージ限定オリパ', label: 'チャージ限定オリパ', order: 40 },
    { entity: 'TestCase', field: 'featureCategory', value: '本人確認', label: '本人確認', order: 41 },
    { entity: 'TestCase', field: 'featureCategory', value: '課金抽選', label: '課金抽選', order: 42 },
    { entity: 'TestCase', field: 'featureCategory', value: 'カード相場', label: 'カード相場', order: 43 },
    { entity: 'TestCase', field: 'featureCategory', value: '配送元', label: '配送元', order: 44 },
    { entity: 'TestCase', field: 'featureCategory', value: 'ポイント管理', label: 'ポイント管理', order: 45 },
    { entity: 'TestCase', field: 'featureCategory', value: 'イベント参加', label: 'イベント参加', order: 46 },
    { entity: 'TestCase', field: 'featureCategory', value: 'VIP', label: 'VIP', order: 47 },
    { entity: 'TestCase', field: 'featureCategory', value: 'オリパスタジオ', label: 'オリパスタジオ', order: 48 },
    { entity: 'TestCase', field: 'featureCategory', value: '停止', label: '停止', order: 49 },
    { entity: 'TestCase', field: 'featureCategory', value: 'メール確認', label: 'メール確認', order: 50 },
  ];

  // Delete old moduleCategory and featureCategory options before inserting new ones
  console.log('  🗑️ Deleting old moduleCategory and featureCategory options...');
  await prisma.dropdownOption.deleteMany({
    where: {
      entity: 'TestCase',
      field: { in: ['moduleCategory', 'featureCategory'] },
    },
  });

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
