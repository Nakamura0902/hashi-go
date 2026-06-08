"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/lib/store";
import { reverseGeocode } from "@/lib/geocode";
import type { Mood, Purpose } from "@/lib/types";
import { BottomNav } from "@/components/nav/BottomNav";
import { Screen, Card, SectionLabel, BigButton, Chip } from "@/components/ui";
import {
  IconSearch,
  IconTarget,
  IconPlus,
  IconMinus,
  IconCheck,
  IconLantern,
} from "@/components/ui/icons";

const BUDGETS: { label: string; value: number }[] = [
  { label: "〜1,000円", value: 1000 },
  { label: "〜1,500円", value: 1500 },
  { label: "〜2,000円", value: 2000 },
  { label: "〜3,000円", value: 3000 },
  { label: "〜5,000円", value: 5000 },
  { label: "制限なし", value: 0 },
];

const MOODS: { label: Mood; emoji: string }[] = [
  { label: "にぎやか", emoji: "🍻" },
  { label: "落ち着いた", emoji: "🕯️" },
  { label: "おしゃれ", emoji: "✨" },
  { label: "大衆酒場", emoji: "🏮" },
  { label: "和モダン", emoji: "🍵" },
];

const PURPOSES: { label: Purpose; emoji: string }[] = [
  { label: "まだ飲みたい", emoji: "🍶" },
  { label: "安く飲み直したい", emoji: "💰" },
  { label: "しっぽり話したい", emoji: "💬" },
  { label: "終電まで軽く", emoji: "🚃" },
  { label: "深夜まで", emoji: "🌙" },
  { label: "締めごはん", emoji: "🍜" },
];

// 主要な飲み屋エリア（正確な座標。手入力ジオコーディングより確実）
const AREAS: { label: string; lat: number; lng: number }[] = [
  { label: "千歳", lat: 42.8206, lng: 141.6527 },
  { label: "新宿", lat: 35.6900, lng: 139.7004 },
  { label: "渋谷", lat: 35.6580, lng: 139.7016 },
  { label: "池袋", lat: 35.7295, lng: 139.7109 },
  { label: "新橋", lat: 35.6665, lng: 139.7583 },
  { label: "上野", lat: 35.7141, lng: 139.7774 },
  { label: "銀座", lat: 35.6717, lng: 139.7650 },
  { label: "六本木", lat: 35.6628, lng: 139.7314 },
];

export default function HomePage() {
  const router = useRouter();
  const s = useSearch();
  const [locating, setLocating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function useGps() {
    if (!navigator.geolocation) {
      setError("この端末では位置情報が使えません");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // 実際の現在地を取得し、地名に逆ジオコーディング
        const label = await reverseGeocode(latitude, longitude);
        s.setLocation(latitude, longitude, label);
        setEditing(false);
        setLocating(false);
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "位置情報が許可されていません。「変更」からエリアを選べます"
            : "現在地を取得できませんでした。「変更」からエリアを選べます"
        );
        setLocating(false);
      },
      // 精度より取得成功を優先（市区エリアが分かれば十分）。タイムアウトを延長。
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  }

  // エリアを選んで現在地を変更（正確な座標を設定）
  function pickArea(a: { label: string; lat: number; lng: number }) {
    s.setLocation(a.lat, a.lng, a.label);
    setEditing(false);
    setError(null);
  }

  return (
    <Screen>
      {/* A. ロゴ / キャッチコピー */}
      <div className="relative flex items-center justify-between overflow-hidden bg-navy px-4 py-5">
        {/* 微妙な温かいグロー */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
        <div>
          <h1 className="text-[28px] font-extrabold leading-none text-white">
            はし<span className="text-primary drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]">GO</span>
          </h1>
          <p className="mt-1 text-[13px] text-white/70">次、どこ行く？を10秒で。</p>
        </div>
        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
          <IconLantern size={24} className="text-primary" />
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        {/* B-1. 現在地 */}
        <Card className="p-4">
          <SectionLabel>現在地</SectionLabel>
          <button
            onClick={useGps}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-primary bg-white font-semibold text-primary shadow-[0_2px_10px_rgba(249,115,22,0.12)] active:scale-[0.99]"
          >
            <IconTarget size={20} className={locating ? "animate-spin" : ""} />
            {locating ? "取得中..." : "現在地を使う"}
          </button>

          {/* 現在の地点表示 ＋ 変更 */}
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-sm font-semibold text-ink">📍 {s.locationLabel}</span>
            <button
              onClick={() => {
                setEditing((v) => !v);
                setError(null);
              }}
              className="text-xs font-bold text-primary underline"
            >
              {editing ? "閉じる" : "変更"}
            </button>
          </div>

          {/* エリアを選んで変更 */}
          {editing && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs text-muted">エリアを選ぶ</p>
              <div className="grid grid-cols-4 gap-2">
                {AREAS.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => pickArea(a)}
                    className={`h-9 rounded-full text-sm font-semibold transition ${
                      s.locationLabel === a.label
                        ? "bg-navy text-white"
                        : "border border-line bg-white text-sub"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="mt-2 text-center text-xs text-seat-full">{error}</p>}
        </Card>

        {/* B-2. 人数 */}
        <Card className="p-4">
          <SectionLabel>人数</SectionLabel>
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={() => s.setPeople(s.peopleCount - 1)}
              aria-label="減らす"
              className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink active:scale-95"
            >
              <IconMinus size={20} />
            </button>
            <span className="w-12 text-center text-2xl font-bold text-ink">
              {s.peopleCount}
              <span className="ml-1 text-sm font-normal text-sub">名</span>
            </span>
            <button
              onClick={() => s.setPeople(s.peopleCount + 1)}
              aria-label="増やす"
              className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink active:scale-95"
            >
              <IconPlus size={20} />
            </button>
          </div>
        </Card>

        {/* B-3. 予算 */}
        <Card className="p-4">
          <SectionLabel>予算 / 人</SectionLabel>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {BUDGETS.map((b) => (
              <Chip
                key={b.label}
                selected={s.budget === b.value}
                onClick={() => s.setBudget(b.value)}
              >
                {b.label}
              </Chip>
            ))}
          </div>
        </Card>

        {/* B-4. 雰囲気（複数選択） */}
        <Card className="p-4">
          <SectionLabel>雰囲気（複数選べます）</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {MOODS.map((m, i) => {
              const on = s.moods.includes(m.label);
              return (
                <button
                  key={m.label}
                  onClick={() => s.toggleMood(m.label)}
                  className={`flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition active:scale-[0.98] ${
                    i === MOODS.length - 1 ? "col-span-2" : ""
                  } ${on ? "bg-navy text-white shadow-sm" : "border border-line bg-white text-sub"}`}
                >
                  <span>{m.emoji}</span>
                  {m.label}
                </button>
              );
            })}
          </div>
        </Card>

        {/* B-5. 目的（単一選択） */}
        <Card className="p-4">
          <SectionLabel>今夜の目的</SectionLabel>
          <div className="space-y-2">
            {PURPOSES.map((p) => {
              const on = s.purpose === p.label;
              return (
                <button
                  key={p.label}
                  onClick={() => s.setPurpose(on ? null : p.label)}
                  className={`flex h-[52px] w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-medium transition active:scale-[0.99] ${
                    on ? "bg-navy text-white shadow-sm" : "border border-line bg-white text-ink"
                  }`}
                >
                  <span className="text-lg">{p.emoji}</span>
                  <span className="flex-1">{p.label}</span>
                  {on && <IconCheck size={20} className="text-primary" />}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* C. CTA */}
      <div className="sticky bottom-[72px] z-10 bg-gradient-to-t from-bg via-bg to-transparent px-4 pb-3 pt-2">
        <BigButton
          onClick={() => router.push("/list")}
          icon={<IconSearch size={20} />}
        >
          今すぐ探す
        </BigButton>
      </div>

      <BottomNav />
    </Screen>
  );
}
