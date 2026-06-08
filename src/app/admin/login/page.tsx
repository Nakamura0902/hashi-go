"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAdmin } from "@/lib/session";
import { signInWithEmail } from "@/lib/auth";
import { hasSupabase } from "@/lib/config";
import { Screen, Card, BigButton, SectionLabel } from "@/components/ui";
import { IconChart } from "@/components/ui/icons";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@hashigo.jp");
  const [password, setPassword] = useState(hasSupabase ? "hashigo-admin-2026" : "demo");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login() {
    setError(null);
    if (!hasSupabase) {
      setAdmin(true);
      router.push("/admin");
      return;
    }
    setLoading(true);
    const res = await signInWithEmail(email, password);
    if (!res.ok) {
      setError(res.error ?? "ログインに失敗しました");
      setLoading(false);
      return;
    }
    setAdmin(true);
    router.push("/admin");
  }

  return (
    <Screen withNav={false}>
      <div className="flex items-center gap-2 bg-navy px-4 py-5 text-white">
        <IconChart size={26} className="text-primary" />
        <div>
          <h1 className="text-xl font-extrabold">
            はし<span className="text-primary">GO</span> 運営管理
          </h1>
          <p className="text-xs text-white/70">送客の可視化と店舗審査</p>
        </div>
      </div>

      <div className="space-y-4 px-4 py-6">
        <Card className="space-y-4 p-5">
          <div>
            <SectionLabel>メールアドレス</SectionLabel>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-md border border-line px-3 text-sm"
            />
          </div>
          <div>
            <SectionLabel>パスワード</SectionLabel>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-md border border-line px-3 text-sm"
            />
          </div>
          {error && <p className="text-sm font-semibold text-seat-full">{error}</p>}
        </Card>
        <BigButton onClick={login} loading={loading}>ログイン</BigButton>
        <p className="text-center text-xs text-muted">
          {hasSupabase ? "デモ: admin@hashigo.jp / hashigo-admin-2026" : "デモ環境のため、任意の入力でログインできます"}
        </p>
      </div>
    </Screen>
  );
}
