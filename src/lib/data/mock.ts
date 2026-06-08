"use client";

// localStorage を簡易DBとして使うモック実装（go-snow踏襲）。
// ユーザーの「この店に行く」が、履歴・店舗ダッシュ・管理画面に横断的に反映される。

import { DEFAULT_CENTER } from "../config";
import {
  mockOffers,
  mockSeatStatuses,
  mockStores,
  mockVisits,
} from "../mockData";
import { scoreStore } from "../score";
import { computeAnalytics } from "../analytics";
import { computeStats } from "../badges";
import { haversineM, walkMinutes } from "../geo";
import type {
  AdminAnalytics,
  Favorite,
  Group,
  GroupCandidate,
  GroupVote,
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

const K = {
  stores: "hashigo-stores",
  seats: "hashigo-seats",
  offers: "hashigo-offers",
  favorites: "hashigo-favorites",
  visits: "hashigo-visits",
  groups: "hashigo-groups",
  groupCandidates: "hashigo-group-candidates",
  groupVotes: "hashigo-group-votes",
  reviews: "hashigo-reviews",
  storeMessages: "hashigo-store-messages",
};

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, seed: T[]): T[] {
  if (!isBrowser()) return [...seed];
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    window.localStorage.setItem(key, JSON.stringify(seed));
    return [...seed];
  }
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [...seed];
  }
}

function write<T>(key: string, list: T[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(list));
}

const getStores = () => read<Store>(K.stores, mockStores);
const getSeats = () => read<SeatStatus>(K.seats, mockSeatStatuses);
const getOffers = () => read<Offer>(K.offers, mockOffers);
const getFavorites = () => read<Favorite>(K.favorites, []);
const getVisits = () => read<Visit>(K.visits, mockVisits);

// デフォルトの検索条件（詳細直リンクなどでparamsが無いとき）
const defaultParams = (): SearchParams => ({
  lat: DEFAULT_CENTER[1],
  lng: DEFAULT_CENTER[0],
  peopleCount: 2,
  budget: 0,
  moods: [],
  purpose: null,
});

function toScored(
  store: Store,
  params: SearchParams,
  seats: SeatStatus[],
  offers: Offer[]
): ScoredStore {
  const seat =
    seats.find((s) => s.storeId === store.id) ?? {
      storeId: store.id,
      availability: "closed" as SeatAvailability,
      table2: { free: 0, total: 0 },
      table4: { free: 0, total: 0 },
      counter: { free: 0, total: 0 },
      totalGroupCapacity: 0,
      updatedAt: new Date().toISOString(),
    };
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

function sortScored(list: ScoredStore[], sort: SortKey): ScoredStore[] {
  const arr = [...list];
  switch (sort) {
    case "distance":
      return arr.sort((a, b) => a.distanceM - b.distanceM);
    case "budget":
      return arr.sort((a, b) => a.store.averageBudget - b.store.averageBudget);
    case "seats":
      return arr.sort(
        (a, b) => b.seat.totalGroupCapacity - a.seat.totalGroupCapacity
      );
    case "score":
    default:
      return arr.sort((a, b) => b.score - a.score);
  }
}

export const mockApi = {
  // ── ユーザー ──
  async searchStores(
    params: SearchParams,
    sort: SortKey = "score"
  ): Promise<ScoredStore[]> {
    const seats = getSeats();
    const offers = getOffers();
    const list = getStores()
      .filter((s) => s.isActive)
      .map((s) => toScored(s, params, seats, offers));
    return sortScored(list, sort);
  },

  async getScoredStore(
    id: string,
    params?: SearchParams
  ): Promise<ScoredStore | null> {
    const store = getStores().find((s) => s.id === id);
    if (!store) return null;
    return toScored(store, params ?? defaultParams(), getSeats(), getOffers());
  },

  // ── お気に入り ──
  async listFavorites(userId: string): Promise<ScoredStore[]> {
    const favs = getFavorites().filter((f) => f.userId === userId);
    const seats = getSeats();
    const offers = getOffers();
    const stores = getStores();
    return favs
      .map((f) => stores.find((s) => s.id === f.storeId))
      .filter((s): s is Store => Boolean(s))
      .map((s) => toScored(s, defaultParams(), seats, offers));
  },

  async isFavorite(userId: string, storeId: string): Promise<boolean> {
    return getFavorites().some(
      (f) => f.userId === userId && f.storeId === storeId
    );
  },

  async toggleFavorite(userId: string, storeId: string): Promise<boolean> {
    const list = getFavorites();
    const exists = list.some(
      (f) => f.userId === userId && f.storeId === storeId
    );
    if (exists) {
      write(
        K.favorites,
        list.filter((f) => !(f.userId === userId && f.storeId === storeId))
      );
      return false;
    }
    write(K.favorites, [
      ...list,
      { userId, storeId, createdAt: new Date().toISOString() },
    ]);
    return true;
  },

  // ── 来店 ──
  async createVisit(input: {
    userId: string;
    store: Store;
    score: number;
    etaMin?: number;
  }): Promise<Visit> {
    const list = getVisits();
    const visit: Visit = {
      id: "v" + Date.now(),
      userId: input.userId,
      storeId: input.store.id,
      storeName: input.store.name,
      status: "planned",
      plannedAt: new Date().toISOString(),
      checkedInAt: null,
      scoreAtSelection: input.score,
      qrToken: "qr-" + Math.random().toString(36).slice(2, 10),
      etaMin: input.etaMin ?? 0,
    };
    write(K.visits, [visit, ...list]);
    return visit;
  },

  async getVisit(id: string): Promise<Visit | null> {
    return getVisits().find((v) => v.id === id) ?? null;
  },

  async listVisits(userId: string): Promise<Visit[]> {
    return getVisits()
      .filter((v) => v.userId === userId)
      .sort((a, b) => (a.plannedAt < b.plannedAt ? 1 : -1));
  },

  // QRトークンでチェックイン（店舗側の読み取り or ユーザー側の確定）
  async checkinByToken(token: string): Promise<Visit | null> {
    const list = getVisits();
    let updated: Visit | null = null;
    const next = list.map((v) => {
      if (v.qrToken === token && v.status !== "checked_in") {
        updated = {
          ...v,
          status: "checked_in",
          checkedInAt: new Date().toISOString(),
        };
        return updated;
      }
      return v;
    });
    write(K.visits, next);
    return updated;
  },

  // ── 店舗側 ──
  async getMerchantDashboard(storeId: string): Promise<MerchantDashboard | null> {
    const store = getStores().find((s) => s.id === storeId);
    if (!store) return null;
    const seat =
      getSeats().find((s) => s.storeId === storeId) ??
      ({
        storeId,
        availability: "closed",
        table2: { free: 0, total: 0 },
        table4: { free: 0, total: 0 },
        counter: { free: 0, total: 0 },
        totalGroupCapacity: 0,
        updatedAt: new Date().toISOString(),
      } as SeatStatus);
    const visits = getVisits().filter((v) => v.storeId === storeId);
    const today = new Date().toISOString().slice(0, 10);
    return {
      store,
      seat,
      todayVisits: visits.filter((v) => v.plannedAt.slice(0, 10) === today)
        .length,
      plannedVisits: visits.filter((v) => v.status === "planned").length,
      recentVisits: visits
        .sort((a, b) => (a.plannedAt < b.plannedAt ? 1 : -1))
        .slice(0, 10),
    };
  },

  async updateSeatAvailability(
    storeId: string,
    availability: SeatAvailability
  ): Promise<void> {
    const list = getSeats();
    write(
      K.seats,
      list.map((s) =>
        s.storeId === storeId
          ? { ...s, availability, updatedAt: new Date().toISOString() }
          : s
      )
    );
  },

  async updateSeats(
    storeId: string,
    seats: Pick<SeatStatus, "table2" | "table4" | "counter" | "totalGroupCapacity">
  ): Promise<void> {
    const list = getSeats();
    write(
      K.seats,
      list.map((s) =>
        s.storeId === storeId
          ? { ...s, ...seats, updatedAt: new Date().toISOString() }
          : s
      )
    );
  },

  async listOffers(storeId: string): Promise<Offer[]> {
    return getOffers().filter((o) => o.storeId === storeId);
  },

  async upsertOffer(offer: Offer): Promise<void> {
    const list = getOffers();
    const exists = list.some((o) => o.id === offer.id);
    write(
      K.offers,
      exists
        ? list.map((o) => (o.id === offer.id ? offer : o))
        : [...list, offer]
    );
  },

  async listMerchantVisits(storeId: string): Promise<Visit[]> {
    return getVisits()
      .filter((v) => v.storeId === storeId)
      .sort((a, b) => (a.plannedAt < b.plannedAt ? 1 : -1));
  },

  // ── 管理者 ──
  async adminListStores(): Promise<Store[]> {
    return getStores();
  },

  async setStoreActive(storeId: string, active: boolean): Promise<void> {
    const list = getStores();
    write(
      K.stores,
      list.map((s) => (s.id === storeId ? { ...s, isActive: active } : s))
    );
  },

  // 店舗基本情報の更新（店舗側の設定画面・管理者編集で共用）
  async updateStoreProfile(
    storeId: string,
    patch: Partial<
      Pick<Store, "name" | "description" | "averageBudget" | "phone" | "address">
    >
  ): Promise<void> {
    const list = getStores();
    write(
      K.stores,
      list.map((s) => (s.id === storeId ? { ...s, ...patch } : s))
    );
  },

  async adminAnalytics(): Promise<AdminAnalytics> {
    return computeAnalytics(getStores(), getVisits());
  },

  // ── ユーザー実績（バッジ） ──
  async getUserStats(userId: string): Promise<UserStats> {
    const visits = getVisits().filter((v) => v.userId === userId);
    return computeStats(visits, getStores());
  },

  // ── グループ（合流・投票・割り勘） ──
  async createGroup(id: string, name: string): Promise<Group> {
    const list = read<Group>(K.groups, []);
    const group: Group = { id, name, createdAt: new Date().toISOString() };
    if (!list.some((g) => g.id === id)) write(K.groups, [...list, group]);
    return group;
  },

  async getGroup(id: string): Promise<Group | null> {
    return read<Group>(K.groups, []).find((g) => g.id === id) ?? null;
  },

  async listGroupCandidates(groupId: string): Promise<GroupCandidate[]> {
    const cands = read<GroupCandidate>(K.groupCandidates, []).filter(
      (c) => c.groupId === groupId
    );
    const votes = read<GroupVote>(K.groupVotes, []).filter((v) => v.groupId === groupId);
    return cands
      .map((c) => ({
        ...c,
        votes: votes.filter((v) => v.storeId === c.storeId).length,
      }))
      .sort((a, b) => b.votes - a.votes);
  },

  async addGroupCandidate(
    groupId: string,
    storeId: string,
    storeName: string,
    addedBy: string
  ): Promise<void> {
    const list = read<GroupCandidate>(K.groupCandidates, []);
    if (list.some((c) => c.groupId === groupId && c.storeId === storeId)) return;
    write(K.groupCandidates, [
      ...list,
      { id: "gc" + Date.now(), groupId, storeId, storeName, addedBy, votes: 0 },
    ]);
  },

  // 1ユーザー1票（候補へトグル投票）
  async voteGroupCandidate(
    groupId: string,
    storeId: string,
    userId: string
  ): Promise<void> {
    const list = read<GroupVote>(K.groupVotes, []);
    const exists = list.some(
      (v) => v.groupId === groupId && v.storeId === storeId && v.userId === userId
    );
    if (exists) {
      write(
        K.groupVotes,
        list.filter(
          (v) => !(v.groupId === groupId && v.storeId === storeId && v.userId === userId)
        )
      );
    } else {
      write(K.groupVotes, [...list, { groupId, storeId, userId }]);
    }
  },

  async listMyGroupVotes(groupId: string, userId: string): Promise<string[]> {
    return read<GroupVote>(K.groupVotes, [])
      .filter((v) => v.groupId === groupId && v.userId === userId)
      .map((v) => v.storeId);
  },

  // ── レビュー＆評価 ──
  async listReviews(storeId: string): Promise<ReviewSummary> {
    const items = read<Review>(K.reviews, [])
      .filter((r) => r.storeId === storeId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
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
    const list = read<Review>(K.reviews, []);
    list.push({
      id: "rv" + Date.now(),
      storeId,
      userId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    });
    write(K.reviews, list);
  },

  // ── 店主のライブひとこと ──
  async getStoreMessage(storeId: string): Promise<StoreMessage | null> {
    return read<StoreMessage>(K.storeMessages, []).find((m) => m.storeId === storeId) ?? null;
  },

  async setStoreMessage(storeId: string, message: string): Promise<void> {
    const list = read<StoreMessage>(K.storeMessages, []);
    const next: StoreMessage = { storeId, message, updatedAt: new Date().toISOString() };
    write(
      K.storeMessages,
      list.some((m) => m.storeId === storeId)
        ? list.map((m) => (m.storeId === storeId ? next : m))
        : [...list, next]
    );
  },

  // ── #C 社会的証明: 直近の来店予定数 ──
  async getIncomingCount(storeId: string): Promise<number> {
    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
    return getVisits().filter(
      (v) =>
        v.storeId === storeId &&
        v.status === "planned" &&
        new Date(v.plannedAt).getTime() > threeHoursAgo
    ).length;
  },
};

// distance/walk を外部からも使えるように（地図ピン等）
export const geoHelpers = { haversineM, walkMinutes };
