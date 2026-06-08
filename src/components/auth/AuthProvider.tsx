"use client";

// アカウント必須ガード。Supabase接続時、未ログインでユーザー画面に来たら /login へ。
// 店舗(/merchant)・管理(/admin)・ログイン(/login)は各自のログインを持つので対象外。
// モックモード(Supabase未接続)では認証不要（ローカル開発用）。

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { authRequired } from "@/lib/auth";
import { Spinner } from "@/components/ui";

function isPublicPath(path: string): boolean {
  return (
    path === "/login" ||
    path.startsWith("/merchant") ||
    path.startsWith("/admin")
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!authRequired) {
      setReady(true);
      setAuthed(true);
      return;
    }
    const sb = getSupabaseBrowserClient();
    if (!sb) {
      setReady(true);
      return;
    }
    let active = true;
    // セッション取得が失敗/遅延しても画面が固まらないよう必ず ready にする
    const fallback = setTimeout(() => active && setReady(true), 4000);
    sb.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setAuthed(!!data.session);
        setReady(true);
      })
      .catch(() => active && setReady(true));
    const { data } = sb.auth.onAuthStateChange((_e, session) => {
      if (active) {
        setAuthed(!!session);
        setReady(true);
      }
    });
    return () => {
      active = false;
      clearTimeout(fallback);
      data.subscription.unsubscribe();
    };
  }, []);

  // 未ログインで保護ページ → /login へ
  useEffect(() => {
    if (!authRequired || !ready) return;
    if (!authed && !isPublicPath(pathname)) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
    }
  }, [ready, authed, pathname, router]);

  // 保護ページで認証確認中／リダイレクト中はスプラッシュ
  if (authRequired && !isPublicPath(pathname) && (!ready || !authed)) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg">
        <Spinner className="border-primary/30 border-t-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
