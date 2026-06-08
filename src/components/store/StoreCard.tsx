"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ScoredStore } from "@/lib/types";
import { formatDistance } from "@/lib/geo";
import { dataApi } from "@/lib/data";
import { getCurrentUserId } from "@/lib/auth";
import { SeatBadge } from "./SeatBadge";
import { ScoreBadge } from "./ScoreBadge";
import { Tag } from "@/components/ui";
import { IconHeart, IconArrowRight } from "@/components/ui/icons";

// 検索結果の店舗カード（おすすめ一覧・お気に入りで共用）
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
    const on = await dataApi.toggleFavorite(userId, store.id);
    setFav(on);
  }

  return (
    <article
      onClick={() => router.push(`/store/${store.id}`)}
      className="animate-card-in overflow-hidden rounded-md bg-white shadow-card"
    >
      {/* 画像 + オーバーレイ */}
      <div className="relative h-40 w-full bg-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={store.images[0]}
          alt={store.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <SeatBadge status={seat.availability} className="absolute left-2 top-2 shadow-sm" />
        <button
          onClick={toggleFav}
          aria-label="お気に入り"
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-sm"
        >
          <IconHeart size={18} filled={fav} className={fav ? "text-primary" : "text-muted"} />
        </button>
      </div>

      {/* 本文 */}
      <div className="px-3.5 pb-3.5 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[17px] font-bold text-ink">{store.name}</h3>
          <ScoreBadge score={item.score} />
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {store.moods.map((m) => (
            <Tag key={m}>{m}</Tag>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-3 text-xs text-sub">
          <span>📍 徒歩{walkMin}分 · {formatDistance(distanceM)}</span>
          <span>💴 〜{store.averageBudget.toLocaleString()}円/人</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/store/${store.id}`);
          }}
          className="mt-2.5 flex h-11 w-full items-center justify-center gap-1 rounded-full border-[1.5px] border-primary bg-white text-sm font-semibold text-primary active:scale-[0.99]"
        >
          詳しく見る
          <IconArrowRight size={16} />
        </button>
      </div>
    </article>
  );
}
