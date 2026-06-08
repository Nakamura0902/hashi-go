"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearch } from "@/lib/store";
import { dataApi } from "@/lib/data";
import { subscribeSeatStatus } from "@/lib/realtime";
import { hasSupabase } from "@/lib/config";
import { useCurrentUserId } from "@/lib/auth";
import type { ScoredStore, SortKey } from "@/lib/types";
import { BottomNav } from "@/components/nav/BottomNav";
import { StoreCard } from "@/components/store/StoreCard";
import { Header, Screen, Chip, EmptyState, BigButton, Spinner } from "@/components/ui";
import { IconSort } from "@/components/ui/icons";

type Filter = "all" | "open" | "near" | "cheap" | "late" | "group4";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "open", label: "空席あり" },
  { key: "near", label: "徒歩5分以内" },
  { key: "cheap", label: "予算〜1,500円" },
  { key: "late", label: "深夜OK" },
  { key: "group4", label: "4名以上OK" },
];

// #D こだわり検索（設備タグ・部分一致でstore.featuresにマッチ）
const FEATURE_FILTERS = ["個室", "飲み放題", "カウンター", "禁煙", "立ち飲み"];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "score", label: "はしごスコア順" },
  { key: "distance", label: "距離が近い順" },
  { key: "budget", label: "予算が安い順" },
  { key: "seats", label: "空席が多い順" },
];

export default function ListPage() {
  const params = useSearch((s) => s.asParams)();
  const [items, setItems] = useState<ScoredStore[] | null>(null);
  const [favIds, setFavIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("score");
  const [sortOpen, setSortOpen] = useState(false);
  const [liveFlash, setLiveFlash] = useState(false);
  const [feats, setFeats] = useState<Set<string>>(new Set());
  const userId = useCurrentUserId();

  function toggleFeat(f: string) {
    setFeats((prev) => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  }

  const load = useCallback(
    (showFlash = false) => {
      dataApi.searchStores(params, sort).then(setItems);
      if (showFlash) {
        setLiveFlash(true);
        setTimeout(() => setLiveFlash(false), 1800);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sort]
  );

  useEffect(() => {
    setItems(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  // お気に入りはユーザーID確定後に取得
  useEffect(() => {
    if (!userId) return;
    dataApi.listFavorites(userId).then((favs) => setFavIds(favs.map((f) => f.store.id)));
  }, [userId]);

  // Realtime: 空席状況が変わったら自動で再取得（Supabase接続時のみ）
  useEffect(() => {
    return subscribeSeatStatus(() => load(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const filtered = (items ?? []).filter((it) => {
    switch (filter) {
      case "open":
        return it.seat.availability === "open" || it.seat.availability === "few";
      case "near":
        return it.walkMin <= 5;
      case "cheap":
        return it.store.averageBudget <= 1500;
      case "late":
        return it.store.isLateNight;
      case "group4":
        return it.seat.totalGroupCapacity >= 4;
      default:
        return true;
    }
  }).filter((it) =>
    // #D こだわり: 選択した設備タグをすべて満たす
    [...feats].every((f) => it.store.features.some((sf) => sf.includes(f)))
  );

  return (
    <Screen>
      <Header
        title="おすすめのお店"
        back="/"
        subtitle={hasSupabase ? "● リアルタイムで空席を反映中" : undefined}
        right={
          <button
            onClick={() => setSortOpen((v) => !v)}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-white/90 active:bg-white/10"
          >
            <IconSort size={18} />
            並び替え
          </button>
        }
      />

      {/* 並び替えパネル */}
      {sortOpen && (
        <div className="border-b border-line bg-white px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {SORTS.map((o) => (
              <Chip
                key={o.key}
                size="sm"
                selected={sort === o.key}
                onClick={() => {
                  setSort(o.key);
                  setSortOpen(false);
                }}
              >
                {o.label}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* 補足 */}
      <p className="bg-bg px-4 py-2 text-xs text-muted">
        現在の空席状況を反映しています
      </p>

      {/* 絞り込みバー */}
      <div className="no-scrollbar sticky top-[52px] z-10 flex gap-2 overflow-x-auto border-b border-line bg-white px-4 py-2">
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            size="sm"
            selected={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Chip>
        ))}
      </div>

      {/* #D こだわり検索（設備タグ） */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto bg-bg px-4 py-2">
        <span className="shrink-0 text-[11px] font-bold text-muted">こだわり</span>
        {FEATURE_FILTERS.map((f) => (
          <Chip key={f} size="sm" selected={feats.has(f)} onClick={() => toggleFeat(f)}>
            {f}
          </Chip>
        ))}
      </div>

      {/* リスト */}
      {items === null ? (
        <div className="flex justify-center py-20">
          <Spinner className="border-primary/30 border-t-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="条件に合うお店が見つかりません"
          description="絞り込みを変えてもう一度お試しください"
          action={<BigButton href="/" variant="outline">条件を変えて再検索</BigButton>}
        />
      ) : (
        <div className="space-y-3 px-4 py-3">
          {filtered.map((it) => (
            <StoreCard key={it.store.id} item={it} initialFav={favIds.includes(it.store.id)} />
          ))}
        </div>
      )}

      {/* Realtime更新トースト */}
      {liveFlash && (
        <div className="animate-card-in fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-navy px-5 py-2 text-sm font-bold text-white shadow-card">
          空席情報を更新しました
        </div>
      )}

      <BottomNav />
    </Screen>
  );
}
