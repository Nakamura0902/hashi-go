"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/lib/store";
import { dataApi } from "@/lib/data";
import { subscribeSeatStatus } from "@/lib/realtime";
import { formatDistance } from "@/lib/geo";
import type { ScoredStore } from "@/lib/types";
import { StoreMap } from "@/components/map/StoreMap";
import { BottomNav } from "@/components/nav/BottomNav";
import { SeatBadge } from "@/components/store/SeatBadge";
import { Chip, Tag, Spinner } from "@/components/ui";
import { IconTarget, IconArrowRight } from "@/components/ui/icons";

type Filter = "open" | "cheap" | "late" | "group4" | "near";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "open", label: "空席あり" },
  { key: "cheap", label: "安め（〜1,500円）" },
  { key: "late", label: "深夜営業" },
  { key: "group4", label: "4名OK" },
  { key: "near", label: "徒歩5分以内" },
];

export default function MapPage() {
  const router = useRouter();
  const search = useSearch();
  const params = useSearch((s) => s.asParams);
  const [items, setItems] = useState<ScoredStore[] | null>(null);
  const [active, setActive] = useState<Set<Filter>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    dataApi.searchStores(params(), "score").then(setItems);
    // Realtime: 空席が変わったらピンの色を自動更新
    return subscribeSeatStatus(() => {
      dataApi.searchStores(params(), "score").then(setItems);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(f: Filter) {
    setActive((prev) => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  }

  const shown = useMemo(() => {
    return (items ?? []).filter((it) => {
      for (const f of active) {
        if (f === "open" && !(it.seat.availability === "open" || it.seat.availability === "few")) return false;
        if (f === "cheap" && it.store.averageBudget > 1500) return false;
        if (f === "late" && !it.store.isLateNight) return false;
        if (f === "group4" && it.seat.totalGroupCapacity < 4) return false;
        if (f === "near" && it.walkMin > 5) return false;
      }
      return true;
    });
  }, [items, active]);

  const selected = shown.find((s) => s.store.id === selectedId) ?? null;

  return (
    <div className="flex h-dvh flex-col">
      {/* A. フィルターバー */}
      <div className="z-20 flex items-center gap-2 bg-white px-3 py-2 shadow-card">
        <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <Chip key={f.key} size="sm" selected={active.has(f.key)} onClick={() => toggle(f.key)}>
              {f.label}
            </Chip>
          ))}
        </div>
        <button
          onClick={() => setActive(new Set())}
          aria-label="現在地に戻る"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-primary"
        >
          <IconTarget size={18} />
        </button>
      </div>

      {/* B. 地図 */}
      <div className="relative flex-1">
        {items === null ? (
          <div className="grid h-full place-items-center">
            <Spinner className="border-primary/30 border-t-primary" />
          </div>
        ) : (
          <StoreMap
            stores={shown}
            center={{ lat: search.lat, lng: search.lng }}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}

        {/* C. サマリーカード（ボトムシート） */}
        {selected && (
          <div className="animate-sheet-up absolute inset-x-0 bottom-0 z-20 rounded-t-lg bg-white p-4 shadow-bottombar">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
            <div className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.store.images[0]}
                alt={selected.store.name}
                onClick={() => router.push(`/store/${selected.store.id}`)}
                className="h-[72px] w-[72px] shrink-0 rounded-sm object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-bold text-ink">{selected.store.name}</p>
                  <SeatBadge status={selected.seat.availability} />
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selected.store.moods.map((m) => (
                    <Tag key={m}>{m}</Tag>
                  ))}
                </div>
                <p className="mt-1 text-xs text-sub">
                  📍 徒歩{selected.walkMin}分 · {formatDistance(selected.distanceM)} 💴 〜{selected.store.averageBudget.toLocaleString()}円
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/store/${selected.store.id}`)}
              className="mt-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-bold text-white shadow-fab active:scale-[0.98]"
            >
              この店に行く
              <IconArrowRight size={20} />
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
