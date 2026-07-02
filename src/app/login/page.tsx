"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithApple,
  sendPasswordReset,
  getCurrentUserId,
} from "@/lib/auth";
import { Screen, Card, BigButton, SectionLabel } from "@/components/ui";
import { IconLantern } from "@/components/ui/icons";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 遷移先（?next=...）。useSearchParamsを避けてwindowから読む。
  function nextPath(): string {
    if (typeof window === "undefined") return "/";
    const p = new URLSearchParams(window.location.search).get("next");
    return p && p.startsWith("/") ? p : "/";
  }

  // ログイン済みなら戻す
  useEffect(() => {
    getCurrentUserId().then((id) => {
      if (id) router.replace(nextPath());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    setError(null);
    setInfo(null);
    if (email.trim() === "" || password === "") {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError("パスワードは8文字以上にしてください");
      return;
    }
    setLoading(true);
    if (mode === "login") {
      const res = await signInWithEmail(email.trim(), password);
      if (!res.ok) {
        setError(res.error ?? "ログインに失敗しました");
        setLoading(false);
        return;
      }
      router.replace(nextPath());
    } else {
      const res = await signUpWithEmail(email.trim(), password, nickname.trim() || undefined);
      if (!res.ok) {
        setError(res.error ?? "登録に失敗しました");
        setLoading(false);
        return;
      }
      if (res.needConfirm) {
        setInfo("確認メールを送りました。メール内のリンクを開いてから、ログインしてください。");
        setMode("login");
        setLoading(false);
        return;
      }
      router.replace(nextPath());
    }
  }

  async function apple() {
    setError(null);
    const res = await signInWithApple();
    if (!res.ok) {
      setError(
        "Appleログインは準備中です（Supabaseで Apple プロバイダの設定が必要）。メールでご登録ください。"
      );
    }
  }

  async function reset() {
    setError(null);
    setInfo(null);
    if (email.trim() === "") {
      setError("リセット用にメールアドレスを入力してください");
      return;
    }
    const res = await sendPasswordReset(email.trim());
    if (res.ok) setInfo("パスワード再設定メールを送りました。");
    else setError(res.error ?? "送信に失敗しました");
  }

  return (
    <Screen withNav={false}>
      {/* ロゴ */}
      <div className="flex items-center gap-2 bg-navy px-4 py-6 text-white">
        <IconLantern size={28} className="text-primary" />
        <div>
          <h1 className="text-2xl font-extrabold">
            はし<span className="text-primary">GO</span>
          </h1>
          <p className="text-xs text-white/70">次、どこ行く？を10秒で。</p>
        </div>
      </div>

      <div className="space-y-4 px-4 py-6">
        {/* タブ */}
        <div className="flex rounded-full bg-surface p-1">
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
                setInfo(null);
              }}
              className={`h-10 flex-1 rounded-full text-sm font-bold transition ${
                mode === m ? "bg-white text-ink shadow-card" : "text-sub"
              }`}
            >
              {m === "login" ? "ログイン" : "新規登録"}
            </button>
          ))}
        </div>

        <Card className="space-y-4 p-5">
          {mode === "signup" && (
            <div>
              <SectionLabel>ニックネーム（任意）</SectionLabel>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                className="h-12 w-full rounded-md border border-line px-3 text-sm"
                placeholder="はしご太郎"
              />
            </div>
          )}
          <div>
            <SectionLabel>メールアドレス</SectionLabel>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-md border border-line px-3 text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <SectionLabel>パスワード{mode === "signup" && "（8文字以上）"}</SectionLabel>
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-md border border-line px-3 text-sm"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm font-semibold text-seat-full">{error}</p>}
          {info && <p className="text-sm font-semibold text-seat-open">{info}</p>}
        </Card>

        <BigButton onClick={submit} loading={loading}>
          {mode === "login" ? "ログイン" : "アカウント作成"}
        </BigButton>

        {/* Apple */}
        <button
          onClick={apple}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-bold text-white active:scale-[0.99]"
        >
           Appleでサインイン
        </button>

        {mode === "login" && (
          <button onClick={reset} className="w-full text-center text-xs text-muted">
            パスワードを忘れた場合
          </button>
        )}

        <p className="pt-2 text-center text-[11px] leading-relaxed text-muted">
          続行することで
          <Link href="/terms" className="underline">利用規約</Link>
          ・
          <Link href="/privacy" className="underline">プライバシーポリシー</Link>
          に同意したものとみなします。
        </p>
      </div>
    </Screen>
  );
}
