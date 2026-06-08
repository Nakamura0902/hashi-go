// 距離・徒歩時間の計算

// 2点間の距離（メートル）— Haversine
export function haversineM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

// 徒歩時間（分）— 不動産表記の80m/分基準
export function walkMinutes(distanceM: number): number {
  return Math.max(1, Math.ceil(distanceM / 80));
}

// 表示用の距離フォーマット
export function formatDistance(distanceM: number): string {
  if (distanceM < 1000) return `${distanceM}m`;
  return `${(distanceM / 1000).toFixed(1)}km`;
}
