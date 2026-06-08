# はしGO 🏮

> 次、どこ行く？を10秒で。

飲み会の2軒目・3軒目に「**今すぐ入れる近くの居酒屋**」を提案する、リアルタイム送客マッチングアプリ（MVP）。空席 × 現在地 × 人数 でサクッと決まる。

## 特徴

- **モバイルファースト** / 酔っていても迷わない大ボタン・最小入力
- **空席を色分け**（すぐ案内可=緑 / 残りわずか=橙 / 満席=赤 / もうすぐ=黄 / 営業外=灰）
- **はしごスコア**（0〜100）で「今行ける度」を自動算出
- ユーザー / 店舗 / 運営 の3ロール

## 技術構成

| | |
|---|---|
| フレームワーク | Next.js 15 (App Router) + React 19 |
| 言語 | TypeScript (strict) |
| UI | Tailwind CSS 3.4（デザイントークンは `tailwind.config.ts`） |
| 地図 | Mapbox GL（トークン無しは簡易モック地図に自動フォールバック） |
| 状態管理 | Zustand |
| データ | localStorage モック / Supabase（環境変数で自動切替） |

## はじめかた

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く。**環境変数なしでそのまま動きます**（localStorage + 簡易地図）。

### 実DB / 実地図に切り替える（任意）

`.env.local.example` を `.env.local` にコピーして値を設定:

- `NEXT_PUBLIC_MAPBOX_TOKEN` … 設定すると本物のMapbox地図に
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` … 設定すると Supabase に
  - `supabase/schema.sql` を Supabase SQL Editor で実行してテーブル作成

## 画面

| ロール | URL | 画面 |
|---|---|---|
| ユーザー | `/` | ホーム / 検索設定 |
| | `/list` | おすすめ一覧 |
| | `/map` | 地図で探す |
| | `/store/[id]` | 店舗詳細 / 行く |
| | `/visit/[id]` | 来店（QRチェックイン） |
| | `/favorites` `/history` `/mypage` | お気に入り / 履歴 / マイページ |
| 店舗 | `/merchant/login` | 店舗ログイン |
| | `/merchant` | ダッシュボード |
| | `/merchant/seats` | 空席更新（1〜2タップ） |
| | `/merchant/offers` `/merchant/visits` `/merchant/profile` | 特典 / 来店 / 店舗情報 |
| 運営 | `/admin/login` | 管理者ログイン |
| | `/admin` | 店舗管理・審査 |
| | `/admin/analytics` | 分析ダッシュボード |

> ログインはMVPのためモック（任意の入力でログイン可）。

## ディレクトリ

```
src/
  app/            # 画面（ルーティング）
  components/
    ui/           # 再利用UI部品（BigButton, Card, Chip, SeatBadge…）
    store/        # 店舗カード・スコア・空席バッジ
    map/          # StoreMap（Mapbox / MockMap）
    nav/          # 下部ナビ（ユーザー / 店舗 / 運営）
  lib/
    score.ts      # はしごスコア算出（配点は SCORE_WEIGHTS に集約）
    geo.ts        # 距離・徒歩時間
    mockData.ts   # ダミー店舗5件
    data/         # データ層（mock / supabase を自動切替）
    store.ts      # 検索条件（Zustand）
supabase/schema.sql
.claude/designs/  # UI設計書（コア4画面）
```

## はしごスコアの配点（`src/lib/score.ts`）

空席あり +20 / 徒歩5分以内 +20 / 人数適合 +15 / 予算一致 +15 / 雰囲気一致 +10 / 目的一致 +10 / 特典あり +5 / 深夜営業 +5 → 0〜100に丸め。

## 今後の拡張

リアルタイム通知（Supabase Realtime）/ 送客分析の高度化 / POS・予約台帳連携 / クーポン最適化 / 需要予測 / 多店舗管理 / 本格認証 / PWA・ネイティブ化。
