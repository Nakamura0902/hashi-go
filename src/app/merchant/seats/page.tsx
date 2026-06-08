"use client";

import { useEffect, useState } from "react";
import { dataApi } from "@/lib/data";
import { getMerchantStoreId } from "@/lib/session";
import type { SeatAvailability, SeatStatus } from "@/lib/types";
import { MerchantNav } from "@/components/nav/MerchantNav";
import { Header, Screen, Card, BigButton, Spinner } from "@/components/ui";
import { IconPlus, IconMinus, IconCheck } from "@/components/ui/icons";

const OPTIONS: { key: SeatAvailability; label: string; cls: string }[] = [
  { key: "open", label: "すぐ案内できる", cls: "bg-seat-open" },
  { key: "few", label: "空席わずか", cls: "bg-seat-few" },
  { key: "soon", label: "少し待てば案内できる", cls: "bg-seat-soon text-ink" },
  { key: "full", label: "満席", cls: "bg-seat-full" },
  { key: "closed", label: "本日受付終了", cls: "bg-seat-closed" },
];

export default function MerchantSeatsPage() {
  const [storeId, setStoreId] = useState("");
  const [seat, setSeat] = useState<SeatStatus | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const id = getMerchantStoreId();
    setStoreId(id);
    dataApi.getMerchantDashboard(id).then((d) => d && setSeat(d.seat));
  }, []);

  // 空席状況はワンタップで即保存（§15: 最優先導線）
  async function pick(key: SeatAvailability) {
    if (!seat) return;
    setSeat({ ...seat, availability: key });
    await dataApi.updateSeatAvailability(storeId, key);
    flash();
  }

  function adjust(
    field: "table2" | "table4" | "counter",
    delta: number
  ) {
    if (!seat) return;
    const cur = seat[field];
    const free = Math.max(0, Math.min(cur.total, cur.free + delta));
    setSeat({ ...seat, [field]: { ...cur, free } });
  }

  async function saveSeats() {
    if (!seat) return;
    const capacity = seat.table2.free * 2 + seat.table4.free * 4 + seat.counter.free;
    const next = { ...seat, totalGroupCapacity: capacity };
    setSeat(next);
    await dataApi.updateSeats(storeId, {
      table2: next.table2,
      table4: next.table4,
      counter: next.counter,
      totalGroupCapacity: capacity,
    });
    flash();
  }

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  if (!seat)
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner className="border-primary/30 border-t-primary" />
      </div>
    );

  return (
    <Screen>
      <Header title="空席状況の更新" />

      <div className="space-y-5 px-4 py-4">
        {/* 今の空席状況（ワンタップ） */}
        <div>
          <p className="mb-2 text-[13px] font-semibold text-sub">
            今の空席状況（タップで即反映）
          </p>
          <div className="space-y-2">
            {OPTIONS.map((o) => {
              const on = seat.availability === o.key;
              return (
                <button
                  key={o.key}
                  onClick={() => pick(o.key)}
                  className={`flex h-14 w-full items-center justify-between rounded-md px-4 text-base font-bold text-white transition active:scale-[0.99] ${o.cls} ${on ? "ring-4 ring-primary/40" : "opacity-90"}`}
                >
                  {o.label}
                  {on && <IconCheck size={22} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 席数の調整 */}
        <div>
          <p className="mb-2 text-[13px] font-semibold text-sub">空席数の調整</p>
          <Card className="divide-y divide-line">
            <SeatRow label="2名席" field="table2" v={seat.table2} adjust={adjust} />
            <SeatRow label="4名席" field="table4" v={seat.table4} adjust={adjust} />
            <SeatRow label="カウンター" field="counter" v={seat.counter} adjust={adjust} />
          </Card>
          <div className="mt-3">
            <BigButton onClick={saveSeats}>席数を保存する</BigButton>
          </div>
        </div>

        <p className="text-center text-xs text-muted">
          最終更新: {new Date(seat.updatedAt).toLocaleString("ja-JP")}
        </p>
      </div>

      {/* 保存トースト */}
      {saved && (
        <div className="animate-card-in fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-seat-open px-5 py-2 text-sm font-bold text-white shadow-card">
          ✓ 更新しました
        </div>
      )}

      <MerchantNav />
    </Screen>
  );
}

function SeatRow({
  label,
  field,
  v,
  adjust,
}: {
  label: string;
  field: "table2" | "table4" | "counter";
  v: { free: number; total: number };
  adjust: (f: "table2" | "table4" | "counter", d: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-xs text-muted">全{v.total}席</p>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => adjust(field, -1)}
          className="grid h-9 w-9 place-items-center rounded-full border border-line active:scale-95"
          aria-label="減らす"
        >
          <IconMinus size={18} />
        </button>
        <span className="w-10 text-center text-lg font-bold text-ink">空{v.free}</span>
        <button
          onClick={() => adjust(field, 1)}
          className="grid h-9 w-9 place-items-center rounded-full border border-line active:scale-95"
          aria-label="増やす"
        >
          <IconPlus size={18} />
        </button>
      </div>
    </div>
  );
}
