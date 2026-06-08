"use client";

// Supabase実装。NEXT_PUBLIC_SUPABASE_* が設定されたとき使われる。
// 行(snake_case) ⇄ アプリ型(camelCase) を変換。データが空ならモックにフォールバック。

import { getSupabaseBrowserClient } from "../supabase/client";
import { mockApi } from "./mock";
import { scoreStore } from "../score";
import { computeAnalytics } from "../analytics";
import { computeStats } from "../badges";
import type {
  AdminAnalytics,
  Group,
  GroupCandidate,
  MerchantDashboard,
  Offer,
  Review,
  ReviewSummary,
  ScoredStore,
  SearchParams,
  SeatAvailability,
  SeatStatus,
  SortKey,
  Store,
  StoreMessage,
  UserStats,
  Visit,
} from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function rowToStore(row: any): Store {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    description: row.description ?? "",
    address: row.address ?? "",
    nearestStation: row.nearest_station ?? "",
    lat: Number(row.latitude),
    lng: Number(row.longitude),
    phone: row.phone ?? "",
    averageBudget: Number(row.average_budget ?? 0),
    openTime: row.open_time ?? "",
    closeTime: row.close_time ?? "",
    isActive: Boolean(row.is_active),
    isLateNight: Boolean(row.is_late_night),
    images: row.images ?? [],
    moods: row.moods ?? [],
    purposes: row.purposes ?? [],
    features: row.features ?? [],
    createdAt: row.created_at,
  };
}

function rowToSeat(row: any): SeatStatus {
  return {
    storeId: row.store_id,
    availability: row.available_status,
    table2: { free: row.table2_free ?? 0, total: row.table2_total ?? 0 },
    table4: { free: row.table4_free ?? 0, total: row.table4_total ?? 0 },
    counter: { free: row.counter_free ?? 0, total: row.counter_total ?? 0 },
    totalGroupCapacity: row.total_group_capacity ?? 0,
    updatedAt: row.updated_at,
  };
}

function rowToVisit(row: any): Visit {
  return {
    id: row.id,
    userId: row.user_id,
    storeId: row.store_id,
    storeName: row.store_name ?? "",
    status: row.status,
    plannedAt: row.planned_at,
    checkedInAt: row.checked_in_at,
    scoreAtSelection: row.score_at_selection ?? 0,
    qrToken: row.qr_token ?? "",
    etaMin: row.eta_min ?? 0,
  };
}

async function loadAll() {
  const sb = getSupabaseBrowserClient();
  if (!sb) return null;
  const [stores, seats, offers] = await Promise.all([
    sb.from("stores").select("*"),
    sb.from("store_seat_status").select("*"),
    sb.from("store_offers").select("*"),
  ]);
  return {
    stores: (stores.data ?? []).map(rowToStore),
    seats: (seats.data ?? []).map(rowToSeat),
    offers: (offers.data ?? []) as Offer[],
  };
}

function toScored(
  store: Store,
  params: SearchParams,
  seats: SeatStatus[],
  offers: Offer[]
): ScoredStore {
  const seat =
    seats.find((s) => s.storeId === store.id) ??
    ({
      storeId: store.id,
      availability: "closed" as SeatAvailability,
      table2: { free: 0, total: 0 },
      table4: { free: 0, total: 0 },
      counter: { free: 0, total: 0 },
      totalGroupCapacity: 0,
      updatedAt: new Date().toISOString(),
    } as SeatStatus);
  const storeOffers = offers.filter((o) => o.storeId === store.id);
  const r = scoreStore(store, seat, storeOffers, params);
  return {
    store,
    seat,
    offers: storeOffers,
    distanceM: r.distanceM,
    walkMin: r.walkMin,
    score: r.score,
    reasons: r.reasons,
  };
}

export const supabaseApi = {
  async searchStores(params: SearchParams, sort: SortKey = "score") {
    const all = await loadAll();
    if (!all || all.stores.length === 0) return mockApi.searchStores(params, sort);
    const list = all.stores
      .filter((s) => s.isActive)
      .map((s) => toScored(s, params, all.seats, all.offers));
    if (sort === "distance") return list.sort((a, b) => a.distanceM - b.distanceM);
    if (sort === "budget")
      return list.sort((a, b) => a.store.averageBudget - b.store.averageBudget);
    if (sort === "seats")
      return list.sort((a, b) => b.seat.totalGroupCapacity - a.seat.totalGroupCapacity);
    return list.sort((a, b) => b.score - a.score);
  },

  async getScoredStore(id: string, params?: SearchParams) {
    const all = await loadAll();
    if (!all) return mockApi.getScoredStore(id, params);
    const store = all.stores.find((s) => s.id === id);
    if (!store) return mockApi.getScoredStore(id, params);
    const p =
      params ?? { lat: store.lat, lng: store.lng, peopleCount: 2, budget: 0, moods: [], purpose: null };
    return toScored(store, p, all.seats, all.offers);
  },

  async listFavorites(userId: string): Promise<ScoredStore[]> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.listFavorites(userId);
    const { data } = await sb.from("favorites").select("store_id").eq("user_id", userId);
    const ids = (data ?? []).map((r: any) => r.store_id);
    const all = await loadAll();
    if (!all) return [];
    return all.stores
      .filter((s) => ids.includes(s.id))
      .map((s) =>
        toScored(s, { lat: s.lat, lng: s.lng, peopleCount: 2, budget: 0, moods: [], purpose: null }, all.seats, all.offers)
      );
  },

  async isFavorite(userId: string, storeId: string): Promise<boolean> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.isFavorite(userId, storeId);
    const { data } = await sb
      .from("favorites")
      .select("store_id")
      .eq("user_id", userId)
      .eq("store_id", storeId)
      .maybeSingle();
    return Boolean(data);
  },

  async toggleFavorite(userId: string, storeId: string): Promise<boolean> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.toggleFavorite(userId, storeId);
    const on = await this.isFavorite(userId, storeId);
    if (on) {
      await sb.from("favorites").delete().eq("user_id", userId).eq("store_id", storeId);
      return false;
    }
    await sb.from("favorites").insert({ user_id: userId, store_id: storeId });
    return true;
  },

  async createVisit(input: {
    userId: string;
    store: Store;
    score: number;
    etaMin?: number;
  }): Promise<Visit> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.createVisit(input);
    const qrToken = "qr-" + Math.random().toString(36).slice(2, 10);
    const { data } = await sb
      .from("visits")
      .insert({
        user_id: input.userId,
        store_id: input.store.id,
        store_name: input.store.name,
        status: "planned",
        planned_at: new Date().toISOString(),
        score_at_selection: input.score,
        qr_token: qrToken,
        eta_min: input.etaMin ?? 0,
      })
      .select("*")
      .single();
    return rowToVisit(data);
  },

  async getVisit(id: string): Promise<Visit | null> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.getVisit(id);
    const { data } = await sb.from("visits").select("*").eq("id", id).maybeSingle();
    return data ? rowToVisit(data) : null;
  },

  async listVisits(userId: string): Promise<Visit[]> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.listVisits(userId);
    const { data } = await sb
      .from("visits")
      .select("*")
      .eq("user_id", userId)
      .order("planned_at", { ascending: false });
    return (data ?? []).map(rowToVisit);
  },

  async checkinByToken(token: string): Promise<Visit | null> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.checkinByToken(token);
    const { data } = await sb
      .from("visits")
      .update({ status: "checked_in", checked_in_at: new Date().toISOString() })
      .eq("qr_token", token)
      .select("*")
      .maybeSingle();
    return data ? rowToVisit(data) : null;
  },

  async getMerchantDashboard(storeId: string): Promise<MerchantDashboard | null> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.getMerchantDashboard(storeId);
    const all = await loadAll();
    const store = all?.stores.find((s) => s.id === storeId);
    if (!store) return mockApi.getMerchantDashboard(storeId);
    const visits = await this.listMerchantVisits(storeId);
    const today = new Date().toISOString().slice(0, 10);
    return {
      store,
      seat: all!.seats.find((s) => s.storeId === storeId)!,
      todayVisits: visits.filter((v) => v.plannedAt.slice(0, 10) === today).length,
      plannedVisits: visits.filter((v) => v.status === "planned").length,
      recentVisits: visits.slice(0, 10),
    };
  },

  async updateSeatAvailability(storeId: string, availability: SeatAvailability) {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.updateSeatAvailability(storeId, availability);
    await sb
      .from("store_seat_status")
      .update({ available_status: availability, updated_at: new Date().toISOString() })
      .eq("store_id", storeId);
  },

  async updateSeats(
    storeId: string,
    seats: Pick<SeatStatus, "table2" | "table4" | "counter" | "totalGroupCapacity">
  ) {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.updateSeats(storeId, seats);
    await sb
      .from("store_seat_status")
      .update({
        table2_free: seats.table2.free,
        table2_total: seats.table2.total,
        table4_free: seats.table4.free,
        table4_total: seats.table4.total,
        counter_free: seats.counter.free,
        counter_total: seats.counter.total,
        total_group_capacity: seats.totalGroupCapacity,
        updated_at: new Date().toISOString(),
      })
      .eq("store_id", storeId);
  },

  async listOffers(storeId: string): Promise<Offer[]> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.listOffers(storeId);
    const { data } = await sb.from("store_offers").select("*").eq("store_id", storeId);
    return (data ?? []) as Offer[];
  },

  async upsertOffer(offer: Offer) {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.upsertOffer(offer);
    await sb.from("store_offers").upsert({
      id: offer.id,
      store_id: offer.storeId,
      title: offer.title,
      description: offer.description,
      is_active: offer.isActive,
    });
  },

  async listMerchantVisits(storeId: string): Promise<Visit[]> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.listMerchantVisits(storeId);
    const { data } = await sb
      .from("visits")
      .select("*")
      .eq("store_id", storeId)
      .order("planned_at", { ascending: false });
    return (data ?? []).map(rowToVisit);
  },

  async adminListStores(): Promise<Store[]> {
    const all = await loadAll();
    if (!all || all.stores.length === 0) return mockApi.adminListStores();
    return all.stores;
  },

  async setStoreActive(storeId: string, active: boolean) {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.setStoreActive(storeId, active);
    await sb.from("stores").update({ is_active: active }).eq("id", storeId);
  },

  async updateStoreProfile(
    storeId: string,
    patch: Partial<
      Pick<Store, "name" | "description" | "averageBudget" | "phone" | "address">
    >
  ) {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.updateStoreProfile(storeId, patch);
    await sb
      .from("stores")
      .update({
        name: patch.name,
        description: patch.description,
        average_budget: patch.averageBudget,
        phone: patch.phone,
        address: patch.address,
      })
      .eq("id", storeId);
  },

  async adminAnalytics(): Promise<AdminAnalytics> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.adminAnalytics();
    const [storesRes, visitsRes] = await Promise.all([
      sb.from("stores").select("*"),
      sb.from("visits").select("*"),
    ]);
    const stores = (storesRes.data ?? []).map(rowToStore);
    const visits = (visitsRes.data ?? []).map(rowToVisit);
    return computeAnalytics(stores, visits);
  },

  async getUserStats(userId: string): Promise<UserStats> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.getUserStats(userId);
    const [visitsRes, storesRes] = await Promise.all([
      sb.from("visits").select("*").eq("user_id", userId),
      sb.from("stores").select("*"),
    ]);
    return computeStats((visitsRes.data ?? []).map(rowToVisit), (storesRes.data ?? []).map(rowToStore));
  },

  async createGroup(id: string, name: string): Promise<Group> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.createGroup(id, name);
    const { data } = await sb.from("groups").upsert({ id, name }).select("*").single();
    return { id: data.id, name: data.name ?? "", createdAt: data.created_at };
  },

  async getGroup(id: string): Promise<Group | null> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.getGroup(id);
    const { data } = await sb.from("groups").select("*").eq("id", id).maybeSingle();
    return data ? { id: data.id, name: data.name ?? "", createdAt: data.created_at } : null;
  },

  async listGroupCandidates(groupId: string): Promise<GroupCandidate[]> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.listGroupCandidates(groupId);
    const [candRes, voteRes] = await Promise.all([
      sb.from("group_candidates").select("*").eq("group_id", groupId),
      sb.from("group_votes").select("store_id").eq("group_id", groupId),
    ]);
    const votes = voteRes.data ?? [];
    return (candRes.data ?? [])
      .map((c: any) => ({
        id: c.id,
        groupId: c.group_id,
        storeId: c.store_id,
        storeName: c.store_name ?? "",
        addedBy: c.added_by ?? "",
        votes: votes.filter((v: any) => v.store_id === c.store_id).length,
      }))
      .sort((a, b) => b.votes - a.votes);
  },

  async addGroupCandidate(
    groupId: string,
    storeId: string,
    storeName: string,
    addedBy: string
  ): Promise<void> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.addGroupCandidate(groupId, storeId, storeName, addedBy);
    await sb.from("group_candidates").upsert(
      { id: `${groupId}-${storeId}`, group_id: groupId, store_id: storeId, store_name: storeName, added_by: addedBy },
      { onConflict: "id" }
    );
  },

  async voteGroupCandidate(groupId: string, storeId: string, userId: string): Promise<void> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.voteGroupCandidate(groupId, storeId, userId);
    const { data } = await sb
      .from("group_votes")
      .select("user_id")
      .eq("group_id", groupId)
      .eq("store_id", storeId)
      .eq("user_id", userId)
      .maybeSingle();
    if (data) {
      await sb.from("group_votes").delete().eq("group_id", groupId).eq("store_id", storeId).eq("user_id", userId);
    } else {
      await sb.from("group_votes").insert({ group_id: groupId, store_id: storeId, user_id: userId });
    }
  },

  async listMyGroupVotes(groupId: string, userId: string): Promise<string[]> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.listMyGroupVotes(groupId, userId);
    const { data } = await sb
      .from("group_votes")
      .select("store_id")
      .eq("group_id", groupId)
      .eq("user_id", userId);
    return (data ?? []).map((v: any) => v.store_id);
  },

  // ── レビュー＆評価 ──
  async listReviews(storeId: string): Promise<ReviewSummary> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.listReviews(storeId);
    const { data } = await sb
      .from("reviews")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    const items: Review[] = (data ?? []).map((r: any) => ({
      id: r.id,
      storeId: r.store_id,
      userId: r.user_id,
      rating: r.rating,
      comment: r.comment ?? "",
      createdAt: r.created_at,
    }));
    const count = items.length;
    const avg = count === 0 ? 0 : items.reduce((s, r) => s + r.rating, 0) / count;
    return { avg: Math.round(avg * 10) / 10, count, items };
  },

  async addReview(
    storeId: string,
    userId: string,
    rating: number,
    comment: string
  ): Promise<void> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.addReview(storeId, userId, rating, comment);
    await sb.from("reviews").insert({
      id: "rv" + Date.now(),
      store_id: storeId,
      user_id: userId,
      rating,
      comment,
    });
  },

  // ── 店主のライブひとこと ──
  async getStoreMessage(storeId: string): Promise<StoreMessage | null> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.getStoreMessage(storeId);
    const { data } = await sb
      .from("store_messages")
      .select("*")
      .eq("store_id", storeId)
      .maybeSingle();
    return data
      ? { storeId: data.store_id, message: data.message ?? "", updatedAt: data.updated_at }
      : null;
  },

  async setStoreMessage(storeId: string, message: string): Promise<void> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.setStoreMessage(storeId, message);
    await sb
      .from("store_messages")
      .upsert({ store_id: storeId, message, updated_at: new Date().toISOString() });
  },

  // ── #C 社会的証明: 直近の来店予定数（RPC: 件数のみ） ──
  async getIncomingCount(storeId: string): Promise<number> {
    const sb = getSupabaseBrowserClient();
    if (!sb) return mockApi.getIncomingCount(storeId);
    const { data, error } = await sb.rpc("incoming_count", { p_store: storeId });
    if (error) return 0;
    return (data as number) ?? 0;
  },
};
