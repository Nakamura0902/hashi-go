# はしGO セキュリティ仕様

iOSアプリ化／一般公開を見据えた、はしGOのセキュリティ実装と運用設定。

## 1. 認証モデル（アカウント必須）
- **共有ゲストを廃止**し、ユーザーごとに固有の `auth.uid()` を持つ本物のアカウントに移行。
  - お気に入り・来店履歴・レビューは**個人ごとに分離**（RLSで本人のみ読み書き）。
- ユーザー: メール＋パスワード（`/login` でサインアップ/ログイン）、**Appleでサインイン**（iOS向け）。
- 店舗オーナー: `/merchant/login`、管理者: `/admin/login`（Supabase Auth）。
- 未ログインでユーザー画面に来たら `/login` へ自動リダイレクト（`AuthProvider`）。
  - セッション取得が遅延/失敗しても固まらないようフェイルセーフ実装済み。
- ログアウトはマイページから。

## 2. 認可（RLS）
`supabase/rls.sql` ＋ `supabase/rls_admin.sql` 適用済み。
- 公開カタログ（stores/seat/offers/reviews/store_messages）は anon でも閲覧可。
- `favorites` / `visits` は本人（`user_id = auth.uid()`）のみ。
- `reviews` は閲覧公開・投稿/編集は本人のみ。
- 店舗系の書き込みは `owner_user_id = auth.uid()` のオーナーのみ。
- 管理者は `is_admin()`（現状はJWTメール判定。**本番ではロールクレームへ置換推奨**）。

## 3. 通信・ヘッダー（`next.config.js`）
- **CSP**（既知の通信先のみ許可: Supabase / Mapbox / Unsplash）
- **HSTS**, **X-Content-Type-Options: nosniff**, **X-Frame-Options: DENY**（クリックジャッキング防止）
- **Referrer-Policy**, **Permissions-Policy**（位置情報は自サイトのみ、カメラ/マイク無効）
- `X-Powered-By` 非表示。HTTPSはVercelが標準提供。

## 4. 入力・濫用対策
- レビュー: 評価1〜5に丸め、本文300文字上限＋trim。
- 店主メッセージ: 80文字上限。
- 出力はReactが標準エスケープ（XSS耐性）。`dangerouslySetInnerHTML` 不使用。
- レート制限はSupabaseの標準＋将来Edge Functionで強化可能。

## 5. シークレット管理
- クライアントに置くのは**公開キーのみ**（`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN`）。`service_role` キーはクライアントに**置かない**。
- 本番ビルドでは店舗/管理のデモ資格情報を**自動入力・表示しない**（`isProd` 判定）。

---

## 6. 本番公開前に必要な Supabase ダッシュボード設定（手動）
> これらはMCP/コードから変更できないため、ダッシュボードで設定してください。

1. **Authentication → Providers → Email**: 有効化。`Confirm email`（確認メール）をONにするとサインアップ時に確認が必要（推奨）。OFFなら即ログイン。
2. **Authentication → Providers → Apple**: iOS申請に向け設定（Apple Developerの Services ID / Key / Team ID、Supabaseのcallback URLをApple側に登録）。
3. **Authentication → Policies → Leaked Password Protection**: **ON**（漏えいパスワード拒否）。
4. **Authentication → URL Configuration**: `Site URL` と `Redirect URLs` に本番URL（Vercel）と、iOS用のディープリンク/ユニバーサルリンクを追加。
5. **デモアカウントの扱い**: 公開前に `guest@/admin@/s-*@hashigo.jp` 等のデモアカウントのパスワード変更 or 削除。`is_admin()` のメール判定を**ロールクレーム（Custom Access Token Hook）**へ移行推奨。
6. **MFA（多要素認証）**: 管理者アカウントは有効化推奨。

---

## 7. iOSアプリ化（ラッパー）時のセキュリティ指針
WebをCapacitor/ネイティブWebViewでラップする想定。

- **Sign in with Apple 必須**: 他のソーシャルログインを提供する場合、App Store審査でAppleログインが実質必須。
- **トークンの安全保管**: Web版はlocalStorageにセッション保存。ネイティブでは **Keychain**（Capacitor Secure Storage等）に保存するアダプタへ差し替える。
- **ATS（App Transport Security）**: HTTPS通信のみ許可（デフォルト維持）。必要に応じ**証明書ピンニング**。
- **ディープリンク/ユニバーサルリンク**: OAuth（Apple）リダイレクトとパスワード再設定の戻り先に設定。
- **権限の用途文言（Info.plist）**: `NSLocationWhenInUseUsageDescription`（現在地）。将来カメラ（QR読取）を使うなら `NSCameraUsageDescription`。
- **プライバシーマニフェスト**: `PrivacyInfo.xcprivacy` を用意（位置情報・トラッキングの宣言）。
- **生体認証（任意）**: Face ID / Touch ID で再ログインや決済前の確認。
- **ジェイルブレイク検知（任意）**: 高リスク操作前のチェック。
- **アプリ内に秘密情報を同梱しない**: 公開キー以外は持たせない。サーバー側ロジックはEdge Functionへ。

---

## 8. 既知の残課題（本番化TODO）
- [ ] `is_admin()` メール判定 → ロールクレームへ
- [ ] デモアカウントのパスワード変更/削除
- [ ] Confirm email / Leaked Password Protection をダッシュボードでON
- [ ] Apple プロバイダ設定（iOS）
- [ ] レート制限の強化（Edge Function）
- [ ] 利用規約・プライバシーポリシーの整備（`/login` に表示済みの文言のリンク先）
