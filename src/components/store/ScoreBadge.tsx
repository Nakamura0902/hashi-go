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
        <div className="flex items-end gap-1.5">
          <span className="text-[40px] font-extrabold leading-none text-primary">{score}</span>
          <span className="mb-1.5 text-sm text-muted">/100</span>
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
    <div className="shrink-0 text-right leading-none">
      <div className="inline-flex items-baseline gap-0.5 rounded-full bg-primary px-2.5 py-1">
        <span className="text-sm font-bold text-white">{score}</span>
        <span className="text-[10px] font-medium text-white/70">pt</span>
      </div>
      <p className="mt-1 text-[10px] text-muted">スコア</p>
    </div>
  );
}
