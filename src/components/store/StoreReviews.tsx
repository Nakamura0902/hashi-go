"use client";

import { useEffect, useState } from "react";
import { dataApi } from "@/lib/data";
import { useCurrentUserId } from "@/lib/auth";
import type { ReviewSummary } from "@/lib/types";

// ★表示（読み取り）
function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span style={{ fontSize: size }} className="leading-none text-primary">
      {"★★★★★".slice(0, Math.round(value))}
      <span className="text-line">{"★★★★★".slice(Math.round(value))}</span>
    </span>
  );
}

// #A レビュー＆評価（平均★・一覧・投稿フォーム）
export function StoreReviews({ storeId }: { storeId: string }) {
  const userId = useCurrentUserId();
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [open, setOpen] = useState(false);

  const load = () => dataApi.listReviews(storeId).then(setSummary);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  async function submit() {
    if (!userId || comment.trim() === "") return;
    setPosting(true);
    // 文字数制限＋trim（スパム/肥大化防止）
    const safe = comment.trim().slice(0, 300);
    const safeRating = Math.min(5, Math.max(1, Math.round(rating)));
    await dataApi.addReview(storeId, userId, safeRating, safe);
    setComment("");
    setRating(5);
    setOpen(false);
    setPosting(false);
    load();
  }

  return (
    <section className="px-4 pt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-ink">
          口コミ・評価{summary && summary.count > 0 ? `（${summary.count}件）` : ""}
        </h2>
        <button onClick={() => setOpen((v) => !v)} className="text-xs font-bold text-primary">
          {open ? "閉じる" : "口コミを書く"}
        </button>
      </div>

      {/* 平均 */}
      {summary && summary.count > 0 ? (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-2xl font-extrabold text-ink">{summary.avg.toFixed(1)}</span>
          <Stars value={summary.avg} size={18} />
        </div>
      ) : (
        <p className="mb-3 text-sm text-muted">まだ口コミがありません。最初の1件を書いてみよう。</p>
      )}

      {/* 投稿フォーム */}
      {open && (
        <div className="mb-3 rounded-md border border-line bg-white p-3">
          <div className="mb-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                aria-label={`${n}つ星`}
                className={`text-2xl leading-none ${n <= rating ? "text-primary" : "text-line"}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="雰囲気・料理・使い勝手など（300文字まで）"
            className="w-full rounded-md border border-line p-2 text-sm"
          />
          <button
            onClick={submit}
            disabled={posting || comment.trim() === ""}
            className="mt-2 h-10 w-full rounded-full bg-primary text-sm font-bold text-white disabled:opacity-40"
          >
            投稿する
          </button>
        </div>
      )}

      {/* 一覧 */}
      <div className="space-y-2">
        {summary?.items.slice(0, 5).map((r) => (
          <div key={r.id} className="rounded-md bg-white p-3 shadow-card">
            <div className="flex items-center justify-between">
              <Stars value={r.rating} />
              <span className="text-[11px] text-muted">
                {new Date(r.createdAt).toLocaleDateString("ja-JP")}
              </span>
            </div>
            {r.comment && <p className="mt-1 text-sm text-ink">{r.comment}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
