"use client";

import { useEffect, useState } from "react";
import { dataApi } from "@/lib/data";
import { getMerchantStoreId } from "@/lib/session";
import type { Offer } from "@/lib/types";
import { MerchantNav } from "@/components/nav/MerchantNav";
import { Header, Screen, Card, Spinner, Chip } from "@/components/ui";

const PRESETS = [
  { title: "1杯目無料", description: "はしGO来店でドリンク1杯目が無料！" },
  { title: "会計から500円OFF", description: "QRチェックインで会計から500円割引。" },
  { title: "飲み放題30分延長", description: "飲み放題コースが30分無料延長。" },
  { title: "小鉢サービス", description: "ご来店で本日の小鉢を1品サービス。" },
];

export default function MerchantOffersPage() {
  const [storeId, setStoreId] = useState("");
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [vacancy, setVacancy] = useState(0); // 空席率（特典提案の判定）

  useEffect(() => {
    const id = getMerchantStoreId();
    setStoreId(id);
    dataApi.listOffers(id).then(setOffers);
    dataApi.getMerchantDashboard(id).then((d) => {
      if (!d) return;
      const free = d.seat.table2.free + d.seat.table4.free + d.seat.counter.free;
      const total = d.seat.table2.total + d.seat.table4.total + d.seat.counter.total;
      setVacancy(total === 0 ? 0 : free / total);
    });
  }, []);

  // #3 動的最適化: 空席が多いのに有効な特典が無いとき提案
  const activeOffers = offers?.filter((o) => o.isActive).length ?? 0;
  const suggestBoost = vacancy >= 0.5 && activeOffers === 0;

  async function toggle(o: Offer) {
    const next = { ...o, isActive: !o.isActive };
    await dataApi.upsertOffer(next);
    setOffers((prev) => prev?.map((x) => (x.id === o.id ? next : x)) ?? null);
  }

  async function addPreset(p: { title: string; description: string }) {
    if (!offers) return;
    if (offers.some((o) => o.title === p.title)) return;
    const offer: Offer = {
      id: "o" + Date.now(),
      storeId,
      title: p.title,
      description: p.description,
      isActive: true,
    };
    await dataApi.upsertOffer(offer);
    setOffers([...offers, offer]);
  }

  if (!offers)
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner className="border-primary/30 border-t-primary" />
      </div>
    );

  return (
    <Screen>
      <Header title="特典の設定" />
      <div className="space-y-5 px-4 py-4">
        {/* #3 動的最適化の提案 */}
        {suggestBoost && (
          <div className="rounded-md border-[1.5px] border-primary bg-[#FFF7ED] p-4">
            <p className="text-sm font-bold text-primary-dark">
              💡 今、特典を出すと効果的です
            </p>
            <p className="mt-1 text-xs text-sub">
              空席が多い時間帯です。特典を有効にすると、はしGO上での表示順が上がり送客が増えやすくなります。
            </p>
          </div>
        )}
        {/* 現在の特典 */}
        <div>
          <p className="mb-2 text-[13px] font-semibold text-sub">設定中の特典</p>
          {offers.length === 0 ? (
            <Card className="p-4 text-center text-sm text-muted">特典は未設定です</Card>
          ) : (
            <div className="space-y-2">
              {offers.map((o) => (
                <Card key={o.id} className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">🎁 {o.title}</p>
                    <p className="truncate text-xs text-sub">{o.description}</p>
                  </div>
                  <button
                    onClick={() => toggle(o)}
                    className={`ml-3 flex h-7 w-12 shrink-0 items-center rounded-full px-1 transition ${o.isActive ? "bg-seat-open" : "bg-line"}`}
                    aria-label="有効切替"
                  >
                    <span
                      className={`h-5 w-5 rounded-full bg-white shadow transition ${o.isActive ? "translate-x-5" : ""}`}
                    />
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 追加 */}
        <div>
          <p className="mb-2 text-[13px] font-semibold text-sub">特典を追加（タップで追加）</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Chip
                key={p.title}
                onClick={() => addPreset(p)}
                selected={offers.some((o) => o.title === p.title)}
              >
                + {p.title}
              </Chip>
            ))}
          </div>
        </div>
      </div>
      <MerchantNav />
    </Screen>
  );
}
