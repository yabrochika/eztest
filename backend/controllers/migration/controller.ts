import { importService, ImportType } from '@/backend/services/migration/import/services';
import { parseFile } from '@/lib/file-parser';
import { CustomRequest } from '@/backend/utils/interceptor';
import { ValidationException } from '@/backend/utils/exceptions';
import { validateTestCaseImportColumns, validateDefectImportColumns } from '@/backend/validators/migration.validator';

export class MigrationController {
  /**
   * Import data from CSV/Excel file
   */
  async importData(req: CustomRequest, projectId: string, type: ImportType) {
    try {
      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        throw new ValidationException('No file uploaded');
      }

      // Parse the file
      const parseResult = await parseFile(file);

      if (parseResult.errors.length > 0) {
        throw new ValidationException('File parsing errors', parseResult.errors);
      }

      // Validate required fields using dedicated validator
      if (type === 'testcases') {
        const validationErrors = validateTestCaseImportColumns(parseResult.data);
        if (validationErrors.length > 0) {
          throw new ValidationException('Missing required fields', validationErrors);
        }
      } else {
        // For defects, use dedicated validator
        const validationErrors = validateDefectImportColumns(parseResult.data);
        if (validationErrors.length > 0) {
          throw new ValidationException('Missing required fields', validationErrors);
        }
      }

      // Import data
      const result = await importService.importData(
        type,
        projectId,
        req.userInfo.id,
        parseResult.data
      );

      const typeNames: Record<ImportType, string> = {
        testcases: 'Test cases',
        defects: 'Defects',
      };


      return {
        message: `${typeNames[type]} import completed`,
        data: result,
      };
    } catch (error) {
      if (error instanceof ValidationException) {
        throw error;
      }
      
      const typeNames: Record<ImportType, string> = {
        testcases: 'test cases',
        defects: 'defects',
      };
      
      throw new ValidationException(
        `Failed to import ${typeNames[type]}`,
        error instanceof Error ? [error.message] : ['Unknown error']
      );
    }
  }

  /**
   * Get import template for test cases
   */
  getTestCaseImportTemplate() {
    const template = {
      columns: [
        { name: 'テストケースタイトル', required: true, description: 'テストケースの簡潔な説明' },
        { name: 'モジュール/機能', required: false, description: 'アプリケーション領域（ログイン、決済、IoTデバイス等）。存在しない場合は自動作成' },
        { name: '優先度', required: false, description: '優先度レベル: HIGH / MEDIUM / LOW' },
        { name: '事前条件', required: false, description: 'テスト実行前に必要な条件' },
        { name: 'テストステップ', required: false, description: 'ステップごとのアクション。改行または番号付きポイント（1., 2., 等）で新しいステップ。期待結果列に値がある場合は空でも可。' },
        { name: 'テストデータ', required: false, description: '使用する入力値またはテストデータ' },
        { name: '期待結果', required: false, description: '各テストステップの期待される動作または結果。改行または番号付きポイントでステップに対応。' },
        { name: 'ステータス', required: false, description: 'テストケースステータス: ACTIVE / DRAFT / DEPRECATED' },
        { name: '欠陥ID', required: false, description: '失敗時のバグ参照。カンマまたはセミコロンで複数指定可能。' },
        // Older fields (kept for backward compatibility)
        { name: '説明', required: false, description: 'テストケースの詳細説明' },
        { name: '見積時間（分）', required: false, description: '見積時間（分単位）' },
        { name: '事後条件', required: false, description: 'テスト実行後の条件' },
        { name: 'テストスイート', required: false, description: 'テストスイート名（存在しない場合は自動作成）' },
        // Additional fields
        { name: 'RTC-ID', required: false, description: 'トレーサビリティ用RTC識別子' },
        { name: 'Flow-ID', required: false, description: 'テストフローグループ用識別子' },
        { name: 'レイヤー', required: false, description: 'テストレイヤー: Smoke / Core / Extended' },
        { name: '対象', required: false, description: 'テスト対象: API / 画面' },
        { name: 'テスト種別', required: false, description: 'テスト種別: 正常系 / 異常系 / 非機能 / 初期確認 / データ整合性確認 / 状態遷移確認 / 運用確認 / 障害時確認 / 回帰' },
        { name: '根拠コード', required: false, description: '根拠コードまたは参照' },
        { name: '備考', required: false, description: '追加の備考またはコメント' },
        { name: '自動化', required: false, description: '自動化ステータス: 自動化あり / 自動化なし / 自動化予定' },
        { name: '環境', required: false, description: '対象環境: iOS / Android / Web' },
        { name: 'ドメイン', required: false, description: 'ドメイン: Module1 / Module2' },
        { name: '機能', required: false, description: '機能: Feature1 / Feature2' },
      ],
      example: {
        'テストケースタイトル': '有効な認証情報でユーザー認証を確認',
        'モジュール/機能': 'ログイン',
        '優先度': 'HIGH',
        '事前条件': 'ユーザーアカウントが有効な認証情報でシステムに登録されていること',
        'テストステップ': '1. ログインページに移動\n2. 有効なメールアドレスとパスワードを入力\n3. ログインボタンをクリック\n4. ダッシュボードが読み込まれることを確認\n5. ユーザープロフィールが表示されることを確認',
        'テストデータ': 'メール: user@example.com, パスワード: Test123!',
        '期待結果': '1. ログインページが表示される\n2. 認証情報が受け入れられる\n3. ダッシュボードにリダイレクトされる\n4. ダッシュボードが正常に読み込まれる\n5. ユーザープロフィール情報が表示される',
        'ステータス': 'ACTIVE',
        '欠陥ID': 'DEF-1, DEF-LOGIN-001',
        '説明': '',
        '見積時間（分）': '30',
        '事後条件': '',
        'テストスイート': '',
        'RTC-ID': 'RTC-001',
        'Flow-ID': 'FLOW-LOGIN-01',
        'レイヤー': 'CORE',
        '対象': '画面',
        'テスト種別': '正常系',
        '根拠コード': 'DOC-001',
        '備考': '',
        '自動化': '自動化なし',
        '環境': 'Web',
        'ドメイン': 'MODULE1',
        '機能': 'FEATURE1',
      },
      examples: [
        {
          description: '番号付きフォーマットのテストステップと期待結果（5ステップ）',
          'テストケースタイトル': '有効な認証情報でユーザー認証を確認',
          'モジュール/機能': 'ログイン',
          '優先度': 'HIGH',
          '事前条件': 'ユーザーアカウントが有効な認証情報でシステムに登録されていること',
          'テストステップ': '1. ログインページに移動\n2. 有効なメールアドレスとパスワードを入力\n3. ログインボタンをクリック\n4. ダッシュボードが読み込まれることを確認\n5. ユーザープロフィールが表示されることを確認',
          'テストデータ': 'メール: user@example.com, パスワード: Test123!',
          '期待結果': '1. ログインページが表示される\n2. 認証情報が受け入れられる\n3. ダッシュボードにリダイレクトされる\n4. ダッシュボードが正常に読み込まれる\n5. ユーザープロフィール情報が表示される',
          'ステータス': 'ACTIVE',
          '欠陥ID': 'DEF-1, DEF-LOGIN-001',
          '説明': '',
          '見積時間（分）': '30',
          '事後条件': '',
          'テストスイート': '',
          'RTC-ID': 'RTC-001',
          'Flow-ID': 'FLOW-LOGIN-01',
          'レイヤー': 'CORE',
          '対象': '画面',
          'テスト種別': '正常系',
          '根拠コード': 'DOC-001',
          '備考': '',
          '自動化': '自動化なし',
          '環境': 'Web',
          'ドメイン': 'MODULE1',
          '機能': 'FEATURE1',
        },
        {
          description: '決済処理ワークフローのテストケース',
          'テストケースタイトル': '決済処理ワークフローを確認',
          'モジュール/機能': '決済',
          '優先度': 'CRITICAL',
          '事前条件': 'ユーザーが有効な決済方法を登録済みであること',
          'テストステップ': '1. チェックアウトに移動\n2. 決済方法を選択\n3. 決済詳細を入力\n4. 決済を送信',
          'テストデータ': 'カード: 4111-1111-1111-1111, CVV: 123',
          '期待結果': '1. チェックアウトページが読み込まれる\n2. 決済方法が選択される\n3. 詳細が受け入れられる\n4. 決済が正常に処理される',
          'ステータス': 'ACTIVE',
          '欠陥ID': 'DEF-PAYMENT-001, BUG-456',
          '説明': '',
          '見積時間（分）': '45',
          '事後条件': '',
          'テストスイート': '',
          'RTC-ID': 'RTC-002',
          'Flow-ID': 'FLOW-PAYMENT-01',
          'レイヤー': 'CORE',
          '対象': 'API',
          'テスト種別': '正常系',
          '根拠コード': 'PAY-002',
          '備考': '本番環境では実際のカード情報を使用しないこと',
          '自動化': '自動化あり',
          '環境': 'Web',
          'ドメイン': 'MODULE2',
          '機能': 'FEATURE2',
        },
        {
          description: '番号なしフォーマットのテストステップと期待結果（4ステップ）',
          'テストケースタイトル': 'ログインページが正しく読み込まれることを確認',
          'モジュール/機能': 'ログイン',
          '優先度': 'MEDIUM',
          'テストステップ': 'ログインページに移動\nログインフォームが表示されることを確認\n「ログイン状態を保持」チェックボックスを確認\nパスワードフィールドがマスクされていることを確認',
          '期待結果': 'ログインページが表示される\nログインフォームが表示される\n「ログイン状態を保持」オプションが利用可能\nパスワード入力がドットまたはアスタリスクで表示される',
          'ステータス': 'ACTIVE',
          '欠陥ID': 'BUG-123, DEF-UI-456',
          '説明': '',
          '見積時間（分）': '15',
          '事後条件': '',
          'テストスイート': '',
          'RTC-ID': '',
          'Flow-ID': '',
          'レイヤー': 'SMOKE',
          '対象': '画面',
          'テスト種別': '初期確認',
          '根拠コード': '',
          '備考': '',
          '自動化': '自動化予定',
          '環境': 'Web',
          'ドメイン': '',
          '機能': '',
        },
        {
          description: '単一の期待結果がすべてのステップに適用（3ステップ）',
          'テストケースタイトル': 'ユーザーがログアウトできることを確認',
          'モジュール/機能': 'ログイン',
          '優先度': 'HIGH',
          'テストステップ': 'ログアウトボタンをクリック\nログアウトアクションを確認\nログインページへのリダイレクトを確認',
          '期待結果': 'ユーザーが正常にログアウトする',
          'ステータス': 'ACTIVE',
          '説明': '',
          '見積時間（分）': '',
          '事後条件': '',
          'テストスイート': '',
          'RTC-ID': '',
          'Flow-ID': '',
          'レイヤー': 'EXTENDED',
          '対象': '画面',
          'テスト種別': '正常系',
          '根拠コード': '',
          '備考': '',
          '自動化': '自動化なし',
          '環境': 'iOS',
          'ドメイン': '',
          '機能': '',
        },
        {
          description: '期待結果のみ（テストステップなし）- 期待結果からステップを作成（4ステップ）',
          'テストケースタイトル': '無効なログイン時のエラーメッセージを確認',
          'モジュール/機能': 'ログイン',
          '優先度': 'MEDIUM',
          'テストステップ': '',
          '期待結果': '無効な認証情報のエラーメッセージ\nユーザーはログインページに留まる\nアカウントはロックされない\nエラーメッセージは5秒後に消える',
          'ステータス': 'ACTIVE',
          '説明': '',
          '見積時間（分）': '',
          '事後条件': '',
          'テストスイート': '',
          'RTC-ID': '',
          'Flow-ID': '',
          'レイヤー': '',
          '対象': '',
          'テスト種別': '異常系',
          '根拠コード': '',
          '備考': '',
          '自動化': '',
          '環境': 'Android',
          'ドメイン': '',
          '機能': '',
        },
        {
          description: 'テストステップのみ（期待結果なし）- アクションのみのステップ（5ステップ）',
          'テストケースタイトル': 'パスワードリセット機能を確認',
          'モジュール/機能': 'ログイン',
          '優先度': 'HIGH',
          'テストステップ': 'パスワードを忘れたリンクをクリック\nメールアドレスを入力\nリセットリクエストを送信\nリセットリンクのメールを確認\nリセットリンクをクリックして新しいパスワードを設定',
          '期待結果': '',
          'ステータス': 'ACTIVE',
          '説明': '',
          '見積時間（分）': '',
          '事後条件': '',
          'テストスイート': '',
          'RTC-ID': '',
          'Flow-ID': '',
          'レイヤー': '',
          '対象': '',
          'テスト種別': '回帰',
          '根拠コード': '',
          '備考': '',
          '自動化': '',
          '環境': '',
          'ドメイン': '',
          '機能': '',
        },
      ],
    };

    return {
      data: template,
    };
  }

  /**
   * Get import template for defects
   */
  getDefectImportTemplate() {
    const template = {
      columns: [
        { name: 'Defect ID', required: false, description: 'Unique identifier - can be any value (e.g., DEF-1, BUG-123, na, ISSUE-001, any-text). If not provided, will be auto-generated in DEF-1, DEF-2 format. Will be matched with test cases that reference this ID (case-sensitive).' },
        { name: 'Defect Title / Summary', required: true, description: 'Short, precise problem statement' },
        { name: 'Description', required: false, description: 'Detailed explanation of the issue' },
        { name: 'Severity', required: false, description: 'Blocker / Critical / Major / Minor / Trivial' },
        { name: 'Priority', required: false, description: 'CRITICAL / HIGH / MEDIUM / LOW' },
        { name: 'Status', required: false, description: 'New / Open / Fixed / Retest / Closed' },
        { name: 'Environment', required: false, description: 'QA / Staging / Prod' },
        { name: 'Reported By', required: false, description: 'Tester name or email (must be project member)' },
        { name: 'Reported Date', required: false, description: 'Date when defect was reported (YYYY-MM-DD format)' },
        { name: 'Assigned To', required: false, description: 'Name or email of Developer/Tester (must be project member). Leave empty if unassigned' },
        { name: 'Due Date', required: false, description: 'Due date (YYYY-MM-DD format)' },
      ],
      example: {
        'Defect ID': 'DEF-1',
        'Defect Title / Summary': 'Authentication button unresponsive on mobile devices',
        'Description': 'The primary authentication button fails to respond to touch events on mobile devices running iOS 15+ and Android 12+. Users are unable to complete the login process, resulting in blocked access to the application.',
        'Severity': 'CRITICAL',
        'Priority': 'HIGH',
        'Status': 'NEW',
        'Environment': 'PROD',
        'Reported By': 'john.tester@company.com',
        'Reported Date': '2025-01-15',
        'Assigned To': 'senior.developer@company.com',
        'Due Date': '2025-12-31',
      },
      examples: [
        {
          description: 'Defect with provided ID (standard format)',
          'Defect ID': 'DEF-1',
          'Defect Title / Summary': 'Authentication button unresponsive on mobile devices',
          'Description': 'The primary authentication button fails to respond to touch events on mobile devices running iOS 15+ and Android 12+. Users are unable to complete the login process, resulting in blocked access to the application.',
          'Severity': 'CRITICAL',
          'Priority': 'HIGH',
          'Status': 'NEW',
          'Environment': 'PROD',
          'Reported By': 'john.tester@company.com',
          'Reported Date': '2025-01-15',
          'Assigned To': 'senior.developer@company.com',
          'Due Date': '2025-12-31',
        },
        {
          description: 'Defect with custom format ID',
          'Defect ID': 'DEF-LOGIN-001',
          'Defect Title / Summary': 'Password field accepts invalid characters',
          'Description': 'Password input field allows special characters that should be restricted according to security requirements.',
          'Severity': 'MAJOR',
          'Priority': 'MEDIUM',
          'Status': 'OPEN',
          'Environment': 'QA',
          'Reported By': 'qa.tester@company.com',
          'Reported Date': '2025-01-16',
          'Assigned To': 'developer@company.com',
          'Due Date': '2025-02-01',
        },
        {
          description: 'Defect without ID (will be auto-generated)',
          'Defect ID': '',
          'Defect Title / Summary': 'Dashboard loading timeout error',
          'Description': 'Dashboard page takes more than 30 seconds to load on first access, causing timeout errors.',
          'Severity': 'MAJOR',
          'Priority': 'HIGH',
          'Status': 'NEW',
          'Environment': 'STAGING',
          'Reported By': 'tester@company.com',
          'Reported Date': '2025-01-17',
          'Assigned To': 'backend.developer@company.com',
          'Due Date': '',
        },
        {
          description: 'Defect with minimal required fields only',
          'Defect ID': 'BUG-123',
          'Defect Title / Summary': 'User profile image not displaying',
          'Description': '',
          'Severity': 'MINOR',
          'Priority': 'LOW',
          'Status': 'NEW',
          'Environment': '',
          'Reported By': '',
          'Reported Date': '',
          'Assigned To': '',
          'Due Date': '',
        },
        {
          description: 'Defect with unassigned status',
          'Defect ID': '',
          'Defect Title / Summary': 'API endpoint returns 500 error',
          'Description': 'GET /api/users endpoint returns 500 Internal Server Error when querying with specific filters.',
          'Severity': 'CRITICAL',
          'Priority': 'HIGH',
          'Status': 'NEW',
          'Environment': 'PROD',
          'Reported By': 'monitoring@company.com',
          'Reported Date': '2025-01-18',
          'Assigned To': '',
          'Due Date': '2025-01-25',
        },
      ],
    };

    return {
      data: template,
    };
  }
}

export const migrationController = new MigrationController();

