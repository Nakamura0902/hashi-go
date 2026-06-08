// はしごスコア表示。compact=カード右上、large=詳細ブロック

export function ScoreBadge({
  score,
  size = "compact",
}: {
  score: number;
  size?: "compact" | "large";
}) {
  if (size === "large") {
    return (
      <div>
        <div className="flex items-end gap-1">
          <span className="text-2xl">🔥</span>
          <span className="text-[40px] font-extrabold leading-none text-primary">{score}</span>
          <span className="mb-1 text-sm text-muted">/100</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="text-right leading-none">
      <div className="flex items-center justify-end gap-0.5">
        <span className="text-base">🔥</span>
        <span className="text-[17px] font-bold text-primary">{score}</span>
      </div>
      <p className="mt-0.5 text-[10px] text-muted">スコア</p>
    </div>
  );
}
