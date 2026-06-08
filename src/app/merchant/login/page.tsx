"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mockStores } from "@/lib/mockData";
import { setMerchantStoreId } from "@/lib/session";
import { signInWithEmail } from "@/lib/auth";
import { hasSupabase, isProd } from "@/lib/config";
import { Screen, Card, BigButton, SectionLabel } from "@/components/ui";
import { IconLantern } from "@/components/ui/icons";

// デモ用の店舗オーナーアカウント（全店舗を所有：どの店舗を選んでも管理できる）
const DEMO_OWNER = { email: "s-hashigoya@hashigo.jp", password: "hashigo-store-2026" };

export default function MerchantLoginPage() {
  const router = useRouter();
  const [storeId, setStoreId] = useState(mockStores[0].id);
  // 本番では資格情報を自動入力しない（漏えい防止）
  const [email, setEmail] = useState(isProd ? "" : hasSupabase ? DEMO_OWNER.email : "owner@example.com");
  const [password, setPassword] = useState(isProd ? "" : hasSupabase ? DEMO_OWNER.password : "demo");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login() {
    setError(null);
    if (!hasSupabase) {
      // モック: localStorageで店舗選択のみ
      setMerchantStoreId(storeId);
      router.push("/merchant");
      return;
    }
    setLoading(true);
    const res = await signInWithEmail(email, password);
    if (!res.ok) {
      setError(res.error ?? "ログインに失敗しました");
      setLoading(false);
      return;
    }
    // 選択した店舗を管理対象にする（デモオーナーは全店舗を所有）
    setMerchantStoreId(storeId);
    router.push("/merchant");
  }

  return (
    <Screen withNav={false}>
      <div className="flex items-center gap-2 bg-navy px-4 py-5 text-white">
        <IconLantern size={26} className="text-primary" />
        <div>
          <h1 className="text-xl font-extrabold">
            はし<span className="text-primary">GO</span> 店舗管理
          </h1>
          <p className="text-xs text-white/70">空席を集客に変える</p>
        </div>
      </div>

      <div className="space-y-4 px-4 py-6">
        <Card className="space-y-4 p-5">
          <div>
            <SectionLabel>管理する店舗を選択（デモ用）</SectionLabel>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="h-12 w-full rounded-md border border-line bg-white px-3 text-sm"
            >
              {mockStores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
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

        <BigButton onClick={login} loading={loading}>
          ログイン
        </BigButton>
        <p className="text-center text-xs text-muted">
          {hasSupabase
            ? "デモ: 店舗を選んでそのままログイン"
            : "デモ環境のため、任意の入力でログインできます"}
        </p>
      </div>
    </Screen>
  );
}
