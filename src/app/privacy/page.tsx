"use client";

import { Header, Screen } from "@/components/ui";

// プライバシーポリシー（ドラフト・雛形）。公開前に法務確認のうえ確定してください。
export default function PrivacyPage() {
  return (
    <Screen withNav={false}>
      <Header title="プライバシーポリシー" back />
      <div className="space-y-4 px-4 py-5 text-sm leading-relaxed text-ink">
        <p className="text-xs text-muted">
          ※ 本文はMVP用のドラフトです。公開前に法務確認のうえ確定してください。最終更新: 2026-07-02
        </p>

        <Section n="1. 取得する情報">
          メールアドレス・ニックネーム等のアカウント情報、位置情報（現在地）、お気に入り・来店履歴・レビュー・グループ利用などのサービス利用情報、端末・アクセスログ情報。
        </Section>
        <Section n="2. 利用目的">
          近隣店舗の提案・地図表示、来店（送客）機能の提供、レビュー等の表示、サービス改善・分析、不正防止、お問い合わせ対応のために利用します。
        </Section>
        <Section n="3. 位置情報の取り扱い">
          位置情報は利用者の同意に基づき取得し、検索・表示の目的にのみ使用します。常時追跡は行いません。端末設定でいつでも許可を取り消せます。
        </Section>
        <Section n="4. 第三者提供・委託">
          法令に基づく場合を除き、本人の同意なく第三者へ個人情報を提供しません。データ保管・認証等のため外部サービス（Supabase・Mapbox・Vercel等）を利用します。
        </Section>
        <Section n="5. 保存期間・安全管理">
          利用目的に必要な期間保存し、不要になった情報は削除します。アクセス制御（RLS）・通信の暗号化（HTTPS）等の安全管理措置を講じます。
        </Section>
        <Section n="6. 利用者の権利">
          利用者は自己の情報の開示・訂正・削除・利用停止を請求できます。アカウント削除の申請も受け付けます。
        </Section>
        <Section n="7. お問い合わせ">
          個人情報の取り扱いに関するお問い合わせは、アプリ内のお問い合わせ窓口までご連絡ください。
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
