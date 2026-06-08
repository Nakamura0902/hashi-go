"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/lib/store";
import { dataApi } from "@/lib/data";
import { haversineM, walkMinutes, formatDistance } from "@/lib/geo";
import type { ScoredStore } from "@/lib/types";
import { BottomNav } from "@/components/nav/BottomNav";
import { SeatBadge } from "@/components/store/SeatBadge";
import { shareLink } from "@/lib/share";
import { Tag, Header, Screen, Spinner, BigButton } from "@/components/ui";
import { IconArrowRight, IconShare } from "@/components/ui/icons";

// #5 はしごルート: 2軒目→3軒目→締め を自動で組む
function buildRoute(list: ScoredStore[]): ScoredStore[] {
  const open = list.filter(
    (s) => s.seat.availability === "open" || s.seat.availability === "few"
  );
  if (open.length === 0) return [];
  const route: ScoredStore[] = [];

  // 2軒目: スコア最上位
  route.push(open[0]);

  // 3軒目: 1軒目と雰囲気が異なる近場
  const second = open
    .filter((s) => s.store.id !== route[0].store.id)
    .filter((s) => !s.store.moods.some((m) => route[0].store.moods.includes(m)))
    .sort(
      (a, b) =>
        haversineM(route[0].store, a.store) - haversineM(route[0].store, b.store)
    )[0] ?? open.find((s) => s.store.id !== route[0].store.id);
  if (second) route.push(second);

  // 締め: 締めごはん目的 or 深夜営業
  const used = new Set(route.map((s) => s.store.id));
  const last =
    open.find((s) => !used.has(s.store.id) && s.store.purposes.includes("締めごはん")) ??
    open.find((s) => !used.has(s.store.id) && s.store.isLateNight) ??
    open.find((s) => !used.has(s.store.id));
  if (last) route.push(last);

  return route;
}

const LABELS = ["2軒目", "3軒目", "締め"];

export default function RoutePage() {
  const router = useRouter();
  const params = useSearch((s) => s.asParams);
  const [list, setList] = useState<ScoredStore[] | null>(null);

  useEffect(() => {
    dataApi.searchStores(params(), "score").then(setList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const route = useMemo(() => (list ? buildRoute(list) : []), [list]);

  const totalWalk = useMemo(() => {
    let m = 0;
    for (let i = 1; i < route.length; i++) {
      m += haversineM(route[i - 1].store, route[i].store);
    }
    return m;
  }, [route]);

  return (
    <Screen>
      <Header
        title="はしごルート"
        back
        subtitle="2軒目→3軒目→締めを提案"
        right={
          <button
            onClick={() =>
              shareLink({
                title: "はしごルート",
                text: "今夜のはしごルートはこれ！はしGOで見る",
                path: "/route",
              })
            }
            aria-label="シェア"
            className="grid h-9 w-9 place-items-center rounded-full text-white/90 active:bg-white/10"
          >
            <IconShare size={18} />
          </button>
        }
      />

      {list === null ? (
        <div className="flex justify-center py-20">
          <Spinner className="border-primary/30 border-t-primary" />
        </div>
      ) : route.length === 0 ? (
        <div className="px-4 py-10 text-center text-sub">
          今すぐ入れるお店が見つかりませんでした
        </div>
      ) : (
        <div className="px-4 py-4">
          <p className="mb-3 text-sm text-sub">
            おすすめの全{route.length}軒・店間の徒歩合計 約{walkMinutes(totalWalk)}分
          </p>

          <div className="relative space-y-3">
            {route.map((s, i) => (
              <div key={s.store.id}>
                {i > 0 && (
                  <div className="flex items-center gap-2 py-1 pl-5 text-xs text-muted">
                    <span className="h-4 w-px bg-line" />
                    🚶 徒歩{walkMinutes(haversineM(route[i - 1].store, s.store))}分
                  </div>
                )}
                <div
                  onClick={() => router.push(`/store/${s.store.id}`)}
                  className="flex cursor-pointer items-center gap-3 rounded-md bg-white p-3 shadow-card active:scale-[0.99]"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.store.images[0]}
                    alt={s.store.name}
                    className="h-14 w-14 shrink-0 rounded-sm object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-primary">{LABELS[i] ?? `${i + 1}軒目`}</p>
                    <p className="truncate text-sm font-bold text-ink">{s.store.name}</p>
                    <div className="mt-0.5 flex items-center gap-1">
                      {s.store.moods.slice(0, 1).map((m) => (
                        <Tag key={m}>{m}</Tag>
                      ))}
                      <span className="text-xs text-sub">〜{s.store.averageBudget.toLocaleString()}円</span>
                    </div>
                  </div>
                  <SeatBadge status={s.seat.availability} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <BigButton
              onClick={() => router.push(`/store/${route[0].store.id}`)}
              icon={<IconArrowRight size={20} />}
            >
              1軒目（{LABELS[0]}）から始める
            </BigButton>
          </div>
        </div>
      )}

      <BottomNav />
    </Screen>
  );
}
