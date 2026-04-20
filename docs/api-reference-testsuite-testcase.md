# EZTest API Reference — TestSuite & TestCase

> 認証: 全エンドポイントは **セッション認証** または **APIキー認証** (`X-API-Key` ヘッダー) が必要。
>
> レスポンス形式 (成功): `{ "data": {...}, "message": "..." }`
> レスポンス形式 (エラー): `{ "error": "..." }`

---

## 共通エラーコード

| Status | 意味 |
|--------|------|
| 400 | Bad Request — 必須パラメーター不足 |
| 401 | Unauthorized — 未認証 |
| 403 | Forbidden — 権限不足 |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error — Zodバリデーション失敗 |
| 500 | Internal Server Error |

---

## TestSuite API

### データモデル

```ts
TestSuite {
  id:          string    // CUID
  projectId:   string
  name:        string
  description: string | null
  parentId:    string | null   // 親スイートID（ネスト構造）
  order:       number          // 表示順 (default: 0)
  createdAt:   string          // ISO8601
  updatedAt:   string          // ISO8601
}
```

---

### GET `/api/projects/{projectId}/testsuites`

プロジェクト内の全テストスイートを階層構造で取得する。

**必要権限:** `testsuites:read`

**レスポンス (200)**
```json
{
  "data": [
    {
      "id": "cuid",
      "projectId": "cuid",
      "name": "Suite A",
      "description": null,
      "parentId": null,
      "order": 0,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z",
      "parent": null,
      "children": [
        {
          "id": "cuid",
          "name": "Child Suite",
          "_count": { "testCases": 3 }
        }
      ],
      "testCases": [
        {
          "id": "cuid",
          "tcId": "tc1",
          "title": "Test Case Title",
          "description": null,
          "priority": "MEDIUM",
          "status": "ACTIVE",
          "moduleId": "cuid",
          "module": { "id": "cuid", "name": "Module Name", "description": null }
        }
      ],
      "_count": { "testCases": 5 }
    }
  ],
  "message": "Test suites fetched successfully"
}
```

---

### POST `/api/projects/{projectId}/testsuites`

新しいテストスイートを作成する。

**必要権限:** `testsuites:create`

**Request Body**
```json
{
  "name":        "string (required)",
  "description": "string (optional)",
  "parentId":    "string (optional) — 親スイートID",
  "order":       0
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `name` | string | ✓ | スイート名（空白のみ不可） |
| `description` | string | — | 説明文 |
| `parentId` | string | — | 親スイートID。指定するとネスト構造になる |
| `order` | number | — | 並び順（default: 0） |

**レスポンス (200)**
```json
{
  "data": {
    "id": "cuid",
    "projectId": "cuid",
    "name": "New Suite",
    "description": null,
    "parentId": null,
    "order": 0,
    "createdAt": "...",
    "updatedAt": "...",
    "parent": null,
    "_count": { "testCases": 0 }
  },
  "message": "Test suite created successfully"
}
```

---

### GET `/api/projects/{projectId}/testsuites/{suiteId}`

特定のテストスイートを詳細情報付きで取得する。

**必要権限:** `testsuites:read` + プロジェクトメンバーシップ

**レスポンス (200)**
```json
{
  "data": {
    "id": "cuid",
    "projectId": "cuid",
    "name": "Suite A",
    "description": "Description",
    "parentId": null,
    "order": 0,
    "project": { "id": "cuid", "name": "Project", "key": "PRJ" },
    "parent": null,
    "children": [...],
    "testCases": [
      {
        "id": "cuid",
        "tcId": "tc1",
        "suiteId": "cuid",
        "title": "...",
        "priority": "HIGH",
        "status": "ACTIVE",
        "moduleId": "cuid",
        "module": { "id": "cuid", "name": "...", "description": null },
        "createdBy": { "id": "cuid", "name": "User Name", "email": "user@example.com" },
        "_count": { "steps": 3, "results": 1, "defects": 0 }
      }
    ],
    "_count": { "testCases": 1, "children": 0 }
  },
  "message": "Test suite fetched successfully"
}
```

**エラー**
- `403` — プロジェクトへのアクセス権なし
- `404` — スイートが存在しない

---

### PUT / PATCH `/api/projects/{projectId}/testsuites/{suiteId}`

テストスイートを更新する（部分更新対応）。

**必要権限:** `testsuites:update` + プロジェクトメンバーシップ

**Request Body** (送信したフィールドのみ更新される)
```json
{
  "name":        "string (optional)",
  "description": "string | null (optional)",
  "parentId":    "string | null (optional)",
  "order":       0
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `name` | string | スイート名 |
| `description` | string \| null | `null` を送るとクリア |
| `parentId` | string \| null | `null` を送るとルートレベルに移動 |
| `order` | number | 並び順 |

**レスポンス (200)**
```json
{
  "data": { /* 更新後のTestSuiteオブジェクト */ },
  "message": "Test suite updated successfully"
}
```

**エラー**
- `403` — 権限なし

---

### DELETE `/api/projects/{projectId}/testsuites/{suiteId}`

テストスイートを削除する。

**必要権限:** `testsuites:delete` + プロジェクトメンバーシップ

> **注意:** 子スイートが存在する場合は削除不可（400エラー）。
> 削除時、スイートに属するテストケースの `suiteId` は `null` になる（SetNull）。

**レスポンス (200)**
```json
{
  "message": "Test suite deleted successfully"
}
```

**エラー**
- `403` — 権限なし
- `500` (実装上) — 子スイートが存在する場合（"Cannot delete suite with child suites"）

---

### GET `/api/testsuites/{suiteId}`

スイートIDで直接テストスイートを取得する（プロジェクトIDなし）。

**必要権限:** `testsuites:read`

レスポンス形式は `GET /api/projects/{projectId}/testsuites/{suiteId}` と同じ。

---

### PATCH `/api/testsuites/{suiteId}`

スイートIDで直接テストスイートを更新する。

**必要権限:** `testsuites:update`

リクエスト/レスポンス形式は `PUT /api/projects/{projectId}/testsuites/{suiteId}` と同じ。

---

### DELETE `/api/testsuites/{suiteId}`

スイートIDで直接テストスイートを削除する。

**必要権限:** `testsuites:delete`

---

### POST `/api/projects/{projectId}/testsuites/{suiteId}/testcases`

テストケースをスイートに追加する（多対多）。

**必要権限:** `testsuites:update`

**Request Body**
```json
{
  "testCaseIds": ["cuid1", "cuid2"]
}
```

**レスポンス (200)**
```json
{
  "data": { "success": true, "count": 2 },
  "message": "Test cases added to suite successfully"
}
```

> 既にスイートに存在するテストケースIDは `skipDuplicates` でスキップされる。

---

### DELETE `/api/projects/{projectId}/testsuites/{suiteId}/testcases`

スイートからテストケースを除外する（テストケース自体は削除されない）。

**必要権限:** `testsuites:update`

**Request Body**
```json
{
  "testCaseIds": ["cuid1", "cuid2"]
}
```

**レスポンス (200)**
```json
{
  "data": { "success": true, "count": 2 },
  "message": "Test cases removed from suite successfully"
}
```

---

### POST `/api/testsuites/{suiteId}/testcases`

スイートIDで直接テストケースを追加する。

**必要権限:** `testsuites:update`

リクエスト/レスポンス形式は `POST /api/projects/{projectId}/testsuites/{suiteId}/testcases` と同じ。

---

### DELETE `/api/testsuites/{suiteId}/testcases`

スイートIDで直接テストケースを除外する。

**必要権限:** `testsuites:update`

リクエスト/レスポンス形式は `DELETE /api/projects/{projectId}/testsuites/{suiteId}/testcases` と同じ。

---

### POST `/api/testsuites/{suiteId}/testcases/check`

指定テストケースのうち、このスイートに含まれるものを返す。

**必要権限:** `testcases:read`

**Request Body**
```json
{
  "testCaseIds": ["cuid1", "cuid2", "cuid3"]
}
```

**レスポンス (200)**
```json
{
  "data": { "testCaseIds": ["cuid1", "cuid3"] },
  "message": "Test cases checked successfully"
}
```

> 新しい多対多テーブルとレガシー `suiteId` フィールドの両方を確認し、重複排除して返す。

---

### GET `/api/testsuites/{suiteId}/available-testcases`

このスイートに**まだ追加されていない**テストケースをモジュールごとにグループ化して返す。

**必要権限:** `testcases:read`

**レスポンス (200)**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "name": "Module Name",
      "description": null,
      "projectId": "cuid",
      "testCases": [
        {
          "id": "cuid",
          "tcId": "tc5",
          "title": "Test Case Title",
          "flowId": "flow-001",
          ...
        }
      ],
      "_count": { "testCases": 3 }
    },
    {
      "id": "ungrouped",
      "name": "Ungrouped Test Cases",
      "description": "Test cases not assigned to any module",
      "testCases": [...],
      "_count": { "testCases": 1 }
    }
  ]
}
```

---

### POST `/api/projects/{projectId}/testsuites/{suiteId}/add-module`

スイート内の全テストケースに指定モジュールを割り当てる。

**必要権限:** `testsuites:update`

**Request Body**
```json
{
  "moduleId": "cuid (required)"
}
```

**レスポンス (200)**
```json
{
  "data": {
    /* 更新後のTestSuiteオブジェクト + testCases */
  },
  "message": "Module added to suite successfully"
}
```

**エラー**
- `400` — `moduleId` が未指定
- `404` — スイートまたはモジュールがプロジェクトに存在しない

---

### POST `/api/projects/{projectId}/testsuites/{suiteId}/update-module`

スイート内テストケースのモジュール割り当てを変更する。

**必要権限:** `testsuites:update`

**Request Body**
```json
{
  "oldModuleId": "cuid (optional) — 変更元モジュールID",
  "newModuleId": "cuid (required) — 変更先モジュールID"
}
```

> `oldModuleId` が指定された場合、そのモジュールに属するテストケースのみ更新する。
> 未指定の場合は `moduleId = null` のテストケースが対象となる。

**レスポンス (200)**
```json
{
  "data": { /* 更新後のTestSuiteオブジェクト */ },
  "message": "Module updated in suite successfully"
}
```

**エラー**
- `400` — `newModuleId` が未指定
- `404` — スイートまたはモジュールが存在しない

---

### POST `/api/projects/{projectId}/testsuites/{suiteId}/remove-module`

スイート内テストケースから指定モジュールの割り当てを解除する。

**必要権限:** `testsuites:update`

**Request Body**
```json
{
  "moduleId": "cuid (required)"
}
```

**レスポンス (200)**
```json
{
  "data": { /* 更新後のTestSuiteオブジェクト */ },
  "message": "Module removed from suite successfully"
}
```

---

### POST `/api/testsuites/move`

テストケースを指定スイートに移動する（レガシー: `TestCase.suiteId` フィールドを更新）。

**必要権限:** `testcases:update`

**Request Body**
```json
{
  "testCaseIds": ["cuid1", "cuid2"],
  "suiteId":     "cuid (optional) — null/未指定でスイートから除外"
}
```

**レスポンス (200)**
```json
{
  "data": { "success": true, "count": 2 },
  "message": "2 test cases moved successfully"
}
```

---

## TestCase API

### データモデル

```ts
TestCase {
  // 基本情報
  id:            string        // CUID
  tcId:          string        // プロジェクト内連番 (例: "tc1", "tc42")
  projectId:     string
  moduleId:      string | null
  suiteId:       string | null // Legacy
  title:         string
  description:   string | null
  expectedResult: string | null
  priority:      string        // DropdownOption値 (default: "MEDIUM")
  status:        string        // DropdownOption値 (default: "ACTIVE")
  estimatedTime: number | null // 秒単位
  preconditions: string | null
  postconditions: string | null
  testData:      string | null
  pendingDefectIds: string | null // カンマ区切りのDefect ID

  // 拡張フィールド（このリポジトリで追加）
  rtcId:           string | null
  flowId:          string | null
  layer:           "SMOKE" | "CORE" | "EXTENDED" | "UNKNOWN" | null
  testType:        string | null  // 正常系, 異常系, など (DB上は自由文字列)
  evidence:        string | null  // 根拠コード
  notes:           string | null  // 備考
  platform:        "Web" | "Web(SP)" | "iOS Native" | "Android Native" | null
  device:          "iPhone" | "Android" | "PC" | null
  domain:          string | null  // ドメイン
  functionName:    string | null  // 機能 (DBカラム名: function)
  executionType:   "手動" | "自動" | null
  automationStatus: "自動化済" | "自動化対象" | "自動化対象外" | "検討中" | null

  createdById:   string
  createdAt:     string   // ISO8601
  updatedAt:     string   // ISO8601
}

TestStep {
  id:             string
  testCaseId:     string
  stepNumber:     number  // 正の整数、testCase内でユニーク
  action:         string
  expectedResult: string
  createdAt:      string
  updatedAt:      string
}
```

---

### GET `/api/projects/{projectId}/testcases`

プロジェクト内のテストケース一覧を取得する。クエリパラメーターでフィルタリング・ページネーションが可能。

**必要権限:** `testcases:read`

**Query Parameters**

| パラメーター | 型 | 説明 |
|------------|-----|------|
| `suiteId` | string | スイートIDでフィルタリング |
| `priority` | string | 優先度でフィルタリング |
| `status` | string | ステータスでフィルタリング |
| `search` | string | タイトルなどの全文検索 |
| `domain` | string | ドメインでフィルタリング |
| `functionName` | string | 機能名でフィルタリング |
| `moduleId` | string | モジュールIDでフィルタリング（ページネーションモード時のみ） |
| `page` | number | ページ番号（指定するとページネーションモード） |
| `limit` | number | 1ページあたりの件数（default: 10） |
| `groupBy` | string | グループ化キー（default: `"module"`、ページネーションモード時のみ） |
| `idsOnly` | boolean | `true` の場合、IDのみを返す |

**idsOnly=true 時のレスポンス (200)**
```json
{
  "data": { "ids": ["cuid1", "cuid2"] }
}
```

**通常モードのレスポンス (200)**
```json
{
  "data": [ /* TestCaseオブジェクト配列 */ ]
}
```

**ページネーションモードのレスポンス (200)**
```json
{
  "data": [ /* TestCaseオブジェクト配列 */ ],
  "modules": [ /* モジュール情報配列 */ ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 48,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

### POST `/api/projects/{projectId}/testcases`

新しいテストケースを作成する。

**必要権限:** `testcases:create`

**Request Body**

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `title` | string | ✓ | テストケース名（1〜200文字） |
| `moduleId` | string \| null | — | モジュールID |
| `suiteId` | string \| null | — | スイートID（レガシー） |
| `description` | string | — | 説明文 |
| `expectedResult` | string | — | 期待結果（全体） |
| `testData` | string | — | テストデータ/入力値 |
| `priority` | string | — | 優先度（DropdownOptionの値、default: "MEDIUM"） |
| `status` | string | — | ステータス（DropdownOptionの値、default: "ACTIVE"） |
| `estimatedTime` | number | — | 見積時間（秒、0以上） |
| `preconditions` | string | — | 事前条件 |
| `postconditions` | string | — | 事後条件 |
| `steps` | TestStepInput[] | — | テストステップ配列 |
| `rtcId` | string \| null | — | RTC-ID |
| `flowId` | string \| null | — | Flow-ID |
| `layer` | `"SMOKE"` \| `"CORE"` \| `"EXTENDED"` \| `"UNKNOWN"` \| null | — | テストレイヤー |
| `evidence` | string \| null | — | 根拠コード |
| `notes` | string \| null | — | 備考 |
| `platform` | `"Web"` \| `"Web(SP)"` \| `"iOS Native"` \| `"Android Native"` \| null | — | プラットフォーム |
| `device` | `"iPhone"` \| `"Android"` \| `"PC"` \| null | — | 端末 |
| `domain` | string \| null | — | ドメイン |
| `functionName` | string \| null | — | 機能名 |
| `executionType` | `"手動"` \| `"自動"` \| null | — | 実行方式 |
| `automationStatus` | `"自動化済"` \| `"自動化対象"` \| `"自動化対象外"` \| `"検討中"` \| null | — | 自動化状況 |

**TestStepInput**
```json
{
  "stepNumber":     1,
  "action":         "操作内容 (省略可、ただしexpectedResultと片方必須)",
  "expectedResult": "期待結果 (省略可、ただしactionと片方必須)"
}
```

**レスポンス (201)**
```json
{
  "data": {
    "id": "cuid",
    "tcId": "tc42",
    "projectId": "cuid",
    "title": "New Test Case",
    ...
  }
}
```

---

### GET `/api/projects/{projectId}/testcases/{tcId}`

テストケースを詳細情報付きで取得する。

**必要権限:** `testcases:read`

> `{tcId}` はデータベース上の内部ID（CUID）。`tc1` のような連番IDではない点に注意。

**レスポンス (200)**
```json
{
  "data": {
    "id": "cuid",
    "tcId": "tc42",
    "title": "...",
    "steps": [...],
    "module": {...},
    "createdBy": {...},
    ...
  }
}
```

---

### PUT `/api/projects/{projectId}/testcases/{tcId}`

テストケースを更新する（部分更新対応）。

**必要権限:** `testcases:update`

**Request Body** (全フィールドがオプション)

`POST /api/projects/{projectId}/testcases` と同じフィールドセットだが、`title` も任意（ただし空文字不可）。
`steps` フィールドは含まれない（ステップ更新は専用エンドポイント使用）。

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `title` | string | 1〜200文字、空文字不可 |
| `moduleId` | string \| null | `null` でモジュール解除 |
| `suiteId` | string \| null | `null` でスイート解除（レガシー） |
| `description` | string | |
| `expectedResult` | string | |
| `testData` | string | |
| `priority` | string | |
| `status` | string | |
| `estimatedTime` | number | 秒、0以上 |
| `preconditions` | string | |
| `postconditions` | string | |
| `rtcId` | string \| null | |
| `flowId` | string \| null | |
| `layer` | `"SMOKE"` \| `"CORE"` \| `"EXTENDED"` \| `"UNKNOWN"` \| null | |
| `evidence` | string \| null | |
| `notes` | string \| null | |
| `platform` | `"Web"` \| `"Web(SP)"` \| `"iOS Native"` \| `"Android Native"` \| null | |
| `device` | `"iPhone"` \| `"Android"` \| `"PC"` \| null | |
| `domain` | string \| null | |
| `functionName` | string \| null | |
| `executionType` | `"手動"` \| `"自動"` \| null | |
| `automationStatus` | `"自動化済"` \| `"自動化対象"` \| `"自動化対象外"` \| `"検討中"` \| null | |

**レスポンス (200)**
```json
{
  "data": { /* 更新後のTestCaseオブジェクト */ }
}
```

**エラー**
- `404` — テストケースが存在しない
- `422` — バリデーションエラー

---

### DELETE `/api/projects/{projectId}/testcases/{tcId}`

テストケースを削除する。

**必要権限:** `testcases:delete`

**レスポンス (200)**
```json
{
  "message": "Test case deleted successfully"
}
```

---

### GET `/api/testcases/{id}`

内部IDでテストケースを直接取得する（プロジェクトIDなし）。

**必要権限:** `testcases:read`

---

### PUT `/api/testcases/{id}`

内部IDでテストケースを直接更新する。

**必要権限:** `testcases:update`

---

### DELETE `/api/testcases/{id}`

内部IDでテストケースを直接削除する。

**必要権限:** `testcases:delete`

---

## TestStep API

### データモデル

```ts
TestStep {
  id:             string   // CUID
  testCaseId:     string
  stepNumber:     number   // 1以上の整数、テストケース内でユニーク
  action:         string   // 操作内容
  expectedResult: string   // 期待結果
  createdAt:      string   // ISO8601
  updatedAt:      string   // ISO8601
}
```

> テストケース作成時（`POST /api/projects/{id}/testcases`）に `steps` を含めることで、テストケースとステップを同時に作成できる。
> 作成後のステップ管理は以下の専用エンドポイントを使用する。

---

### PUT `/api/projects/{projectId}/testcases/{tcId}/steps`

テストケースのステップをスマートupsertで更新する。

**必要権限:** `testcases:update`

#### 動作仕様

| ステップの `id` | 処理 |
|----------------|------|
| なし または `temp-` 始まり | **新規作成** |
| 有効なCUID（送信リストに含まれる） | **更新**（存在しない場合は同IDで作成） |
| 有効なCUID（送信リストに**含まれない**） | **削除** |
| 空配列 `[]` を送信 | 全ステップを**削除** |

> 送信リストに含まれないステップは削除される。ステップの追加・削除・並び替えを含む全操作をこの1エンドポイントで行う。

**Request Body**
```json
{
  "steps": [
    {
      "id":             "既存ステップのCUID (optional)",
      "stepNumber":     1,
      "action":         "ブラウザでURLを開く",
      "expectedResult": "ページが表示される"
    },
    {
      "stepNumber":     2,
      "action":         "",
      "expectedResult": "エラーメッセージが表示される"
    },
    {
      "stepNumber":     3,
      "action":         "送信ボタンをクリックする",
      "expectedResult": ""
    }
  ]
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `steps` | array \| string | — | ステップ配列または JSON文字列。省略または空配列で全ステップ削除 |
| `steps[].id` | string | — | 既存ステップのCUID。`temp-` 始まりまたは未指定は新規作成 |
| `steps[].stepNumber` | number | ✓ | 1以上の整数。テストケース内でユニークである必要がある |
| `steps[].action` | string | △ | 操作内容。`expectedResult` との片方が必須 |
| `steps[].expectedResult` | string | △ | 期待結果。`action` との片方が必須 |

**レスポンス (200)**
```json
{
  "data": [
    {
      "id": "cuid",
      "testCaseId": "cuid",
      "stepNumber": 1,
      "action": "ブラウザでURLを開く",
      "expectedResult": "ページが表示される",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

> レスポンスは `stepNumber` 昇順でソートされた更新後の全ステップ配列。

**エラー**
- `404` — テストケースが存在しない
- `422` — バリデーションエラー（`action` と `expectedResult` が両方空、`stepNumber` が不正など）

---

### PUT `/api/testcases/{id}/steps`

内部IDでテストケースのステップを直接更新する（プロジェクトIDなし）。

**必要権限:** `testcases:update`

リクエスト/レスポンス形式は `PUT /api/projects/{projectId}/testcases/{tcId}/steps` と同じ。

---

### POST `/api/projects/{projectId}/testcases/{tcId}/add-to-module`

テストケースをモジュールに追加する。

**必要権限:** `testcases:update`

**Request Body**
```json
{
  "moduleId": "cuid (required)"
}
```

**レスポンス (200)**
```json
{
  "data": { /* 更新後のTestCaseオブジェクト */ }
}
```

**エラー**
- `404` — テストケースまたはモジュールが存在しない

---

### POST `/api/projects/{projectId}/testcases/{tcId}/remove-from-module`

テストケースをモジュールから解除する（`moduleId` を `null` にする）。

**必要権限:** `testcases:update`

**Request Body** — 不要

**レスポンス (200)**
```json
{
  "data": { /* 更新後のTestCaseオブジェクト */ }
}
```

---

### GET `/api/projects/{projectId}/testcases/{tcId}/attachments`

テストケースに紐付いた添付ファイル一覧を取得する。

**必要権限:** `testcases:read`

**レスポンス (200)**
```json
{
  "data": [
    {
      "id": "cuid",
      "fileName": "screenshot.png",
      "fieldName": "evidence",
      ...
    }
  ]
}
```

---

### POST `/api/projects/{projectId}/testcases/{tcId}/attachments`

事前にアップロード済みのファイルをテストケースに関連付ける。

**必要権限:** `testcases:update`

**Request Body**
```json
{
  "attachments": [
    {
      "id":        "cuid (required) — アップロード済み添付ファイルID",
      "fieldName": "string (optional) — 関連フィールド名"
    }
  ]
}
```

**レスポンス (201)**
```json
{
  "data": [ /* 関連付けられた添付ファイル */ ]
}
```

---

## Enum リファレンス

### TestLayer

| 値 | 説明 |
|----|------|
| `SMOKE` | スモークテスト |
| `CORE` | コアテスト |
| `EXTENDED` | 拡張テスト |
| `UNKNOWN` | 未分類 |

### Platform

| 値 |
|----|
| `Web` |
| `Web(SP)` |
| `iOS Native` |
| `Android Native` |

### Device

| 値 |
|----|
| `iPhone` |
| `Android` |
| `PC` |

### ExecutionType

| 値 |
|----|
| `手動` |
| `自動` |

### AutomationStatus

| 値 |
|----|
| `自動化済` |
| `自動化対象` |
| `自動化対象外` |
| `検討中` |

---

## 認証方法

### セッション認証
NextAuth.js によるセッションCookieを使用。

### APIキー認証

```http
X-API-Key: your-api-key
```

APIキーはプロジェクトスコープまたは全体スコープで発行可能。
プロジェクトスコープのAPIキーは、対象プロジェクト以外のリソースへのアクセスが制限される。

---

## エンドポイント一覧

### TestSuite

| Method | Path | 権限 | 説明 |
|--------|------|------|------|
| GET | `/api/projects/{id}/testsuites` | `testsuites:read` | プロジェクトのスイート一覧 |
| POST | `/api/projects/{id}/testsuites` | `testsuites:create` | スイート作成 |
| GET | `/api/projects/{id}/testsuites/{suiteId}` | `testsuites:read` | スイート詳細 |
| PUT/PATCH | `/api/projects/{id}/testsuites/{suiteId}` | `testsuites:update` | スイート更新 |
| DELETE | `/api/projects/{id}/testsuites/{suiteId}` | `testsuites:delete` | スイート削除 |
| POST | `/api/projects/{id}/testsuites/{suiteId}/testcases` | `testsuites:update` | スイートにTC追加 |
| DELETE | `/api/projects/{id}/testsuites/{suiteId}/testcases` | `testsuites:update` | スイートからTC除外 |
| POST | `/api/projects/{id}/testsuites/{suiteId}/add-module` | `testsuites:update` | スイートにモジュール割当 |
| POST | `/api/projects/{id}/testsuites/{suiteId}/update-module` | `testsuites:update` | スイートのモジュール変更 |
| POST | `/api/projects/{id}/testsuites/{suiteId}/remove-module` | `testsuites:update` | スイートのモジュール解除 |
| GET | `/api/testsuites/{id}` | `testsuites:read` | スイート詳細（直接） |
| PATCH | `/api/testsuites/{id}` | `testsuites:update` | スイート更新（直接） |
| DELETE | `/api/testsuites/{id}` | `testsuites:delete` | スイート削除（直接） |
| POST | `/api/testsuites/{id}/testcases` | `testsuites:update` | スイートにTC追加（直接） |
| DELETE | `/api/testsuites/{id}/testcases` | `testsuites:update` | スイートからTC除外（直接） |
| POST | `/api/testsuites/{id}/testcases/check` | `testcases:read` | スイート内TCの確認 |
| GET | `/api/testsuites/{id}/available-testcases` | `testcases:read` | 追加可能なTC一覧 |
| POST | `/api/testsuites/move` | `testcases:update` | TCをスイートに移動（レガシー） |

### TestCase

| Method | Path | 権限 | 説明 |
|--------|------|------|------|
| GET | `/api/projects/{id}/testcases` | `testcases:read` | TC一覧（フィルター/ページネーション） |
| POST | `/api/projects/{id}/testcases` | `testcases:create` | TC作成 |
| GET | `/api/projects/{id}/testcases/{tcId}` | `testcases:read` | TC詳細 |
| PUT | `/api/projects/{id}/testcases/{tcId}` | `testcases:update` | TC更新 |
| DELETE | `/api/projects/{id}/testcases/{tcId}` | `testcases:delete` | TC削除 |
| PUT | `/api/projects/{id}/testcases/{tcId}/steps` | `testcases:update` | ステップ upsert（作成・更新・削除） |
| PUT | `/api/testcases/{id}/steps` | `testcases:update` | ステップ upsert（直接） |
| GET | `/api/projects/{id}/testcases/{tcId}/attachments` | `testcases:read` | 添付ファイル一覧 |
| POST | `/api/projects/{id}/testcases/{tcId}/attachments` | `testcases:update` | 添付ファイル関連付け |
| POST | `/api/projects/{id}/testcases/{tcId}/add-to-module` | `testcases:update` | モジュールに追加 |
| POST | `/api/projects/{id}/testcases/{tcId}/remove-from-module` | `testcases:update` | モジュールから解除 |
| GET | `/api/testcases/{id}` | `testcases:read` | TC詳細（直接） |
| PUT | `/api/testcases/{id}` | `testcases:update` | TC更新（直接） |
| DELETE | `/api/testcases/{id}` | `testcases:delete` | TC削除（直接） |
