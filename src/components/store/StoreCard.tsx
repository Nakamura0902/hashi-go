"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ScoredStore } from "@/lib/types";
import { formatDistance } from "@/lib/geo";
import { dataApi } from "@/lib/data";
import { getCurrentUserId } from "@/lib/auth";
import { SeatBadge } from "./SeatBadge";
import { ScoreBadge } from "./ScoreBadge";
import { IconHeart, IconMap } from "@/components/ui/icons";

// 検索結果の店舗カード（マガジンスタイル）
export function StoreCard({
  item,
  initialFav = false,
}: {
  item: ScoredStore;
  initialFav?: boolean;
}) {
  const router = useRouter();
  const { store, seat, distanceM, walkMin } = item;
  const [fav, setFav] = useState(initialFav);

  async function toggleFav(e: React.MouseEvent) {
    e.stopPropagation();
    const userId = await getCurrentUserId();
    if (!userId) {
      router.push("/login");
      return;
    }
    const on = await dataApi.toggleFavorite(userId, store.id);
    setFav(on);
  }

  return (
    <article
      onClick={() => router.push(`/store/${store.id}`)}
      className="animate-card-in cursor-pointer overflow-hidden rounded-md bg-white shadow-card transition-shadow hover:shadow-cardhover"
    >
      {/* マガジンスタイル: 大きい画像 + テキストオーバーレイ */}
      <div className="relative h-52 w-full bg-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={store.images[0]}
          alt={store.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {/* 強めのグラデーション（下半分） */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {/* 空席バッジ（左上） */}
        <SeatBadge status={seat.availability} className="absolute left-2.5 top-2.5 shadow-sm" />

        {/* お気に入り（右上） */}
        <button
          onClick={toggleFav}
          aria-label="お気に入り"
          className="absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full bg-black/30 backdrop-blur-sm active:scale-90"
        >
          <IconHeart size={18} filled={fav} className={fav ? "text-primary" : "text-white"} />
        </button>

        {/* 雰囲気タグ + 店名（画像下部オーバーレイ） */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5">
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {store.moods.map((m) => (
              <span
                key={m}
                className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm"
              >
                {m}
              </span>
            ))}
          </div>
          <h3 className="text-[19px] font-bold leading-tight text-white drop-shadow-sm">
            {store.name}
          </h3>
        </div>
      </div>

      {/* メタデータ行 */}
      <div className="flex items-center justify-between px-3.5 py-2.5">
        <div className="flex items-center gap-3 text-xs text-sub">
          <span className="flex items-center gap-1">
            <IconMap size={12} className="shrink-0 text-muted" />
            徒歩{walkMin}分 · {formatDistance(distanceM)}
          </span>
          <span>¥ 〜{store.averageBudget.toLocaleString()}/人</span>
        </div>
        <ScoreBadge score={item.score} />
      </div>
    </article>
  );
}
