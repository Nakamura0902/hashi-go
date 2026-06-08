"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_CENTER } from "./config";
import type { Mood, Purpose, SearchParams } from "./types";

// 検索条件を画面をまたいで保持する（ホーム→一覧→地図→詳細）。sessionStorageに永続化。
type SearchState = SearchParams & {
  locationLabel: string; // 表示用の現在地ラベル
  setLocation: (lat: number, lng: number, label: string) => void;
  setPeople: (n: number) => void;
  setBudget: (b: number) => void;
  toggleMood: (m: Mood) => void;
  setPurpose: (p: Purpose | null) => void;
  asParams: () => SearchParams;
};

const initial: SearchParams & { locationLabel: string } = {
  lat: DEFAULT_CENTER[1],
  lng: DEFAULT_CENTER[0],
  peopleCount: 2,
  budget: 0,
  moods: [],
  purpose: null,
  locationLabel: "現在地（千歳エリア）",
};

export const useSearch = create<SearchState>()(
  persist(
    (set, get) => ({
      ...initial,
      setLocation: (lat, lng, locationLabel) => set({ lat, lng, locationLabel }),
      setPeople: (peopleCount) =>
        set({ peopleCount: Math.min(20, Math.max(1, peopleCount)) }),
      setBudget: (budget) => set({ budget }),
      toggleMood: (m) =>
        set((s) => ({
          moods: s.moods.includes(m)
            ? s.moods.filter((x) => x !== m)
            : [...s.moods, m],
        })),
      setPurpose: (purpose) => set({ purpose }),
      asParams: () => {
        const s = get();
        return {
          lat: s.lat,
          lng: s.lng,
          peopleCount: s.peopleCount,
          budget: s.budget,
          moods: s.moods,
          purpose: s.purpose,
        };
      },
    }),
    {
      name: "hashigo-search",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
