-- はしGO RLS 管理者ポリシー（rls.sql の補完）
-- 管理者は JWT のメールアドレスで判定（デモ: admin@hashigo.jp）。
-- 本番では auth.users.raw_app_meta_data.role 等のカスタムクレームに置き換え推奨。

create or replace function public.is_admin()
  returns boolean language sql stable
  as $$ select coalesce((auth.jwt() ->> 'email'), '') = 'admin@hashigo.jp' $$;

-- stores: 管理者は全店舗を SELECT / UPDATE 可（審査・掲載ON/OFF・非公開店の閲覧）
drop policy if exists stores_admin_read on stores;
create policy stores_admin_read on stores
  for select to authenticated
  using (public.is_admin());

drop policy if exists stores_admin_write on stores;
create policy stores_admin_write on stores
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- visits: 管理者は全来店を SELECT 可（送客分析）
drop policy if exists visits_admin_select on visits;
create policy visits_admin_select on visits
  for select to authenticated
  using (public.is_admin());
