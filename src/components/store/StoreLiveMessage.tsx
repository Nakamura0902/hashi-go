"use client";

import { useEffect, useState } from "react";
import { dataApi } from "@/lib/data";
import { subscribeStoreMessage } from "@/lib/realtime";
import type { StoreMessage } from "@/lib/types";

// #B 店主のライブひとこと（ユーザー側・リアルタイム表示）
export function StoreLiveMessage({ storeId }: { storeId: string }) {
  const [msg, setMsg] = useState<StoreMessage | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => dataApi.getStoreMessage(storeId).then((m) => active && setMsg(m));
    load();
    const unsub = subscribeStoreMessage(storeId, load);
    return () => {
      active = false;
      unsub();
    };
  }, [storeId]);

  if (!msg || !msg.message) return null;

  return (
    <div className="mx-4 mt-4 flex items-start gap-2 rounded-md border border-primary/30 bg-[#FFF7ED] p-3">
      <span className="text-lg">📣</span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-primary-dark">店主からのひとこと</p>
        <p className="text-sm text-ink">{msg.message}</p>
      </div>
    </div>
  );
}
