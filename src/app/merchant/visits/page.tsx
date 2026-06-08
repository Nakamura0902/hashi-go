"use client";

import { useEffect, useState } from "react";
import { dataApi } from "@/lib/data";
import { getMerchantStoreId } from "@/lib/session";
import type { Visit } from "@/lib/types";
import { MerchantNav } from "@/components/nav/MerchantNav";
import { Header, Screen, Card, Spinner, EmptyState } from "@/components/ui";

export default function MerchantVisitsPage() {
  const [visits, setVisits] = useState<Visit[] | null>(null);

  useEffect(() => {
    dataApi.listMerchantVisits(getMerchantStoreId()).then(setVisits);
  }, []);

  async function checkin(v: Visit) {
    const updated = await dataApi.checkinByToken(v.qrToken);
    if (updated) setVisits((prev) => prev?.map((x) => (x.id === v.id ? updated : x)) ?? null);
  }

  if (!visits)
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner className="border-primary/30 border-t-primary" />
      </div>
    );

  return (
    <Screen>
      <Header title="来店・チェックイン" />
      {visits.length === 0 ? (
        <EmptyState title="来店記録はまだありません" description="お客様の来店予定がここに表示されます" />
      ) : (
        <div className="space-y-2 px-4 py-4">
          {visits.map((v) => (
            <Card key={v.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {new Date(v.plannedAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="text-xs text-sub">スコア {v.scoreAtSelection} で選ばれました</p>
                {v.status === "planned" && <EtaLabel plannedAt={v.plannedAt} etaMin={v.etaMin} />}
              </div>
              {v.status === "checked_in" ? (
                <span className="rounded-sm bg-seat-openbg px-3 py-1.5 text-xs font-bold text-seat-open">
                  ✓ 来店済み
                </span>
              ) : (
                <button
                  onClick={() => checkin(v)}
                  className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white active:scale-95"
                >
                  QR読み取り
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
      <MerchantNav />
    </Screen>
  );
}

// #4 到着予測＆遅延: 来店予定の到着見込み
function EtaLabel({ plannedAt, etaMin }: { plannedAt: string; etaMin: number }) {
  const elapsedMin = Math.floor((Date.now() - new Date(plannedAt).getTime()) / 60000);
  const remaining = etaMin - elapsedMin;
  if (etaMin <= 0) return null;
  if (remaining > 0)
    return <p className="mt-0.5 text-xs font-bold text-primary">🚶 あと約{remaining}分で到着予定</p>;
  if (remaining > -15)
    return <p className="mt-0.5 text-xs font-bold text-seat-open">まもなく到着</p>;
  return <p className="mt-0.5 text-xs font-bold text-seat-few">⏰ 到着予定を過ぎています</p>;
}
