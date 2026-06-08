"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dataApi } from "@/lib/data";
import { isAdmin } from "@/lib/session";
import type { AdminAnalytics, Store } from "@/lib/types";
import { AdminNav } from "@/components/nav/AdminNav";
import { Screen, Card, Spinner } from "@/components/ui";

export default function AdminStoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[] | null>(null);
  const [stats, setStats] = useState<AdminAnalytics | null>(null);

  useEffect(() => {
    if (!isAdmin()) {
      router.replace("/admin/login");
      return;
    }
    dataApi.adminListStores().then(setStores);
    dataApi.adminAnalytics().then(setStats);
  }, [router]);

  async function toggleActive(s: Store) {
    await dataApi.setStoreActive(s.id, !s.isActive);
    setStores((prev) => prev?.map((x) => (x.id === s.id ? { ...x, isActive: !s.isActive } : x)) ?? null);
  }

  if (!stores)
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner className="border-primary/30 border-t-primary" />
      </div>
    );

  return (
    <Screen>
      <div className="bg-navy px-4 py-5 text-white">
        <p className="text-xs text-white/70">運営管理</p>
        <h1 className="mt-0.5 text-xl font-bold">店舗管理・審査</h1>
      </div>

      {/* 全体サマリー */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 px-4 py-4">
          <Mini label="掲載店舗" value={`${stats.activeStores}/${stats.totalStores}`} />
          <Mini label="送客数" value={`${stats.totalVisits}`} />
          <Mini label="成約率" value={`${stats.conversionRate}%`} />
        </div>
      )}

      {/* 店舗一覧 */}
      <div className="space-y-2 px-4 pb-4">
        {stores.map((s) => (
          <Card key={s.id} className="flex items-center justify-between p-4">
            <div className="min-w-0">
              <p className="truncate font-bold text-ink">{s.name}</p>
              <p className="truncate text-xs text-sub">{s.address}</p>
              <p className="mt-0.5 text-xs text-muted">〜{s.averageBudget.toLocaleString()}円 · {s.moods.join("・")}</p>
            </div>
            <button
              onClick={() => toggleActive(s)}
              className={`ml-3 shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${s.isActive ? "bg-seat-openbg text-seat-open" : "bg-seat-closedbg text-seat-closed"}`}
            >
              {s.isActive ? "掲載中" : "停止中"}
            </button>
          </Card>
        ))}
      </div>

      <AdminNav />
    </Screen>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3 text-center">
      <p className="text-xs text-sub">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-navy">{value}</p>
    </Card>
  );
}
