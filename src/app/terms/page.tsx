"use client";

import { Header, Screen } from "@/components/ui";

// 利用規約（ドラフト・雛形）。公開前に法務確認のうえ確定してください。
export default function TermsPage() {
  return (
    <Screen withNav={false}>
      <Header title="利用規約" back />
      <div className="space-y-4 px-4 py-5 text-sm leading-relaxed text-ink">
        <p className="text-xs text-muted">
          ※ 本文はMVP用のドラフトです。公開前に法務確認のうえ確定してください。最終更新: 2026-07-02
        </p>

        <Section n="第1条（適用）">
          本規約は、はしGO（以下「本サービス」）の提供条件および利用者と運営者の間の権利義務関係を定めるものです。利用者は本規約に同意のうえ本サービスを利用するものとします。
        </Section>
        <Section n="第2条（アカウント）">
          利用者は正確な情報でアカウントを登録し、パスワードを自己の責任で管理するものとします。アカウントの不正利用による損害の責任は利用者が負います。
        </Section>
        <Section n="第3条（位置情報）">
          本サービスは近隣店舗の提案のため、利用者の同意に基づき位置情報を取得・利用します。位置情報は検索・表示の目的にのみ使用します。
        </Section>
        <Section n="第4条（店舗情報・空席状況）">
          店舗情報および空席状況は各店舗が入力・更新するものであり、運営者はその正確性・最新性を保証しません。実際の空席・入店可否は店舗の判断によります。
        </Section>
        <Section n="第5条（禁止事項）">
          法令違反、虚偽情報の投稿、第三者への迷惑行為、本サービスの運営妨害、不正アクセス等を禁止します。
        </Section>
        <Section n="第6条（免責）">
          運営者は、本サービスの利用または利用不能により生じた損害について、当社の故意または重過失による場合を除き責任を負いません。
        </Section>
        <Section n="第7条（規約の変更）">
          運営者は必要に応じて本規約を変更できます。変更後の規約は本サービス上に表示した時点で効力を生じます。
        </Section>
        <Section n="第8条（準拠法・裁判管轄）">
          本規約は日本法に準拠し、本サービスに関する紛争は運営者所在地を管轄する裁判所を専属的合意管轄とします。
        </Section>

        <p className="pt-4 text-center text-xs text-muted">はしGO 運営</p>
      </div>
    </Screen>
  );
}

function Section({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-1 font-bold text-ink">{n}</h2>
      <p className="text-sub">{children}</p>
    </div>
  );
}
