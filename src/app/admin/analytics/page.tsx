"use client";

import { useEffect, useState } from "react";
import { dataApi } from "@/lib/data";
import type { AdminAnalytics } from "@/lib/types";
import { AdminNav } from "@/components/nav/AdminNav";
import { Screen, Card, Spinner } from "@/components/ui";

export default function AdminAnalyticsPage() {
  const [a, setA] = useState<AdminAnalytics | null>(null);

  useEffect(() => {
    dataApi.adminAnalytics().then(setA);
  }, []);

  if (!a)
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner className="border-primary/30 border-t-primary" />
      </div>
    );

  const maxArea = Math.max(1, ...a.byArea.map((x) => x.visits));
  const maxHour = Math.max(1, ...a.byHour.map((x) => x.visits));

  return (
    <Screen>
      <div className="bg-navy px-4 py-5 text-white">
        <p className="text-xs text-white/70">運営管理</p>
        <h1 className="mt-0.5 text-xl font-bold">分析ダッシュボード</h1>
      </div>

      <div className="space-y-4 px-4 py-4">
        {/* KPI */}
        <div className="grid grid-cols-2 gap-3">
          <Kpi label="総送客数" value={`${a.totalVisits}`} unit="組" />
          <Kpi label="来店確定" value={`${a.checkedInVisits}`} unit="組" />
          <Kpi label="成約率" value={`${a.conversionRate}`} unit="%" />
          <Kpi label="掲載店舗" value={`${a.activeStores}`} unit="店" />
        </div>

        {/* エリア別送客 */}
        <Card className="p-4">
          <p className="mb-3 text-[13px] font-semibold text-sub">エリア別 送客数</p>
          <div className="space-y-2">
            {a.byArea.map((x) => (
              <Bar key={x.area} label={x.area} value={x.visits} pct={(x.visits / maxArea) * 100} />
            ))}
          </div>
        </Card>

        {/* 時間帯別需要 */}
        <Card className="p-4">
          <p className="mb-3 text-[13px] font-semibold text-sub">時間帯別 需要</p>
          {a.byHour.length === 0 ? (
            <p className="text-center text-sm text-muted">データがありません</p>
          ) : (
            <div className="flex h-28 items-end gap-1">
              {a.byHour.map((x) => (
                <div key={x.hour} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm bg-primary"
                    style={{ height: `${(x.visits / maxHour) * 100}%`, minHeight: "4px" }}
                  />
                  <span className="text-[9px] text-muted">{x.hour}時</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 人気条件 */}
        <Card className="p-4">
          <p className="mb-3 text-[13px] font-semibold text-sub">人気の予算帯（店舗分布）</p>
          <div className="space-y-2">
            {a.popularBudgets.map((x) => (
              <Bar key={x.label} label={x.label} value={x.count} pct={(x.count / Math.max(1, ...a.popularBudgets.map((b) => b.count))) * 100} />
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <p className="mb-3 text-[13px] font-semibold text-sub">人気の雰囲気（店舗分布）</p>
          <div className="flex flex-wrap gap-2">
            {a.popularMoods.map((x) => (
              <span key={x.mood} className="rounded-full bg-navy/10 px-3 py-1.5 text-xs font-semibold text-navy">
                {x.mood} {x.count}
              </span>
            ))}
          </div>
        </Card>

        {/* #2 エリア×時間帯ヒートマップ */}
        <Card className="p-4">
          <p className="mb-1 text-[13px] font-semibold text-sub">需要ヒートマップ（エリア×時間帯）</p>
          <p className="mb-3 text-[11px] text-muted">色が濃いほど来店が多い時間帯</p>
          <Heatmap data={a.heatmap} />
        </Card>

        {/* #2 店舗別送客ランキング */}
        <Card className="p-4">
          <p className="mb-3 text-[13px] font-semibold text-sub">店舗別 送客ランキング</p>
          {a.byStore.length === 0 ? (
            <p className="text-center text-sm text-muted">データがありません</p>
          ) : (
            <div className="space-y-2">
              {a.byStore.map((s, i) => (
                <div key={s.storeId} className="flex items-center gap-2">
                  <span className="w-5 text-center text-sm font-bold text-primary">{i + 1}</span>
                  <span className="flex-1 truncate text-sm text-ink">{s.name}</span>
                  <span className="text-xs text-sub">送客{s.visits}・来店{s.checkedIn}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <AdminNav />
    </Screen>
  );
}

function Kpi({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-sub">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-navy">
        {value}
        <span className="ml-1 text-sm font-normal text-sub">{unit}</span>
      </p>
    </Card>
  );
}

// #2 ヒートマップ（夜の時間帯にフォーカス: 17時〜翌4時）
function Heatmap({ data }: { data: { area: string; hours: number[] }[] }) {
  const COLS = [17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4];
  const max = Math.max(1, ...data.flatMap((d) => d.hours));
  if (data.length === 0)
    return <p className="text-center text-sm text-muted">データがありません</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[9px]">
        <thead>
          <tr>
            <th className="w-12" />
            {COLS.map((h) => (
              <th key={h} className="p-0.5 font-normal text-muted">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.area}>
              <td className="pr-1 text-right text-[10px] text-sub">{row.area}</td>
              {COLS.map((h) => {
                const v = row.hours[h] ?? 0;
                const alpha = v === 0 ? 0 : 0.15 + (v / max) * 0.85;
                return (
                  <td key={h} className="p-0.5">
                    <div
                      className="h-5 rounded-[3px]"
                      style={{ backgroundColor: `rgba(249,115,22,${alpha})` }}
                      title={`${row.area} ${h}時: ${v}件`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Bar({ label, value, pct }: { label: string; value: number; pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-xs text-sub">{label}</span>
      <div className="h-4 flex-1 overflow-hidden rounded-full bg-bg">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 shrink-0 text-right text-xs font-semibold text-ink">{value}</span>
    </div>
  );
}
