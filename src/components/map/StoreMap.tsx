"use client";

import dynamic from "next/dynamic";
import type { ScoredStore } from "@/lib/types";
import { hasMapbox } from "@/lib/config";
import { MockMap } from "./MockMap";

// Mapboxはクライアント専用なので動的import
const MapboxMap = dynamic(() => import("./MapboxMap").then((m) => m.MapboxMap), {
  ssr: false,
});

type Props = {
  stores: ScoredStore[];
  center: { lat: number; lng: number };
  selectedId: string | null;
  onSelect: (id: string) => void;
};

// トークンの有無で本物/モック地図を切り替える
export function StoreMap(props: Props) {
  return hasMapbox ? <MapboxMap {...props} /> : <MockMap {...props} />;
}
