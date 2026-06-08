"use client";

// Supabase Realtime の購読ヘルパー。
// Supabase未設定（モックモード）では何もしない no-op を返す。

import { getSupabaseBrowserClient } from "./supabase/client";
import type { Visit } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

// 空席状況の変更を購読（一覧・地図のライブ更新用）
export function subscribeSeatStatus(onChange: () => void): () => void {
  const sb = getSupabaseBrowserClient();
  if (!sb) return () => {};
  const ch = sb
    .channel("rt-seat-status")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "store_seat_status" },
      () => onChange()
    )
    .subscribe();
  return () => {
    sb.removeChannel(ch);
  };
}

// グループの候補・投票の変化を購読（みんなで決める画面のライブ更新）
export function subscribeGroup(groupId: string, onChange: () => void): () => void {
  const sb = getSupabaseBrowserClient();
  if (!sb || !groupId) return () => {};
  const ch = sb
    .channel("rt-group-" + groupId)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "group_candidates", filter: `group_id=eq.${groupId}` },
      () => onChange()
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "group_votes", filter: `group_id=eq.${groupId}` },
      () => onChange()
    )
    .subscribe();
  return () => {
    sb.removeChannel(ch);
  };
}

// 店主のライブひとことの変化を購読（店舗詳細でリアルタイム表示）
export function subscribeStoreMessage(storeId: string, onChange: () => void): () => void {
  const sb = getSupabaseBrowserClient();
  if (!sb || !storeId) return () => {};
  const ch = sb
    .channel("rt-store-msg-" + storeId)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "store_messages", filter: `store_id=eq.${storeId}` },
      () => onChange()
    )
    .subscribe();
  return () => {
    sb.removeChannel(ch);
  };
}

// 自店舗への新規来店(送客)を購読（店舗ダッシュの通知用）
export function subscribeStoreVisits(
  storeId: string,
  onInsert: (visit: Partial<Visit>) => void
): () => void {
  const sb = getSupabaseBrowserClient();
  if (!sb || !storeId) return () => {};
  const ch = sb
    .channel("rt-visits-" + storeId)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "visits",
        filter: `store_id=eq.${storeId}`,
      },
      (payload: any) => {
        const r = payload.new ?? {};
        onInsert({
          id: r.id,
          storeId: r.store_id,
          storeName: r.store_name,
          status: r.status,
          plannedAt: r.planned_at,
          scoreAtSelection: r.score_at_selection,
        });
      }
    )
    .subscribe();
  return () => {
    sb.removeChannel(ch);
  };
}
