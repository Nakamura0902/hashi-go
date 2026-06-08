"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSearch } from "@/lib/store";
import { dataApi } from "@/lib/data";
import { useCurrentUserId } from "@/lib/auth";
import { formatDistance } from "@/lib/geo";
import type { ScoredStore } from "@/lib/types";
import { SeatBadge } from "@/components/store/SeatBadge";
import { ScoreBadge } from "@/components/store/ScoreBadge";
import { NearbyAlternatives } from "@/components/store/NearbyAlternatives";
import { StoreLiveMessage } from "@/components/store/StoreLiveMessage";
import { StoreReviews } from "@/components/store/StoreReviews";
import { shareLink } from "@/lib/share";
import { Tag, BigButton, Spinner } from "@/components/ui";
import {
  IconChevronLeft,
  IconHeart,
  IconClock,
  IconPhone,
  IconMap,
  IconLock,
  IconShare,
} from "@/components/ui/icons";

function seatCellClass(free: number) {
  return free > 0
    ? "bg-seat-openbg text-seat-open"
    : "bg-seat-closedbg text-seat-closed";
}

// 営業終了までの残り時間（closeTimeは26:00=翌2時表記）
function remainingHours(closeTime: string): string {
  const [h] = closeTime.split(":").map(Number);
  const now = new Date().getHours();
  const closeHour = h >= 24 ? h - 24 : h;
  let diff = closeHour - now;
  if (diff <= 0) diff += 24;
  return `残り約${diff}時間`;
}

export default function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const asParams = useSearch((s) => s.asParams);
  const [item, setItem] = useState<ScoredStore | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [fav, setFav] = useState(false);
  const [going, setGoing] = useState(false);
  const [incoming, setIncoming] = useState(0);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const userId = useCurrentUserId();

  useEffect(() => {
    dataApi.getScoredStore(id, asParams()).then((r) => {
      if (r) setItem(r);
      else setNotFound(true);
    });
    dataApi.getIncomingCount(id).then(setIncoming);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function share() {
    if (!item) return;
    const res = await shareLink({
      title: item.store.name,
      text: `${item.store.name}、今ここ良さそう！はしGOで見る`,
      path: `/store/${id}`,
    });
    if (res === "copied") {
      setShareMsg("リンクをコピーしました");
      setTimeout(() => setShareMsg(null), 1800);
    }
  }

  useEffect(() => {
    if (!userId) return;
    dataApi.isFavorite(userId, id).then(setFav);
  }, [userId, id]);

  async function go() {
    if (!item || !userId) return;
    setGoing(true);
    const visit = await dataApi.createVisit({
      userId,
      store: item.store,
      score: item.score,
      etaMin: item.walkMin,
    });
    router.push(`/visit/${visit.id}`);
  }

  if (notFound)
    return (
      <div className="grid min-h-dvh place-items-center text-sub">店舗が見つかりません</div>
    );
  if (!item)
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner className="border-primary/30 border-t-primary" />
      </div>
    );

  const { store, seat, offers } = item;
  const offer = offers[0];

  return (
    <div className="min-h-dvh pb-28">
      {/* A. ヒーロー画像 */}
      <div className="relative h-[220px] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={store.images[0]} alt={store.name} className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
        <button
          onClick={() => router.back()}
          aria-label="もどる"
          className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-ink"
        >
          <IconChevronLeft size={22} />
        </button>
        <div className="absolute right-3 top-3 flex gap-2">
          <button
            onClick={share}
            aria-label="シェア"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/80 text-ink"
          >
            <IconShare size={18} />
          </button>
          <button
            onClick={async () => {
              if (!userId) return;
              setFav(await dataApi.toggleFavorite(userId, store.id));
            }}
            aria-label="お気に入り"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/80"
          >
            <IconHeart size={20} filled={fav} className={fav ? "text-primary" : "text-muted"} />
          </button>
        </div>
        <SeatBadge status={seat.availability} className="absolute bottom-3 left-4" />
      </div>

      {/* #B 店主のライブひとこと */}
      <StoreLiveMessage storeId={store.id} />

      {/* B-1. 基本情報 */}
      <div className="px-4 pt-4">
        <h1 className="text-[22px] font-bold text-ink">{store.name}</h1>
        {/* #C 社会的証明 */}
        {incoming > 0 && (
          <p className="mt-1 inline-block rounded-full bg-seat-fewbg px-2.5 py-1 text-xs font-bold text-seat-few">
            🔥 今 {incoming} 組が向かっています
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {store.moods.map((m) => (
            <Tag key={m}>{m}</Tag>
          ))}
        </div>
        <div className="mt-2 space-y-1 text-sm text-sub">
          <p>📍 徒歩{item.walkMin}分（{formatDistance(item.distanceM)}）· {store.nearestStation}</p>
          <p>💴 〜{store.averageBudget.toLocaleString()}円 / 人</p>
          <p>🕐 {store.openTime}〜{store.closeTime.replace(/^(2[4-9]):/, (_, h) => `翌${Number(h) - 24}:`)}（{remainingHours(store.closeTime)}）</p>
        </div>
      </div>

      {/* B-2. 空席状況 */}
      <Section title="空席状況">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "2名席", icon: "👥", v: seat.table2 },
            { label: "4名席", icon: "👥", v: seat.table4 },
            { label: "カウンター", icon: "🪑", v: seat.counter },
          ].map((c) => (
            <div
              key={c.label}
              className={`flex h-[72px] flex-col items-center justify-center rounded-md ${seatCellClass(c.v.free)}`}
            >
              <span className="text-base">{c.icon}</span>
              <span className="mt-0.5 text-xs font-semibold">{c.label}</span>
              <span className="text-xs font-semibold">
                {c.v.free > 0 ? `空${c.v.free} / 全${c.v.total}` : `満席 / 全${c.v.total}`}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* #1 自動送客: 混雑時は近くの空席店を提案 */}
      {seat.availability !== "open" && <NearbyAlternatives store={store} />}

      {/* B-3. はしごスコア */}
      <Section title="はしごスコア">
        <ScoreBadge score={item.score} size="large" />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.reasons.map((r) => (
            <span
              key={r}
              className="rounded-sm bg-primary-light px-2 py-1 text-xs font-medium text-primary-dark"
            >
              {r}
            </span>
          ))}
        </div>
      </Section>

      {/* B-4. 特典 */}
      {offer && (
        <div className="mx-4 mt-6 flex items-start gap-3 rounded-md border-[1.5px] border-primary bg-[#FFF7ED] p-4">
          <span className="text-2xl">🎁</span>
          <div>
            <p className="text-sm font-semibold text-primary-dark">
              はしGO来店特典: {offer.title}
            </p>
            <p className="mt-0.5 text-xs text-muted">QRチェックイン時に適用</p>
          </div>
        </div>
      )}

      {/* B-5. お店の情報 */}
      <Section title="お店の情報">
        <div className="divide-y divide-line">
          <InfoRow icon={<IconClock size={18} />} label="営業時間" value={`${store.openTime}〜${store.closeTime}`} />
          <InfoRow icon={<IconPhone size={18} />} label="電話番号" value={store.phone} href={`tel:${store.phone}`} />
          <InfoRow icon={<IconMap size={18} />} label="住所" value={store.address} />
          <InfoRow icon={<IconMap size={18} />} label="最寄り駅" value={store.nearestStation} />
        </div>
      </Section>

      {/* #A 口コミ・評価 */}
      <StoreReviews storeId={store.id} />

      {/* B-6. QRチェックイン案内 */}
      <Section title="チェックイン">
        <div className="rounded-md bg-bg p-4 text-center">
          <p className="text-[13px] text-sub">
            お店に着いたらQRコードをスタッフに見せてください。特典が適用されます。
          </p>
          <div className="mx-auto mt-3 grid h-[120px] w-[120px] place-items-center rounded-md border-2 border-dashed border-line text-muted">
            <IconLock size={28} />
          </div>
          <p className="mt-2 text-xs text-muted">
            「この店に行く」を押すとQRが表示されます
          </p>
        </div>
      </Section>

      {/* C. 固定CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-app border-t border-line bg-white px-4 py-3 pb-safe">
        <BigButton
          onClick={go}
          loading={going}
          icon={<IconMap size={20} />}
          disabled={seat.availability === "full" || seat.availability === "closed"}
        >
          {seat.availability === "full"
            ? "現在は満席です"
            : seat.availability === "closed"
              ? "営業時間外です"
              : "この店に行く"}
        </BigButton>
      </div>

      {shareMsg && (
        <div className="animate-card-in fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-navy px-5 py-2 text-sm font-bold text-white shadow-card">
          {shareMsg}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 pt-6">
      <h2 className="mb-2 text-[15px] font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex h-11 items-center gap-3">
      <span className="text-sub">{icon}</span>
      <span className="w-20 text-sm text-muted">{label}</span>
      <span className="flex-1 text-sm text-ink">{value}</span>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}
