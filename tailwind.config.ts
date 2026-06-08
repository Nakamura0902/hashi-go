import type { Config } from "tailwindcss";

// はしGO デザイントークン（.claude/designs/2026-06-06-hashigo-core.md §0 準拠）
// 夜の居酒屋感（オレンジ×ネイビー）だがクリーンなUI。空席は色分け。
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ブランド
        primary: {
          DEFAULT: "#F97316", // オレンジ / CTA・アクセント
          light: "#FED7AA", // バッジ背景・ホバー
          dark: "#C2410C", // プレス状態
        },
        navy: {
          DEFAULT: "#1E3A5F", // ヘッダー・ロゴ・見出し
          light: "#2D5986", // ナビアクティブ
        },
        // 面・線・文字
        bg: "#FAFAF8", // 背景（薄い暖色グレー白）
        ink: "#1A1A1A", // 本文・店舗名
        sub: "#6B6560", // サブテキスト
        muted: "#A09890", // 非アクティブ
        line: "#E8E4DF", // 区切り線・カード枠
        // 空席ステータス
        seat: {
          open: "#16A34A",
          openbg: "#DCFCE7",
          few: "#F97316",
          fewbg: "#FED7AA",
          soon: "#EAB308",
          soonbg: "#FEF9C3",
          full: "#DC2626",
          fullbg: "#FEE2E2",
          closed: "#9CA3AF",
          closedbg: "#F3F4F6",
        },
      },
      borderRadius: {
        sm: "8px", // バッジ・タグ
        md: "16px", // カード
        lg: "24px", // ボトムシート上端
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.08)",
        cardhover: "0 4px 20px rgba(0,0,0,0.12)",
        bottombar: "0 -2px 16px rgba(0,0,0,0.08)",
        fab: "0 4px 16px rgba(249,115,22,0.35)",
      },
      fontFamily: {
        sans: [
          "var(--font-noto)",
          "Noto Sans JP",
          "Hiragino Sans",
          "sans-serif",
        ],
      },
      maxWidth: {
        app: "448px", // max-w-md相当のアプリ最大幅
      },
    },
  },
  plugins: [],
};

export default config;
