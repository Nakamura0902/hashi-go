"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dataApi } from "@/lib/data";
import { useRouter } from "next/navigation";
import { useCurrentUserId, signOut } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabase } from "@/lib/config";
import { hasLine, signInWithLine, LINE_SETUP_STEPS } from "@/lib/line";
import type { UserStats } from "@/lib/types";
import { BottomNav } from "@/components/nav/BottomNav";
import { Header, Screen, Card } from "@/components/ui";
import { IconUser, IconStore, IconChart, IconArrowRight, IconMap, IconHeart } from "@/components/ui/icons";

export default function MyPage() {
  const router = useRouter();
  const userId = useCurrentUserId();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [lineMsg, setLineMsg] = useState<string | null>(null);
  const [account, setAccount] = useState<string>("");

  useEffect(() => {
    if (!userId) return;
    dataApi.getUserStats(userId).then(setStats);
  }, [userId]);

  // ログイン中アカウント（ニックネーム or メール）を表示
  useEffect(() => {
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => {
      const u = data.user;
      setAccount(u?.user_metadata?.nickname || u?.email || "");
    });
  }, [userId]);

  async function logout() {
    await signOut();
    router.replace("/login");
  }

  async function connectLine() {
    const res = await signInWithLine();
    if (!res.ok) {
      setLineMsg(
        res.reason === "line-unconfigured"
          ? "LINE連携は未設定です。設定手順：\n・" + LINE_SETUP_STEPS.join("\n・")
          : "LINE連携に失敗しました: " + (res.reason ?? "")
      );
    }
  }

  return (
    <Screen>
      <Header title="マイページ" />
      <div className="space-y-4 px-4 py-4">
        {/* プロフィール */}
        <Card className="flex items-center gap-3 p-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-navy text-white">
            <IconUser size={28} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-ink">{account || "ゲストさん"}</p>
            <p className="text-xs text-sub">はしGOで2軒目を楽しもう🍻</p>
          </div>
        </Card>

        {/* #7 実績・バッジ */}
        <div>
          <p className="mb-2 px-1 text-[13px] font-semibold text-sub">はしご実績</p>
          <Card className="p-4">
            <div className="flex justify-around text-center">
              <Stat value={stats?.totalVisits ?? 0} label="来店" />
              <Stat value={stats?.uniqueStores ?? 0} label="お店" />
              <Stat value={stats?.areasVisited ?? 0} label="エリア" />
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {(stats?.badges ?? []).map((b) => (
                <div
                  key={b.key}
                  title={`${b.title}：${b.description}${b.progress ? `（${b.progress}）` : ""}`}
                  className={`flex flex-col items-center gap-1 rounded-md py-2 ${b.achieved ? "bg-primary-light" : "bg-bg opacity-40"}`}
                >
                  <span className="text-xl">{b.emoji}</span>
                  <span className="text-[9px] font-semibold leading-tight text-ink">{b.title}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 便利機能 */}
        <div>
          <p className="mb-2 px-1 text-[13px] font-semibold text-sub">便利機能</p>
          <Card className="divide-y divide-line">
            <Row label="はしごルートを作る" href="/route" icon={<IconMap size={18} />} />
            <Row label="みんなで決める（グループ）" href="/group" icon={<IconHeart size={18} />} />
          </Card>
        </div>

        {/* 利用設定 */}
        <div>
          <p className="mb-2 px-1 text-[13px] font-semibold text-sub">利用設定</p>
          <Card className="divide-y divide-line">
            <Row label="お気に入りのお店" href="/favorites" />
            <Row label="来店履歴" href="/history" />
            <Row label="利用規約" href="/terms" />
            <Row label="プライバシーポリシー" href="/privacy" />
            <button onClick={connectLine} className="w-full">
              <div className="flex h-12 items-center gap-3 px-4">
                <span className="text-[#06C755]">🟢</span>
                <span className="flex-1 text-left text-sm text-ink">
                  LINEで通知・ログイン{hasLine ? "" : "（準備中）"}
                </span>
                <IconArrowRight size={16} className="text-muted" />
              </div>
            </button>
          </Card>
          {lineMsg && (
            <p className="mt-2 whitespace-pre-line px-1 text-xs text-sub">{lineMsg}</p>
          )}
        </div>

        {/* 関係者向け */}
        <div>
          <p className="mb-2 px-1 text-[13px] font-semibold text-sub">関係者向け</p>
          <Card className="divide-y divide-line">
            <Row label="店舗の方はこちら" href="/merchant/login" icon={<IconStore size={18} />} />
            <Row label="運営管理画面" href="/admin/login" icon={<IconChart size={18} />} />
          </Card>
        </div>

        {hasSupabase && (
          <button
            onClick={logout}
            className="w-full rounded-md border border-line bg-white py-3 text-center text-sm font-semibold text-seat-full active:scale-[0.99]"
          >
            ログアウト
          </button>
        )}

        <p className="pt-2 text-center text-xs text-muted">はしGO MVP v0.2</p>
      </div>
      <BottomNav />
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-2xl font-extrabold text-navy">{value}</p>
      <p className="text-xs text-sub">{label}</p>
    </div>
  );
}

function Row({ label, href, icon }: { label: string; href?: string; icon?: React.ReactNode }) {
  const inner = (
    <div className="flex h-12 items-center gap-3 px-4">
      {icon && <span className="text-sub">{icon}</span>}
      <span className="flex-1 text-sm text-ink">{label}</span>
      <IconArrowRight size={16} className="text-muted" />
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : <button className="w-full">{inner}</button>;
}
