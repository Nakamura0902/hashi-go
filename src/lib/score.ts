// はしごスコア算出（0〜100点）
// 要件 §8 の配点を定数化。将来「集客優先度」等の重み追加を容易にするため関数化。

import type { Offer, SearchParams, SeatStatus, Store } from "./types";
import { haversineM, walkMinutes } from "./geo";

// 配点（保守しやすいよう一箇所に集約）
export const SCORE_WEIGHTS = {
  seatOpen: 20, // 空席あり（すぐ案内可）
  walkClose: 20, // 徒歩5分以内
  peopleFit: 15, // 人数ぴったり
  budgetFit: 15, // 予算一致
  moodFit: 10, // 雰囲気一致
  purposeFit: 10, // 目的一致
  hasOffer: 5, // 特典あり
  lateNight: 5, // 深夜営業
  vacancyBoost: 8, // 送客最適化: 空席が多い店ほど露出を上げる（店舗側の集客優先度）
} as const;

// 空席率（空き/総席）。送客最適化のブーストに使う。
export function vacancyRatio(seat: {
  table2: { free: number; total: number };
  table4: { free: number; total: number };
  counter: { free: number; total: number };
}): number {
  const free = seat.table2.free + seat.table4.free + seat.counter.free;
  const total = seat.table2.total + seat.table4.total + seat.counter.total;
  return total === 0 ? 0 : free / total;
}

export type ScoreResult = {
  score: number;
  distanceM: number;
  walkMin: number;
  reasons: string[];
};

// 目的→雰囲気の相性（目的一致の簡易判定に使う）
const PURPOSE_MOOD_HINT: Record<string, string[]> = {
  まだ飲みたい: ["にぎやか", "大衆酒場"],
  安く飲み直したい: ["大衆酒場"],
  しっぽり話したい: ["落ち着いた", "和モダン"],
  終電まで軽く: ["大衆酒場", "落ち着いた"],
  深夜まで: ["にぎやか", "大衆酒場"],
  締めごはん: ["大衆酒場", "和モダン"],
};

export function scoreStore(
  store: Store,
  seat: SeatStatus,
  offers: Offer[],
  params: SearchParams
): ScoreResult {
  const distanceM = haversineM(params, store);
  const walkMin = walkMinutes(distanceM);
  const reasons: string[] = [];
  let score = 0;

  // 空席あり（open / few は加点、soonは半分）
  if (seat.availability === "open") {
    score += SCORE_WEIGHTS.seatOpen;
    reasons.push("✅ すぐ入れる");
  } else if (seat.availability === "few") {
    score += SCORE_WEIGHTS.seatOpen * 0.6;
    reasons.push("⏳ 残りわずか");
  } else if (seat.availability === "soon") {
    score += SCORE_WEIGHTS.seatOpen * 0.3;
  }

  // 徒歩5分以内
  if (walkMin <= 5) {
    score += SCORE_WEIGHTS.walkClose;
    reasons.push("📍 近い");
  } else if (walkMin <= 8) {
    score += SCORE_WEIGHTS.walkClose * 0.5;
  }

  // 人数適合（受入可能人数 >= 希望人数）
  if (seat.totalGroupCapacity >= params.peopleCount) {
    score += SCORE_WEIGHTS.peopleFit;
    reasons.push("👥 人数OK");
  } else {
    score += SCORE_WEIGHTS.peopleFit * 0.3;
  }

  // 予算一致（制限なし=満点、上限以内=満点、少し超過=部分点）
  if (params.budget === 0 || store.averageBudget <= params.budget) {
    score += SCORE_WEIGHTS.budgetFit;
    reasons.push("💰 予算ぴったり");
  } else if (store.averageBudget <= params.budget * 1.2) {
    score += SCORE_WEIGHTS.budgetFit * 0.5;
  }

  // 雰囲気一致
  if (params.moods.length === 0) {
    score += SCORE_WEIGHTS.moodFit * 0.5;
  } else if (params.moods.some((m) => store.moods.includes(m))) {
    score += SCORE_WEIGHTS.moodFit;
    reasons.push("🎯 雰囲気が合う");
  }

  // 目的一致
  if (params.purpose) {
    if (store.purposes.includes(params.purpose)) {
      score += SCORE_WEIGHTS.purposeFit;
      reasons.push("✨ 目的に合う");
    } else {
      const hints = PURPOSE_MOOD_HINT[params.purpose] ?? [];
      if (hints.some((h) => store.moods.includes(h as never))) {
        score += SCORE_WEIGHTS.purposeFit * 0.5;
      }
    }
  } else {
    score += SCORE_WEIGHTS.purposeFit * 0.5;
  }

  // 特典あり
  if (offers.some((o) => o.isActive)) {
    score += SCORE_WEIGHTS.hasOffer;
    reasons.push("🎁 特典あり");
  }

  // 深夜営業
  if (store.isLateNight) {
    score += SCORE_WEIGHTS.lateNight;
    reasons.push("🌙 深夜OK");
  }

  // 送客最適化: 案内可能な店で空席率が高いほど少しブースト（埋めたい店を後押し）
  if (seat.availability === "open" || seat.availability === "few") {
    const ratio = vacancyRatio(seat);
    score += SCORE_WEIGHTS.vacancyBoost * ratio;
    if (ratio >= 0.6) reasons.push("🪑 たっぷり空席");
  }

  return {
    score: Math.min(100, Math.round(score)),
    distanceM,
    walkMin,
    reasons,
  };
}
