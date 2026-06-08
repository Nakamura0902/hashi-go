-- はしGO RLS（Row Level Security）有効化マイグレーション
-- schema.sql 末尾の RLS 方針コメントを実装したもの。
--
-- ⚠️ 適用前提（重要）:
--   このポリシーは auth.uid()（Supabase Auth の JWT）に依存する。
--   現在アプリは anon キー + MOCK_USER_ID(固定uuid) + localStorage で動作しており、
--   JWT を発行していないため auth.uid() は常に NULL になる。
--   この状態で適用すると、SELECT(公開閲覧)以外（お気に入り/来店/空席更新/特典/管理）が
--   すべて 403 で失敗する。必ず Supabase Auth 導入とセットで適用すること。
--   管理者操作は service_role キー経由（RLSをバイパス）で行う前提。
--
-- 冪等に書いてあるので再実行可能。Supabase SQL Editor もしくは MCP マイグレーションで適用。

-- ───────────────────────────────────────────────
-- 1. RLS 有効化
-- ───────────────────────────────────────────────
alter table stores            enable row level security;
alter table store_seat_status enable row level security;
alter table store_offers      enable row level security;
alter table favorites         enable row level security;
alter table visits            enable row level security;

-- 公開機能で触らないテーブルもRLS有効化（ポリシー無し＝anon/authenticatedは全拒否、
-- service_role のみバイパスでアクセス可能。安全側のデフォルト）。
alter table users         enable row level security;
alter table user_profiles enable row level security;
alter table store_images  enable row level security;
alter table store_tags    enable row level security;
alter table search_logs   enable row level security;
alter table qr_checkins   enable row level security;

-- ───────────────────────────────────────────────
-- 2. stores
--   - is_active=true は誰でも SELECT 可
--   - オーナーは自店舗を（非公開でも）SELECT/INSERT/UPDATE/DELETE 可
-- ───────────────────────────────────────────────
drop policy if exists stores_public_read   on stores;
drop policy if exists stores_owner_read     on stores;
drop policy if exists stores_owner_insert   on stores;
drop policy if exists stores_owner_update   on stores;
drop policy if exists stores_owner_delete   on stores;

create policy stores_public_read on stores
  for select to anon, authenticated
  using (is_active = true);

create policy stores_owner_read on stores
  for select to authenticated
  using (owner_user_id = auth.uid());

create policy stores_owner_insert on stores
  for insert to authenticated
  with check (owner_user_id = auth.uid());

create policy stores_owner_update on stores
  for update to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy stores_owner_delete on stores
  for delete to authenticated
  using (owner_user_id = auth.uid());

-- ───────────────────────────────────────────────
-- 3. store_seat_status（オーナー判定は stores へ join）
--   - 公開店舗の空席は誰でも SELECT 可
--   - 書き込みは店舗オーナーのみ
-- ───────────────────────────────────────────────
drop policy if exists seat_public_read on store_seat_status;
drop policy if exists seat_owner_read   on store_seat_status;
drop policy if exists seat_owner_write   on store_seat_status;

create policy seat_public_read on store_seat_status
  for select to anon, authenticated
  using (exists (
    select 1 from stores s
    where s.id = store_seat_status.store_id and s.is_active = true
  ));

create policy seat_owner_read on store_seat_status
  for select to authenticated
  using (exists (
    select 1 from stores s
    where s.id = store_seat_status.store_id and s.owner_user_id = auth.uid()
  ));

-- INSERT/UPDATE/DELETE をまとめて owner に許可
create policy seat_owner_write on store_seat_status
  for all to authenticated
  using (exists (
    select 1 from stores s
    where s.id = store_seat_status.store_id and s.owner_user_id = auth.uid()
  ))
  with check (exists (
    select 1 from stores s
    where s.id = store_seat_status.store_id and s.owner_user_id = auth.uid()
  ));

-- ───────────────────────────────────────────────
-- 4. store_offers
--   - 公開店舗かつ is_active=true の特典は誰でも SELECT 可
--   - 書き込みは店舗オーナーのみ
-- ───────────────────────────────────────────────
drop policy if exists offers_public_read on store_offers;
drop policy if exists offers_owner_read   on store_offers;
drop policy if exists offers_owner_write   on store_offers;

create policy offers_public_read on store_offers
  for select to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from stores s
      where s.id = store_offers.store_id and s.is_active = true
    )
  );

create policy offers_owner_read on store_offers
  for select to authenticated
  using (exists (
    select 1 from stores s
    where s.id = store_offers.store_id and s.owner_user_id = auth.uid()
  ));

create policy offers_owner_write on store_offers
  for all to authenticated
  using (exists (
    select 1 from stores s
    where s.id = store_offers.store_id and s.owner_user_id = auth.uid()
  ))
  with check (exists (
    select 1 from stores s
    where s.id = store_offers.store_id and s.owner_user_id = auth.uid()
  ));

-- ───────────────────────────────────────────────
-- 5. favorites（本人のみ）
-- ───────────────────────────────────────────────
drop policy if exists favorites_owner_all on favorites;

create policy favorites_owner_all on favorites
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ───────────────────────────────────────────────
-- 6. visits
--   - 本人(user_id = auth.uid()) は自分の来店を SELECT/INSERT/UPDATE 可
--   - 店舗オーナーは自店舗の来店を SELECT 可（merchant ダッシュボード用）、
--     および UPDATE 可（QRチェックイン用）
--     ※ 方針の「本人のみ」を merchant 機能に合わせて拡張。不要なら owner 系を削除。
-- ───────────────────────────────────────────────
drop policy if exists visits_owner_select  on visits;
drop policy if exists visits_owner_insert  on visits;
drop policy if exists visits_owner_update  on visits;
drop policy if exists visits_store_select  on visits;
drop policy if exists visits_store_update  on visits;

create policy visits_owner_select on visits
  for select to authenticated
  using (user_id = auth.uid());

create policy visits_owner_insert on visits
  for insert to authenticated
  with check (user_id = auth.uid());

create policy visits_owner_update on visits
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy visits_store_select on visits
  for select to authenticated
  using (exists (
    select 1 from stores s
    where s.id = visits.store_id and s.owner_user_id = auth.uid()
  ));

create policy visits_store_update on visits
  for update to authenticated
  using (exists (
    select 1 from stores s
    where s.id = visits.store_id and s.owner_user_id = auth.uid()
  ))
  with check (exists (
    select 1 from stores s
    where s.id = visits.store_id and s.owner_user_id = auth.uid()
  ));

-- ───────────────────────────────────────────────
-- 7. users / user_profiles（本人のみ。RLSは上で有効化済み）
--   ※ 現状アプリはこれらを anon で触らないため最小限。
-- ───────────────────────────────────────────────
drop policy if exists users_self_read         on users;
drop policy if exists users_self_update       on users;
drop policy if exists user_profiles_self_all   on user_profiles;

create policy users_self_read on users
  for select to authenticated
  using (id = auth.uid());

create policy users_self_update on users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy user_profiles_self_all on user_profiles
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- store_images / store_tags / search_logs / qr_checkins は
-- 現状アプリ未使用のため、ポリシー無し（=全拒否）のまま service_role 運用とする。
-- 公開閲覧が必要になった時点で stores 同様の owner/public ポリシーを追加すること。
