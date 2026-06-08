"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dataApi } from "@/lib/data";
import { useCurrentUserId } from "@/lib/auth";
import type { Visit } from "@/lib/types";
import { BottomNav } from "@/components/nav/BottomNav";
import { Header, Screen, Card, EmptyState, BigButton, Spinner } from "@/components/ui";

const STATUS_LABEL: Record<Visit["status"], { text: string; cls: string }> = {
  planned: { text: "来店予定", cls: "bg-seat-fewbg text-seat-few" },
  checked_in: { text: "来店済み", cls: "bg-seat-openbg text-seat-open" },
  cancelled: { text: "キャンセル", cls: "bg-seat-closedbg text-seat-closed" },
};

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function HistoryPage() {
  const [items, setItems] = useState<Visit[] | null>(null);
  const userId = useCurrentUserId();

  useEffect(() => {
    if (!userId) return;
    dataApi.listVisits(userId).then(setItems);
  }, [userId]);

  return (
    <Screen>
      <Header title="来店履歴" />
      {items === null ? (
        <div className="flex justify-center py-20">
          <Spinner className="border-primary/30 border-t-primary" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="来店履歴はまだありません"
          description="「この店に行く」を押すとここに記録されます"
          action={<BigButton href="/list" variant="outline">お店を探す</BigButton>}
        />
      ) : (
        <div className="space-y-3 px-4 py-3">
          {items.map((v) => {
            const st = STATUS_LABEL[v.status];
            return (
              <Link key={v.id} href={`/visit/${v.id}`}>
                <Card className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-bold text-ink">{v.storeName}</p>
                    <p className="mt-0.5 text-xs text-sub">{fmt(v.plannedAt)} · スコア {v.scoreAtSelection}</p>
                  </div>
                  <span className={`rounded-sm px-2 py-1 text-xs font-semibold ${st.cls}`}>
                    {st.text}
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      <BottomNav />
    </Screen>
  );
}
