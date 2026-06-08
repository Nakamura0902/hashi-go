"use client";

// 認証コア。アカウント必須モデル。
// - Supabase接続時: 本物の個人アカウント（メール/Apple）。共有ゲストは廃止し、
//   各ユーザーが固有の auth.uid() を持つ＝お気に入り/履歴/レビューが個人ごとに分離される。
// - Supabase未接続(モック)時: ローカル開発用に MOCK_USER_ID を返す（ログイン不要）。

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "./supabase/client";
import { hasSupabase, MOCK_USER_ID } from "./config";

// 現在のユーザーID。未ログイン時は null（Supabaseモード）。モック時は固定ID。
export async function getCurrentUserId(): Promise<string | null> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return MOCK_USER_ID;
  const {
    data: { session },
  } = await sb.auth.getSession();
  return session?.user?.id ?? null;
}

// クライアント用フック。解決前は undefined、未ログインは null、ログイン済みはuid。
export function useCurrentUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const sb = getSupabaseBrowserClient();
    if (!sb) {
      setUserId(MOCK_USER_ID);
      return;
    }
    getCurrentUserId().then((id) => active && setUserId(id));
    // セッション変化に追従
    const { data } = sb.auth.onAuthStateChange((_e, session) => {
      if (active) setUserId(session?.user?.id ?? null);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return userId;
}

// ── ユーザー向け 認証フロー ──

export async function signUpWithEmail(
  email: string,
  password: string,
  nickname?: string
): Promise<{ ok: boolean; needConfirm?: boolean; error?: string }> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return { ok: true };
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: nickname ? { nickname } : undefined },
  });
  if (error) return { ok: false, error: error.message };
  // メール確認が必要な設定だと session は null（確認待ち）
  return { ok: true, needConfirm: !data.session };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ ok: boolean; uid?: string; error?: string }> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return { ok: true, uid: undefined };
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user)
    return { ok: false, error: error?.message ?? "ログインに失敗しました" };
  return { ok: true, uid: data.user.id };
}

// Apple サインイン（iOS申請で実質必須）。Supabaseで Apple プロバイダ設定が必要。
// 未設定ならエラーを返す（呼び出し側でガイド表示）。
export async function signInWithApple(): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return { ok: false, error: "supabase-unconfigured" };
  const { error } = await sb.auth.signInWithOAuth({
    provider: "apple",
    options: {
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
  return { ok: !error, error: error?.message };
}

export async function sendPasswordReset(
  email: string
): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return { ok: false, error: "supabase-unconfigured" };
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
  });
  return { ok: !error, error: error?.message };
}

// ── 店舗オーナー／管理者 ──

// サインイン中アカウントが所有する店舗IDを返す（無ければnull）
export async function getOwnedStoreId(): Promise<string | null> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return null;
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session?.user) return null;
  const { data } = await sb
    .from("stores")
    .select("id")
    .eq("owner_user_id", session.user.id)
    .limit(1);
  return data?.[0]?.id ?? null;
}

export async function signOut(): Promise<void> {
  const sb = getSupabaseBrowserClient();
  await sb?.auth.signOut();
}

// 認証が必須かどうか（Supabase接続時のみ必須）
export const authRequired = hasSupabase;
