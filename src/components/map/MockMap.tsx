"use client";

import type { ScoredStore } from "@/lib/types";
import { seatColor } from "@/components/store/SeatBadge";

// Mapboxトークンが無いときのフォールバック地図。
// lat/lngを相対座標に投影してピンを並べる（距離感は概ね伝わる）。

const PIN_BG: Record<string, string> = {
  open: "bg-seat-open",
  few: "bg-seat-few",
  soon: "bg-seat-soon",
  full: "bg-seat-closed",
  closed: "bg-seat-closed",
};

export function MockMap({
  stores,
  center,
  selectedId,
  onSelect,
}: {
  stores: ScoredStore[];
  center: { lat: number; lng: number };
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const pts = [
    { lat: center.lat, lng: center.lng },
    ...stores.map((s) => ({ lat: s.store.lat, lng: s.store.lng })),
  ];
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 0.12;
  const project = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng || 1)) * (1 - 2 * pad) + pad;
    const y = 1 - (((lat - minLat) / (maxLat - minLat || 1)) * (1 - 2 * pad) + pad);
    return { left: `${x * 100}%`, top: `${y * 100}%` };
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#eef1f4]">
      {/* 簡易マップ風の背景（道路グリッド） */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(#dfe4ea 1px, transparent 1px), linear-gradient(90deg, #dfe4ea 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-sub shadow-sm">
        簡易地図（Mapboxトークン未設定）
      </div>

      {/* 現在地 */}
      {(() => {
        const p = project(center.lat, center.lng);
        return (
          <div className="absolute -translate-x-1/2 -translate-y-1/2" style={p}>
            <span className="absolute -left-3 -top-3 h-6 w-6 animate-pulse rounded-full bg-blue-500/25" />
            <span className="block h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow" />
          </div>
        );
      })()}

      {/* 店舗ピン */}
      {stores.map((s) => {
        const p = project(s.store.lat, s.store.lng);
        const selected = s.store.id === selectedId;
        const dim = s.seat.availability === "full" || s.seat.availability === "closed";
        return (
          <button
            key={s.store.id}
            onClick={() => onSelect(s.store.id)}
            className={`absolute -translate-x-1/2 -translate-y-full transition ${selected ? "z-20 scale-110" : "z-10"}`}
            style={p}
          >
            <span
              className={`block rounded-md px-2 py-1 text-[11px] font-bold text-white shadow-card ${PIN_BG[s.seat.availability]} ${dim ? "opacity-60" : ""} ${selected ? "ring-2 ring-white" : ""} ${s.seat.availability === "soon" ? "text-ink" : ""}`}
            >
              {s.store.name.replace(/^(大衆酒場|炭火串焼き|スタンドバル|酒場|深夜食堂)\s?/, "").slice(0, 5)}
            </span>
            <span
              className={`mx-auto block h-0 w-0 border-x-4 border-t-4 border-x-transparent ${dim ? "opacity-60" : ""}`}
              style={{ borderTopColor: "currentColor" }}
            />
          </button>
        );
      })}
    </div>
  );
}
