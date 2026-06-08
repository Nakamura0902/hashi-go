"use client";

import { useCallback, useEffect, useState } from "react";
import { dataApi } from "@/lib/data";
import { subscribeGroup } from "@/lib/realtime";
import { useCurrentUserId } from "@/lib/auth";
import { hasSupabase } from "@/lib/config";
import type { GroupCandidate, ScoredStore } from "@/lib/types";
import { BottomNav } from "@/components/nav/BottomNav";
import { Header, Screen, Card, BigButton, SectionLabel } from "@/components/ui";
import { IconCheck, IconPlus } from "@/components/ui/icons";

const LS_KEY = "hashigo-active-group";
const genCode = () =>
  Array.from({ length: 4 }, () =>
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
  ).join("");

export default function GroupPage() {
  const userId = useCurrentUserId();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [candidates, setCandidates] = useState<GroupCandidate[]>([]);
  const [myVotes, setMyVotes] = useState<string[]>([]);
  const [stores, setStores] = useState<ScoredStore[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  // 割り勘
  const [bill, setBill] = useState(0);
  const [people, setPeople] = useState(4);

  // 初期化: 保存済みグループを復元＋店舗候補ロード
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (saved) setGroupId(saved);
    dataApi.searchStores(
      { lat: 35.6948, lng: 139.7036, peopleCount: 2, budget: 0, moods: [], purpose: null },
      "score"
    ).then(setStores);
  }, []);

  const reload = useCallback(async () => {
    if (!groupId) return;
    setCandidates(await dataApi.listGroupCandidates(groupId));
    if (userId) setMyVotes(await dataApi.listMyGroupVotes(groupId, userId));
  }, [groupId, userId]);

  useEffect(() => {
    if (!groupId) return;
    reload();
    return subscribeGroup(groupId, reload);
  }, [groupId, reload]);

  async function createGroup() {
    const code = genCode();
    await dataApi.createGroup(code, "はしご会");
    localStorage.setItem(LS_KEY, code);
    setGroupId(code);
  }

  async function join() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    await dataApi.createGroup(code, "はしご会"); // 無ければ作成、あれば再利用
    localStorage.setItem(LS_KEY, code);
    setGroupId(code);
  }

  function leave() {
    localStorage.removeItem(LS_KEY);
    setGroupId(null);
    setCandidates([]);
  }

  async function addCandidate(s: ScoredStore) {
    if (!groupId || !userId) return;
    await dataApi.addGroupCandidate(groupId, s.store.id, s.store.name, userId);
    setShowAdd(false);
    reload();
  }

  async function vote(storeId: string) {
    if (!groupId || !userId) return;
    await dataApi.voteGroupCandidate(groupId, storeId, userId);
    reload();
  }

  // ── 未参加: 作成 / 参加 ──
  if (!groupId) {
    return (
      <Screen>
        <Header title="みんなで決める" subtitle="グループで次の店を投票" />
        <div className="space-y-4 px-4 py-6">
          <Card className="p-5 text-center">
            <p className="text-4xl">🍻</p>
            <p className="mt-2 font-bold text-ink">グループで「どこ行く？」を解決</p>
            <p className="mt-1 text-sm text-sub">
              コードを共有して合流。候補を出し合って多数決で次の店を決めよう。
            </p>
            <div className="mt-4">
              <BigButton onClick={createGroup}>グループを作る</BigButton>
            </div>
          </Card>

          <Card className="p-5">
            <SectionLabel>コードで参加</SectionLabel>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="例: K3F9"
                maxLength={4}
                className="h-12 flex-1 rounded-md border border-line px-3 text-center text-lg font-bold uppercase tracking-widest"
              />
              <button
                onClick={join}
                className="rounded-full bg-navy px-5 text-sm font-bold text-white"
              >
                参加
              </button>
            </div>
          </Card>
          {!hasSupabase && (
            <p className="text-center text-xs text-muted">
              ※ この端末のみで動作します（実DB接続時は端末間でリアルタイム共有）
            </p>
          )}
        </div>
        <BottomNav />
      </Screen>
    );
  }

  const perPerson = people > 0 ? Math.ceil(bill / people) : 0;
  const leader = candidates[0];

  return (
    <Screen>
      <Header title="みんなで決める" back={false} subtitle={hasSupabase ? "● リアルタイム同期中" : undefined} />
      <div className="space-y-4 px-4 py-4">
        {/* 共有コード */}
        <Card className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs text-sub">グループコード（共有して合流）</p>
            <p className="text-2xl font-extrabold tracking-widest text-navy">{groupId}</p>
          </div>
          <button onClick={leave} className="text-xs text-muted underline">
            退出
          </button>
        </Card>

        {/* 候補＋投票 */}
        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-[13px] font-semibold text-sub">候補のお店（タップで投票）</p>
            <button
              onClick={() => setShowAdd((v) => !v)}
              className="flex items-center gap-1 text-xs font-bold text-primary"
            >
              <IconPlus size={14} /> お店を追加
            </button>
          </div>

          {showAdd && (
            <Card className="mb-2 max-h-60 divide-y divide-line overflow-y-auto">
              {stores.map((s) => (
                <button
                  key={s.store.id}
                  onClick={() => addCandidate(s)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
                >
                  <span className="flex-1 truncate text-sm text-ink">{s.store.name}</span>
                  <IconPlus size={16} className="text-primary" />
                </button>
              ))}
            </Card>
          )}

          {candidates.length === 0 ? (
            <Card className="p-5 text-center text-sm text-muted">
              まだ候補がありません。「お店を追加」で候補を出そう。
            </Card>
          ) : (
            <div className="space-y-2">
              {candidates.map((c, i) => {
                const voted = myVotes.includes(c.storeId);
                const isLeader = leader && c.storeId === leader.storeId && c.votes > 0;
                return (
                  <button
                    key={c.id}
                    onClick={() => vote(c.storeId)}
                    className={`flex w-full items-center gap-3 rounded-md p-3 text-left shadow-card transition active:scale-[0.99] ${isLeader ? "bg-primary-light" : "bg-white"}`}
                  >
                    <span className="text-sm font-bold text-muted">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
                      {isLeader && "👑 "}
                      {c.storeName}
                    </span>
                    <span className="text-sm font-bold text-primary">{c.votes}票</span>
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-full ${voted ? "bg-seat-open text-white" : "border border-line text-muted"}`}
                    >
                      <IconCheck size={16} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 割り勘 */}
        <div>
          <p className="mb-2 px-1 text-[13px] font-semibold text-sub">割り勘計算</p>
          <Card className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <span className="w-16 text-sm text-sub">合計</span>
              <input
                type="number"
                value={bill || ""}
                onChange={(e) => setBill(Number(e.target.value))}
                placeholder="例: 24000"
                className="h-11 flex-1 rounded-md border border-line px-3 text-right text-base"
              />
              <span className="text-sm text-sub">円</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 text-sm text-sub">人数</span>
              <input
                type="number"
                value={people || ""}
                onChange={(e) => setPeople(Number(e.target.value))}
                className="h-11 flex-1 rounded-md border border-line px-3 text-right text-base"
              />
              <span className="text-sm text-sub">人</span>
            </div>
            <div className="rounded-md bg-bg p-3 text-center">
              <span className="text-sm text-sub">1人あたり </span>
              <span className="text-2xl font-extrabold text-primary">
                {perPerson.toLocaleString()}円
              </span>
            </div>
          </Card>
        </div>
      </div>
      <BottomNav />
    </Screen>
  );
}
