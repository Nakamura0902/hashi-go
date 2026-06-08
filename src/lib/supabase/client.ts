"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY, hasSupabase } from "../config";

// 設定があるときだけブラウザ用Supabaseクライアントを作る
export function getSupabaseBrowserClient() {
  if (!hasSupabase) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
