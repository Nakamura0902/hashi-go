"use client";

import { useCallback, useEffect, useState } from "react";
import { dataApi } from "@/lib/data";
import { subscribeSeatStatus } from "@/lib/realtime";
import { getMerchantStoreId } from "@/lib/session";
import { hasSupabase } from "@/lib/config";
import { formatDistance } from "@/lib/geo";
import type { ScoredStore } from "@/lib/types";
import { MerchantNav } from "@/components/nav/MerchantNav";
import { SeatBadge } from "@/components/store/SeatBadge";
import { Header, Screen, Card, Spinner } from "@/components/ui";

// 店舗向け：近隣他店の空席をリアルタイム監視（自店の混雑判断・送客連携の参考に）
export default function MerchantNearbyPage() {
  const [myId, setMyId] = useState("");
  const [items, setItems] = useState<ScoredStore[] | null>(null);
  const [flash, setFlash] = useState(false);

  const load = useCallback(async (id: string, showFlash = false) => {
    const dash = await dataApi.getMerchantDashboard(id);
    if (!dash) return;
    const list = await dataApi.searchStores(
      { lat: dash.store.lat, lng: dash.store.lng, peopleCount: 2, budget: 0, moods: [], purpose: null },
      "distance"
    );
    setItems(list.filter((s) => s.store.id !== id));
    if (showFlash) {
      setFlash(true);
      setTimeout(() => setFlash(false), 1500);
    }
  }, []);

  useEffect(() => {
    const id = getMerchantStoreId();
    setMyId(id);
    load(id);
    return subscribeSeatStatus(() => load(id, true));
  }, [load]);

  return (
    <Screen>
      <Header
        title="近隣のライブ空席"
        subtitle={hasSupabase ? "● リアルタイム監視中" : undefined}
      />
      <p className="bg-bg px-4 py-2 text-xs text-muted">
        近くのお店の空席状況です。満席店から流れてくるお客様の受け皿に。
      </p>

      {items === null ? (
        <div className="flex justify-center py-20">
          <Spinner className="border-primary/30 border-t-primary" />
        </div>
      ) : (
        <div className="space-y-2 px-4 py-3">
          {items.map((it) => (
            <Card key={it.store.id} className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="truncate font-bold text-ink">{it.store.name}</p>
                <p className="mt-0.5 text-xs text-sub">
                  📍 徒歩{it.walkMin}分 · {formatDistance(it.distanceM)} ／ 空き{it.seat.totalGroupCapacity}名
                </p>
              </div>
              <SeatBadge status={it.seat.availability} />
            </Card>
          ))}
        </div>
      )}

      {flash && (
        <div className="animate-card-in fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-navy px-5 py-2 text-sm font-bold text-white shadow-card">
          近隣の空席を更新しました
        </div>
      )}

      <MerchantNav />
    </Screen>
  );
}
