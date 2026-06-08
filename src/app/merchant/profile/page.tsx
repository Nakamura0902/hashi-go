"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dataApi } from "@/lib/data";
import { getMerchantStoreId, setMerchantStoreId } from "@/lib/session";
import type { Store } from "@/lib/types";
import { MerchantNav } from "@/components/nav/MerchantNav";
import { Header, Screen, Card, BigButton, SectionLabel, Spinner, Tag } from "@/components/ui";

export default function MerchantProfilePage() {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState(0);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    dataApi.getMerchantDashboard(getMerchantStoreId()).then((d) => {
      if (!d) return;
      setStore(d.store);
      setName(d.store.name);
      setDescription(d.store.description);
      setBudget(d.store.averageBudget);
      setPhone(d.store.phone);
      setAddress(d.store.address);
    });
  }, []);

  async function save() {
    if (!store) return;
    await dataApi.updateStoreProfile(store.id, {
      name,
      description,
      averageBudget: budget,
      phone,
      address,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function logout() {
    setMerchantStoreId("");
    router.push("/merchant/login");
  }

  if (!store)
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner className="border-primary/30 border-t-primary" />
      </div>
    );

  return (
    <Screen>
      <Header title="店舗情報の設定" />
      <div className="space-y-4 px-4 py-4">
        <Card className="space-y-4 p-5">
          <Field label="店舗名">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </Field>
          <Field label="紹介文">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input resize-none py-2"
            />
          </Field>
          <Field label="客単価目安（円）">
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label="電話番号">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
          </Field>
          <Field label="住所">
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="input" />
          </Field>
        </Card>

        {/* 雰囲気タグ（表示のみ・MVP） */}
        <Card className="p-4">
          <SectionLabel>雰囲気タグ</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {store.moods.map((m) => (
              <Tag key={m}>{m}</Tag>
            ))}
          </div>
        </Card>

        <BigButton onClick={save}>保存する</BigButton>
        <button onClick={logout} className="w-full py-2 text-center text-sm text-muted">
          ログアウト
        </button>
      </div>

      {saved && (
        <div className="animate-card-in fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-seat-open px-5 py-2 text-sm font-bold text-white shadow-card">
          ✓ 保存しました
        </div>
      )}

      <style jsx global>{`
        .input {
          height: 48px;
          width: 100%;
          border-radius: 12px;
          border: 1px solid #e8e4df;
          padding-left: 12px;
          padding-right: 12px;
          font-size: 14px;
        }
        textarea.input {
          height: auto;
        }
      `}</style>

      <MerchantNav />
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}
