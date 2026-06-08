"use client";

import { useEffect, useState } from "react";
import { dataApi } from "@/lib/data";
import { Card } from "@/components/ui";

const PRESETS = ["カウンター空きました！", "牡蠣が入荷しました🦪", "今なら待ち時間ゼロ", "ラスト1卓です"];

// #B 店主のライブひとこと（店舗側エディタ）。保存するとユーザー側に即反映。
export function MerchantMessageCard({ storeId }: { storeId: string }) {
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    dataApi.getStoreMessage(storeId).then((m) => setMessage(m?.message ?? ""));
  }, [storeId]);

  async function save(text: string) {
    setMessage(text);
    await dataApi.setStoreMessage(storeId, text);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <Card className="p-4">
      <p className="mb-2 text-sm font-semibold text-sub">📣 今のひとこと（お客様に即表示）</p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        placeholder="例: カウンター空きました！"
        className="w-full rounded-md border border-line p-2 text-sm"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => save(p)}
            className="rounded-full border border-line px-3 py-1 text-xs text-sub active:scale-95"
          >
            {p}
          </button>
        ))}
      </div>
      <button
        onClick={() => save(message)}
        className="mt-3 h-10 w-full rounded-full bg-navy text-sm font-bold text-white active:scale-[0.99]"
      >
        {saved ? "✓ 反映しました" : "ひとことを反映する"}
      </button>
      {message && (
        <button
          onClick={() => save("")}
          className="mt-2 w-full text-center text-xs text-muted"
        >
          ひとことを消す
        </button>
      )}
    </Card>
  );
}
