import type { SeatAvailability } from "@/lib/types";

// 空席ステータスのバッジ（一覧カード・地図ピン・詳細で共通）
// 色だけでなくアイコン＋テキストで状態を伝える（アクセシビリティ）

const MAP: Record<
  SeatAvailability,
  { label: string; text: string; bg: string; dot: string; pulse?: boolean }
> = {
  open: { label: "すぐ案内可", text: "text-seat-open", bg: "bg-seat-openbg", dot: "bg-seat-open" },
  few: { label: "残りわずか", text: "text-seat-few", bg: "bg-seat-fewbg", dot: "bg-seat-few", pulse: true },
  soon: { label: "もうすぐ空く", text: "text-yellow-700", bg: "bg-seat-soonbg", dot: "bg-seat-soon" },
  full: { label: "満席", text: "text-seat-full", bg: "bg-seat-fullbg", dot: "bg-seat-full" },
  closed: { label: "営業時間外", text: "text-seat-closed", bg: "bg-seat-closedbg", dot: "bg-seat-closed" },
};

export function SeatBadge({
  status,
  className = "",
}: {
  status: SeatAvailability;
  className?: string;
}) {
  const s = MAP[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-semibold ${s.bg} ${s.text} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${s.pulse ? "animate-pulse" : ""}`} />
      {s.label}
    </span>
  );
}

export const seatColor = MAP;
