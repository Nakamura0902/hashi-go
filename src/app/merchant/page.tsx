"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dataApi } from "@/lib/data";
import { subscribeStoreVisits } from "@/lib/realtime";
import {
  notify,
  notificationPermission,
  requestNotificationPermission,
} from "@/lib/notify";
import { getMerchantStoreId } from "@/lib/session";
import type { MerchantDashboard } from "@/lib/types";
import { MerchantNav } from "@/components/nav/MerchantNav";
import { MerchantMessageCard } from "@/components/merchant/MerchantMessageCard";
import { SeatBadge } from "@/components/store/SeatBadge";
import { Screen, Card, Spinner, BigButton } from "@/components/ui";
import { IconArrowRight } from "@/components/ui/icons";

export default function MerchantDashboardPage() {
  const [data, setData] = useState<MerchantDashboard | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [perm, setPerm] = useState<string>("default");

  useEffect(() => {
    setPerm(notificationPermission());
    const storeId = getMerchantStoreId();
    dataApi.getMerchantDashboard(storeId).then(setData);
    // Realtime: 新しい送客（来店予定）が入ったら画面内通知＋ブラウザ通知＋ダッシュ更新
    return subscribeStoreVisits(storeId, (v) => {
      const msg = "🎉 新しいお客様が来店予定です！";
      setNotice(msg);
      notify("はしGO｜新しい送客", `${v.storeName ?? "お店"}にお客様が向かっています`);
      dataApi.getMerchantDashboard(storeId).then(setData);
      setTimeout(() => setNotice(null), 4000);
    });
  }, []);

  async function enableNotify() {
    const ok = await requestNotificationPermission();
    setPerm(ok ? "granted" : notificationPermission());
  }

  if (!data)
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner className="border-primary/30 border-t-primary" />
      </div>
    );

  return (
    <Screen>
      <div className="bg-navy px-4 py-5 text-white">
        <p className="text-xs text-white/70">店舗ダッシュボード</p>
        <h1 className="mt-0.5 text-xl font-bold">{data.store.name}</h1>
      </div>

      <div className="space-y-4 px-4 py-4">
        {/* KPI */}
        <div className="grid grid-cols-2 gap-3">
          <Stat label="本日の送客数" value={`${data.todayVisits}`} unit="組" />
          <Stat label="来店予定" value={`${data.plannedVisits}`} unit="組" />
        </div>

        {/* 現在の空席状況 */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-sub">現在の空席状況</p>
            <SeatBadge status={data.seat.availability} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <SeatMini label="2名席" v={data.seat.table2} />
            <SeatMini label="4名席" v={data.seat.table4} />
            <SeatMini label="カウンター" v={data.seat.counter} />
          </div>
          <Link href="/merchant/seats" className="mt-3 block">
            <BigButton variant="primary">空席状況を更新する</BigButton>
          </Link>
        </Card>

        {/* #B 店主のライブひとこと */}
        <MerchantMessageCard storeId={data.store.id} />

        {/* 通知設定 */}
        {perm !== "granted" && perm !== "unsupported" && (
          <Card className="flex items-center justify-between p-4">
            <span className="text-sm text-sub">来店通知</span>
            <button
              onClick={enableNotify}
              className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white active:scale-95"
            >
              🔔 通知をオンにする
            </button>
          </Card>
        )}

        {/* 掲載状態 */}
        <Card className="flex items-center justify-between p-4">
          <span className="text-sm text-sub">掲載状態</span>
          <span
            className={`rounded-sm px-2 py-1 text-xs font-semibold ${data.store.isActive ? "bg-seat-openbg text-seat-open" : "bg-seat-closedbg text-seat-closed"}`}
          >
            {data.store.isActive ? "掲載中" : "停止中（審査待ち）"}
          </span>
        </Card>

        {/* 直近来店 */}
        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-[13px] font-semibold text-sub">直近の来店</p>
            <Link href="/merchant/visits" className="flex items-center text-xs text-primary">
              すべて見る <IconArrowRight size={14} />
            </Link>
          </div>
          {data.recentVisits.length === 0 ? (
            <Card className="p-4 text-center text-sm text-muted">まだ来店がありません</Card>
          ) : (
            <Card className="divide-y divide-line">
              {data.recentVisits.slice(0, 5).map((v) => (
                <div key={v.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-ink">
                    {new Date(v.plannedAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span
                    className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${v.status === "checked_in" ? "bg-seat-openbg text-seat-open" : "bg-seat-fewbg text-seat-few"}`}
                  >
                    {v.status === "checked_in" ? "来店済み" : "予定"}
                  </span>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* Realtime: 新規送客の通知バナー */}
      {notice && (
        <div className="animate-card-in fixed inset-x-0 bottom-20 z-40 mx-auto max-w-app px-4">
          <div className="rounded-full bg-primary px-5 py-3 text-center text-sm font-bold text-white shadow-fab">
            {notice}
          </div>
        </div>
      )}

      <MerchantNav />
    </Screen>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-sub">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-navy">
        {value}
        <span className="ml-1 text-sm font-normal text-sub">{unit}</span>
      </p>
    </Card>
  );
}

function SeatMini({ label, v }: { label: string; v: { free: number; total: number } }) {
  return (
    <div className={`rounded-sm py-2 ${v.free > 0 ? "bg-seat-openbg text-seat-open" : "bg-seat-closedbg text-seat-closed"}`}>
      <p className="font-semibold">{label}</p>
      <p>{v.free > 0 ? `空${v.free}` : "満席"}</p>
    </div>
  );
}
