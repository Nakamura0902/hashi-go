"use client";

// #9 LINEログイン／通知の統合。
// LINEは Supabase の標準プロバイダに含まれないため、カスタムOIDCプロバイダとして
// Supabaseダッシュボードに設定し、チャネルID等を環境変数で差し込む前提。
// 未設定時はボタンが「準備手順」を案内する（Mapboxトークンと同じ差し込み口パターン）。

import { getSupabaseBrowserClient } from "./supabase/client";

export const LINE_CHANNEL_ID = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID ?? "";
export const hasLine = LINE_CHANNEL_ID.length > 0;

export async function signInWithLine(): Promise<{ ok: boolean; reason?: string }> {
  const sb = getSupabaseBrowserClient();
  if (!sb) return { ok: false, reason: "supabase-unconfigured" };
  if (!hasLine) return { ok: false, reason: "line-unconfigured" };
  // Supabaseに登録したカスタムOIDC(=LINE)へリダイレクト
  const { error } = await sb.auth.signInWithOAuth({
    // 標準型に 'line' は無いためカスタムプロバイダ名としてキャスト
    provider: "line" as never,
    options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
  });
  return { ok: !error, reason: error?.message };
}

// LINE連携の設定手順（未設定時に表示する案内）
export const LINE_SETUP_STEPS = [
  "LINE Developersでログインチャネル（LINE Login）を作成",
  "コールバックURLにSupabaseのcallback URLを登録",
  "SupabaseのAuth → Providersでカスタム(OIDC)としてLINEを設定",
  ".env.local に NEXT_PUBLIC_LINE_CHANNEL_ID を設定",
];
