// はしごバッジ／実績の算出（mock / supabase 共用の純関数）

import type { Badge, Store, UserStats, Visit } from "./types";

const areaOf = (store?: Store) =>
  store?.address.match(/(新宿区|渋谷区|港区|中央区)/)?.[1] ?? "その他";

export function computeStats(visits: Visit[], stores: Store[]): UserStats {
  const done = visits.filter((v) => v.status === "checked_in");
  const uniqueStores = new Set(done.map((v) => v.storeId)).size;
  const areas = new Set(
    done.map((v) => areaOf(stores.find((s) => s.id === v.storeId)))
  ).size;
  const lateNightVisits = done.filter((v) =>
    stores.find((s) => s.id === v.storeId)?.isLateNight
  ).length;

  const badges: Badge[] = [
    {
      key: "first",
      emoji: "🍶",
      title: "はしご初め",
      description: "はじめての来店",
      achieved: done.length >= 1,
    },
    {
      key: "regular",
      emoji: "🏮",
      title: "はしご常連",
      description: "3軒はしご",
      achieved: done.length >= 3,
      progress: `${Math.min(done.length, 3)} / 3軒`,
    },
    {
      key: "master",
      emoji: "👑",
      title: "はしごマスター",
      description: "5軒はしご",
      achieved: done.length >= 5,
      progress: `${Math.min(done.length, 5)} / 5軒`,
    },
    {
      key: "explorer",
      emoji: "🗺️",
      title: "街歩き達人",
      description: "2エリアを制覇",
      achieved: areas >= 2,
      progress: `${Math.min(areas, 2)} / 2エリア`,
    },
    {
      key: "nightowl",
      emoji: "🌙",
      title: "夜更かし",
      description: "深夜営業店に来店",
      achieved: lateNightVisits >= 1,
    },
  ];

  return {
    totalVisits: done.length,
    uniqueStores,
    areasVisited: areas,
    badges,
  };
}
