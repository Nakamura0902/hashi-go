"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dataApi } from "@/lib/data";
import { formatDistance } from "@/lib/geo";
import type { ScoredStore, Store } from "@/lib/types";
import { SeatBadge } from "./SeatBadge";
import { IconArrowRight } from "@/components/ui/icons";

// #1 自動送客: 満席・空席わずかの店で、近くの「今すぐ入れる」店を提案する。
export function NearbyAlternatives({ store }: { store: Store }) {
  const router = useRouter();
  const [alts, setAlts] = useState<ScoredStore[]>([]);

  useEffect(() => {
    dataApi
      .searchStores(
        { lat: store.lat, lng: store.lng, peopleCount: 2, budget: 0, moods: [], purpose: null },
        "distance"
      )
      .then((list) => {
        const open = list.filter(
          (s) => s.store.id !== store.id && s.seat.availability === "open"
        );
        setAlts(open.slice(0, 3));
      });
  }, [store.id, store.lat, store.lng]);

  if (alts.length === 0) return null;

  return (
    <section className="mx-4 mt-6 rounded-md border border-seat-open/30 bg-seat-openbg/40 p-4">
      <p className="text-sm font-bold text-ink">
        🚶 こちらは混雑中。すぐ入れる近くのお店
      </p>
      <p className="mt-0.5 text-xs text-sub">徒歩圏内で今すぐ案内できます</p>
      <div className="mt-3 space-y-2">
        {alts.map((a) => (
          <button
            key={a.store.id}
            onClick={() => router.push(`/store/${a.store.id}`)}
            className="flex w-full items-center gap-3 rounded-md bg-white p-2.5 text-left shadow-card active:scale-[0.99]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={a.store.images[0]}
              alt={a.store.name}
              className="h-12 w-12 shrink-0 rounded-sm object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{a.store.name}</p>
              <p className="text-xs text-sub">
                徒歩{a.walkMin}分 · {formatDistance(a.distanceM)}
              </p>
            </div>
            <SeatBadge status={a.seat.availability} />
            <IconArrowRight size={16} className="text-muted" />
          </button>
        ))}
      </div>
    </section>
  );
}
