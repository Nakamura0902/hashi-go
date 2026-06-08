// 管理者向け集計（mock / supabase 両方から使う純関数）

import type { AdminAnalytics, Store, Visit } from "./types";

export function computeAnalytics(stores: Store[], visits: Visit[]): AdminAnalytics {
  const checkedIn = visits.filter((v) => v.status === "checked_in").length;
  const planned = visits.length;

  // エリア別（住所の「区」で集計）
  const areaMap = new Map<string, number>();
  visits.forEach((v) => {
    const store = stores.find((s) => s.id === v.storeId);
    const area = store?.address.match(/(新宿区|渋谷区|港区|中央区)/)?.[1] ?? "その他";
    areaMap.set(area, (areaMap.get(area) ?? 0) + 1);
  });

  // 時間帯別
  const hourMap = new Map<number, number>();
  visits.forEach((v) => {
    const h = new Date(v.plannedAt).getHours();
    hourMap.set(h, (hourMap.get(h) ?? 0) + 1);
  });

  // エリア×時間帯ヒートマップ
  const areaOf = (storeId: string) =>
    stores.find((s) => s.id === storeId)?.address.match(/(新宿区|渋谷区|港区|中央区)/)?.[1] ?? "その他";
  const heatMap = new Map<string, number[]>();
  visits.forEach((v) => {
    const area = areaOf(v.storeId);
    const h = new Date(v.plannedAt).getHours();
    if (!heatMap.has(area)) heatMap.set(area, new Array(24).fill(0));
    heatMap.get(area)![h] += 1;
  });

  // 店舗別送客ランキング
  const storeMap = new Map<string, { visits: number; checkedIn: number }>();
  visits.forEach((v) => {
    const cur = storeMap.get(v.storeId) ?? { visits: 0, checkedIn: 0 };
    cur.visits += 1;
    if (v.status === "checked_in") cur.checkedIn += 1;
    storeMap.set(v.storeId, cur);
  });
  const byStore = [...storeMap.entries()]
    .map(([storeId, c]) => ({
      storeId,
      name: stores.find((s) => s.id === storeId)?.name ?? storeId,
      visits: c.visits,
      checkedIn: c.checkedIn,
    }))
    .sort((a, b) => b.visits - a.visits);

  return {
    totalStores: stores.length,
    activeStores: stores.filter((s) => s.isActive).length,
    totalVisits: planned,
    checkedInVisits: checkedIn,
    conversionRate: planned === 0 ? 0 : Math.round((checkedIn / planned) * 100),
    byArea: [...areaMap.entries()].map(([area, v]) => ({ area, visits: v })),
    byHour: [...hourMap.entries()]
      .map(([hour, v]) => ({ hour, visits: v }))
      .sort((a, b) => a.hour - b.hour),
    popularBudgets: [
      { label: "〜1,500円", count: stores.filter((s) => s.averageBudget <= 1500).length },
      { label: "〜2,500円", count: stores.filter((s) => s.averageBudget > 1500 && s.averageBudget <= 2500).length },
      { label: "2,500円〜", count: stores.filter((s) => s.averageBudget > 2500).length },
    ],
    popularMoods: ["にぎやか", "落ち着いた", "おしゃれ", "大衆酒場", "和モダン"].map((mood) => ({
      mood,
      count: stores.filter((s) => s.moods.includes(mood as never)).length,
    })),
    heatmap: [...heatMap.entries()].map(([area, hours]) => ({ area, hours })),
    byStore,
  };
}
