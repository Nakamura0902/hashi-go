"use client";

import { useEffect, useState } from "react";
import { dataApi } from "@/lib/data";
import { useCurrentUserId } from "@/lib/auth";
import type { ScoredStore } from "@/lib/types";
import { BottomNav } from "@/components/nav/BottomNav";
import { StoreCard } from "@/components/store/StoreCard";
import { Header, Screen, EmptyState, BigButton, Spinner } from "@/components/ui";

export default function FavoritesPage() {
  const [items, setItems] = useState<ScoredStore[] | null>(null);
  const userId = useCurrentUserId();

  useEffect(() => {
    if (!userId) return;
    dataApi.listFavorites(userId).then(setItems);
  }, [userId]);

  return (
    <Screen>
      <Header title="お気に入り" />
      {items === null ? (
        <div className="flex justify-center py-20">
          <Spinner className="border-primary/30 border-t-primary" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="お気に入りはまだありません"
          description="気になるお店のハートを押すと保存できます"
          action={<BigButton href="/list" variant="outline">お店を探す</BigButton>}
        />
      ) : (
        <div className="space-y-3 px-4 py-3">
          {items.map((it) => (
            <StoreCard key={it.store.id} item={it} initialFav />
          ))}
        </div>
      )}
      <BottomNav />
    </Screen>
  );
}
