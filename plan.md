# Google認証ログイン実装計画

## 方針
- PrismaAdapterを外し、JWTセッション戦略を維持する（既存コードへの影響を最小化）
- Google OAuthの signIn コールバック内で手動でユーザー作成・ドメイン制限を行う
- 既存のメール/パスワードログインはそのまま共存させる

---

## 実装チェックリスト

### 1. 事前準備
- [ ] Google Cloud ConsoleでOAuthクライアントIDを発行
  - 承認済みリダイレクトURIに `{NEXTAUTH_URL}/api/auth/callback/google` を追加
- [ ] `.env` / 本番環境変数に以下を追加
  ```
  GOOGLE_CLIENT_ID=xxx
  GOOGLE_CLIENT_SECRET=xxx
  GOOGLE_ALLOWED_DOMAIN=yourcompany.com
  ```

### 2. Prismaスキーマ変更
- [ ] `prisma/schema.prisma` の `User.password` を `String?`（nullable）に変更
  ```prisma
  password  String?
  ```
- [ ] マイグレーション作成・適用
  ```bash
  npx prisma migrate dev --name make-password-nullable
  ```

### 3. 環境変数バリデーション更新
- [ ] `lib/env-validation.ts` に `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_ALLOWED_DOMAIN` を追加
  - いずれも任意項目（未設定時はGoogleログイン無効）として扱う

### 4. NextAuth設定変更（`lib/auth.ts`）
- [ ] `PrismaAdapter` のimportと使用を削除
- [ ] `next-auth/providers/google` の GoogleProvider を追加
- [ ] `providers` 配列に GoogleProvider を追加
- [ ] `callbacks.signIn` を追加
  - `account.provider === 'google'` の場合のみ処理
  - メールアドレスのドメインが `GOOGLE_ALLOWED_DOMAIN` と一致しない場合は `false` を返す
  - DBにユーザーが存在しない場合、デフォルトロール（TESTER）で自動作成
- [ ] `callbacks.jwt` を更新
  - Googleログイン時（`user` がある場合）にemailでDBからユーザーを取得するよう対応

### 5. ログイン画面の更新
- [ ] `app/components/pages/subcomponents/LoginForm.tsx` に「Googleでログイン」ボタンを追加
  - `signIn('google')` を呼び出す
  - `GOOGLE_CLIENT_ID` が設定されていない場合はボタンを非表示にする（APIエンドポイント経由でフラグを返す、またはenv変数を`NEXT_PUBLIC_`で公開）
- [ ] ログイン画面のUI調整（区切り線など）

### 6. `.env.example` の更新
- [ ] Google認証関連の環境変数例をコメントとともに追記
  ```
  # Google OAuth (Optional)
  GOOGLE_CLIENT_ID=""
  GOOGLE_CLIENT_SECRET=""
  GOOGLE_ALLOWED_DOMAIN=""  # 例: yourcompany.com
  ```

### 7. 動作確認
- [ ] Googleログインで許可ドメインのアカウントがログインできる
- [ ] 許可ドメイン外のアカウントがログインを拒否される
- [ ] 初回ログイン時にユーザーがDBに作成される（ロール: TESTER）
- [ ] 既存のメール/パスワードログインが引き続き動作する
- [ ] ログイン済みユーザーがGoogleログインした場合、既存アカウントに紐付く（重複作成されない）

---

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `lib/auth.ts` | PrismaAdapter削除、GoogleProvider追加、signInコールバック追加 |
| `lib/env-validation.ts` | Google関連の環境変数を追加 |
| `prisma/schema.prisma` | `User.password` をnullableに変更 |
| `prisma/migrations/...` | マイグレーションファイル（自動生成） |
| `app/components/pages/subcomponents/LoginForm.tsx` | Googleログインボタン追加 |
| `.env.example` | Google認証の環境変数例を追記 |

---

## 注意事項

- `password` をnullableにするため、既存のCredentials認証で `user.password` が `null` の場合のガードが必要
- 新規作成ユーザーのデフォルトロールは `TESTER`。変更したい場合は `GOOGLE_DEFAULT_ROLE` 環境変数で制御可能にする
- `GOOGLE_ALLOWED_DOMAIN` が未設定の場合はGoogleログインを無効化する（セキュリティ上のデフォルト）
