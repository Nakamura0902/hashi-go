"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { dataApi } from "@/lib/data";
import type { ScoredStore, Visit } from "@/lib/types";
import { Header, Screen, Card, BigButton, QrCode, Spinner } from "@/components/ui";
import { BottomNav } from "@/components/nav/BottomNav";
import { IconCheck, IconMap } from "@/components/ui/icons";

export default function VisitPage() {
  const { id } = useParams<{ id: string }>();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [store, setStore] = useState<ScoredStore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataApi.getVisit(id).then(async (v) => {
      setVisit(v);
      if (v) setStore(await dataApi.getScoredStore(v.storeId));
      setLoading(false);
    });
  }, [id]);

  async function demoCheckin() {
    if (!visit) return;
    const updated = await dataApi.checkinByToken(visit.qrToken);
    if (updated) setVisit(updated);
  }

  if (loading)
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner className="border-primary/30 border-t-primary" />
      </div>
    );
  if (!visit || !store)
    return <div className="grid min-h-dvh place-items-center text-sub">来店情報が見つかりません</div>;

  const checkedIn = visit.status === "checked_in";
  // 現在地から店舗の正確な座標まで「道案内」。dir + 厳密な lat,lng で近隣POIへのスナップを防ぐ。
  const dest = `${store.store.lat},${store.store.lng}`;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=walking`;

  return (
    <Screen>
      <Header title="この店に行く" back="/list" />

      <div className="space-y-4 px-4 py-5">
        {/* 確定メッセージ */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`grid h-14 w-14 place-items-center rounded-full ${checkedIn ? "bg-seat-openbg text-seat-open" : "bg-primary text-white"}`}
          >
            <IconCheck size={30} />
          </div>
          <p className="mt-3 text-lg font-bold text-ink">
            {checkedIn ? "来店ありがとうございます！" : "来店予定を記録しました"}
          </p>
          <p className="mt-1 text-sm text-sub">
            {checkedIn ? "特典が適用されました" : "お店に向かいましょう。到着したらQRを見せてください。"}
          </p>
        </div>

        {/* 店舗ミニ情報 */}
        <Card className="flex items-center gap-3 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={store.store.images[0]}
            alt={store.store.name}
            className="h-16 w-16 rounded-sm object-cover"
          />
          <div className="min-w-0">
            <p className="truncate font-bold text-ink">{store.store.name}</p>
            <p className="text-xs text-sub">📍 徒歩{store.walkMin}分 · {store.store.nearestStation}</p>
            {store.offers[0] && (
              <p className="mt-0.5 text-xs font-semibold text-primary-dark">🎁 {store.offers[0].title}</p>
            )}
          </div>
        </Card>

        {/* QRコード */}
        <Card className="flex flex-col items-center p-5">
          <p className="text-sm font-semibold text-ink">チェックインQR</p>
          <p className="mb-3 mt-1 text-xs text-muted">スタッフにこの画面を見せてください</p>
          <div className={checkedIn ? "opacity-30" : ""}>
            <QrCode token={visit.qrToken} size={160} />
          </div>
          {checkedIn && <p className="mt-3 text-sm font-bold text-seat-open">✓ チェックイン済み</p>}
        </Card>

        {/* アクション */}
        <BigButton href={mapsUrl} icon={<IconMap size={20} />}>
          地図アプリで道案内
        </BigButton>
        {!checkedIn && (
          <BigButton variant="outline" onClick={demoCheckin}>
            （デモ）QRチェックインする
          </BigButton>
        )}
      </div>

      <BottomNav />
    </Screen>
  );
}
