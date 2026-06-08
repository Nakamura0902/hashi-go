-- はしGO データベーススキーマ（PostgreSQL / Supabase）
-- 要件 §9 準拠。MVPは空席情報を店舗の手動入力で運用する。
-- 適用: Supabase SQL Editor に貼り付けて実行 → .env.local に URL/ANON_KEY を設定。

-- ── ユーザー（user / store / admin の3ロール）──
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text unique not null,
  password_hash text,
  role          text not null default 'user' check (role in ('user','store','admin')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists user_profiles (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references users(id) on delete cascade,
  nickname             text,
  preferred_budget_min int,
  preferred_budget_max int,
  favorite_moods       text[] default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ── 店舗 ──
create table if not exists stores (
  id              text primary key,
  owner_user_id   uuid references users(id) on delete set null,
  name            text not null,
  description     text default '',
  address         text default '',
  nearest_station text default '',
  latitude        double precision not null,
  longitude       double precision not null,
  phone           text default '',
  average_budget  int default 0,
  open_time       text default '',
  close_time      text default '',
  is_active       boolean not null default false, -- 管理者審査で掲載ON
  is_late_night   boolean not null default false,
  -- MVPでは配列カラムで簡略化（将来 store_tags / store_images に正規化可）
  images          text[] default '{}',
  moods           text[] default '{}',
  purposes        text[] default '{}',
  features        text[] default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 正規化版（任意・将来用）
create table if not exists store_images (
  id         uuid primary key default gen_random_uuid(),
  store_id   text references stores(id) on delete cascade,
  image_url  text not null,
  sort_order int default 0
);

create table if not exists store_tags (
  id        uuid primary key default gen_random_uuid(),
  store_id  text references stores(id) on delete cascade,
  tag_type  text not null check (tag_type in ('mood','purpose','feature')),
  tag_value text not null
);

-- ── 空席状況（店舗が手動更新）──
create table if not exists store_seat_status (
  store_id             text primary key references stores(id) on delete cascade,
  available_status     text not null default 'closed'
                        check (available_status in ('open','few','soon','full','closed')),
  table2_free          int default 0,
  table2_total         int default 0,
  table4_free          int default 0,
  table4_total         int default 0,
  counter_free         int default 0,
  counter_total        int default 0,
  total_group_capacity int default 0,
  updated_at           timestamptz not null default now()
);

-- ── 特典 ──
create table if not exists store_offers (
  id          text primary key,
  store_id    text references stores(id) on delete cascade,
  title       text not null,
  description text default '',
  is_active   boolean not null default true,
  start_time  timestamptz,
  end_time    timestamptz
);

-- ── お気に入り ──
create table if not exists favorites (
  user_id    uuid not null,
  store_id   text references stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, store_id)
);

-- ── 検索ログ（分析用）──
create table if not exists search_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid,
  latitude     double precision,
  longitude    double precision,
  people_count int,
  budget_min   int,
  budget_max   int,
  mood         text,
  purpose      text,
  searched_at  timestamptz not null default now()
);

-- ── 来店 ──
create table if not exists visits (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null,
  store_id           text references stores(id) on delete cascade,
  store_name         text,
  status             text not null default 'planned'
                     check (status in ('planned','checked_in','cancelled')),
  planned_at         timestamptz not null default now(),
  checked_in_at      timestamptz,
  score_at_selection int default 0,
  qr_token           text unique
);

-- ── QRチェックイン（visits.qr_token を主に使うが、明細が必要な場合に）──
create table if not exists qr_checkins (
  id            uuid primary key default gen_random_uuid(),
  visit_id      uuid references visits(id) on delete cascade,
  qr_token      text not null,
  expires_at    timestamptz,
  checked_in_at timestamptz
);

-- インデックス
create index if not exists idx_visits_store on visits(store_id);
create index if not exists idx_visits_user on visits(user_id);
create index if not exists idx_offers_store on store_offers(store_id);

-- RLS方針（本番で有効化）:
--   stores/store_seat_status/store_offers ... is_active=true は誰でもSELECT可、
--   更新は owner_user_id = auth.uid() のみ。
--   visits/favorites ... user_id = auth.uid() の行のみ。
--   admin ロールは service_role 経由で全件操作。
-- MVP(モック)段階ではRLS未使用。実DB切替時に有効化する。
-- 実装済みマイグレーション: supabase/rls.sql
--   ※ auth.uid() 依存のため、適用は Supabase Auth 導入とセットで行うこと。
--     現状の anon + MOCK_USER_ID では SELECT 以外が全て失敗する。
