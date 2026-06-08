"use client";

// Mapbox Geocoding を使った住所⇄座標変換。
// Mapboxトークンが無いときは座標表示にフォールバックする。

import { MAPBOX_TOKEN, hasMapbox } from "./config";

// 座標 → 読みやすい地名（例: 「歌舞伎町」）
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  if (!hasMapbox) return `現在地（${lat.toFixed(3)}, ${lng.toFixed(3)}）`;
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
      `?access_token=${MAPBOX_TOKEN}&language=ja&limit=1` +
      `&types=neighborhood,locality,place,address`;
    const res = await fetch(url);
    const data = await res.json();
    const f = data.features?.[0];
    if (!f) return "現在地";
    // 「新宿区 歌舞伎町」のように地区名を優先して短く
    const ctxPlace = f.context?.find((c: { id: string; text: string }) =>
      c.id.startsWith("locality") || c.id.startsWith("place")
    )?.text;
    const main = f.text as string | undefined;
    return [ctxPlace, main].filter(Boolean).join(" ") || f.place_name || "現在地";
  } catch {
    return "現在地";
  }
}

// 住所/地名 → 座標＋表示名
export async function forwardGeocode(
  query: string
): Promise<{ lat: number; lng: number; label: string } | null> {
  if (!hasMapbox || query.trim() === "") return null;
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?access_token=${MAPBOX_TOKEN}&language=ja&country=jp&limit=1&proximity=139.70,35.69`;
    const res = await fetch(url);
    const data = await res.json();
    const f = data.features?.[0];
    if (!f?.center) return null;
    const [lng, lat] = f.center as [number, number];
    const label = (f.text as string) || (f.place_name as string) || query;
    return { lat, lng, label };
  } catch {
    return null;
  }
}
