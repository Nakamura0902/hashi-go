"use client";

// 現在のユーザーIDを解決する。
// Supabase接続時はゲスト用アカウントへ自動サインインして本物のauth.uid()を返し、
// RLS(auth.uid()依存)が機能する状態にする。既存セッションがあれば再利用する。
// （匿名サインインはプロジェクト設定で無効のため、確認済みゲストアカウントを使用）
// Supabase未接続(モック)時は従来どおりMOCK_USER_IDを返す。

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "./supabase/client";
import { MOCK_USER_ID } from "./config";

// デモ用ゲスト（全ユーザー共有・ゲスト権限のみ）
const GUEST = { email: "guest@hashigo.jp", password: "hashigo-guest-2026" };

export async function getCurrentUserId(): Promise<string> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return MOCK_USER_ID;

  const {
    data: { session },
  } = await sb.auth.getSession();
  if (session?.user) return session.user.id;

  // セッションが無ければゲスト自動サインイン（何も入力させずにJWTを発行）
  const { data, error } = await sb.auth.signInWithPassword(GUEST);
  if (error || !data.user) {
    console.error("ゲストサインインに失敗しました:", error?.message);
    return MOCK_USER_ID;
  }
  return data.user.id;
}

// クライアントコンポーネント用フック。解決前は null を返す。
export function useCurrentUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    getCurrentUserId().then((id) => {
      if (active) setUserId(id);
    });
    return () => {
      active = false;
    };
  }, []);
  return userId;
}

// ── 店舗オーナー／管理者ログイン（Supabase Auth） ──
// 店舗/管理者アカウントが用意されている場合に使用。

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ ok: boolean; uid?: string; error?: string }> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return { ok: true, uid: undefined }; // モード: モック（呼び出し側でlocalStorage運用）
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, error: error?.message ?? "ログインに失敗しました" };
  return { ok: true, uid: data.user.id };
}

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
