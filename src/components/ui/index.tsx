"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconChevronLeft } from "./icons";

// ── 画面ラッパー（下部ナビ分の余白を確保）──
export function Screen({
  children,
  withNav = true,
  className = "",
}: {
  children: React.ReactNode;
  withNav?: boolean;
  className?: string;
}) {
  return (
    <div className={`min-h-dvh ${withNav ? "pb-[72px]" : ""} ${className}`}>
      {children}
    </div>
  );
}

// ── ネイビーのヘッダー ──
export function Header({
  title,
  back,
  right,
  subtitle,
}: {
  title: string;
  back?: boolean | string;
  right?: React.ReactNode;
  subtitle?: string;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 bg-navy px-4 py-3 text-white">
      <div className="flex items-center gap-2">
        {back !== undefined && back !== false && (
          <button
            onClick={() => (typeof back === "string" ? router.push(back) : router.back())}
            aria-label="もどる"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/90 active:bg-white/10"
          >
            <IconChevronLeft size={24} />
          </button>
        )}
        <h1 className="min-w-0 flex-1 truncate text-xl font-bold">{title}</h1>
        {right}
      </div>
      {subtitle && <p className="mt-0.5 text-xs text-white/70">{subtitle}</p>}
    </header>
  );
}

// ── 大きなCTAボタン（オレンジ） ──
type BigButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
  icon?: React.ReactNode;
};

export function BigButton({
  children,
  onClick,
  href,
  variant = "primary",
  disabled,
  loading,
  type = "button",
  icon,
}: BigButtonProps) {
  const base =
    "flex h-[60px] w-full items-center justify-center gap-2 rounded-full text-lg font-bold transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100";
  const styles: Record<string, string> = {
    primary: "bg-primary text-white shadow-fab",
    secondary: "bg-navy text-white",
    outline: "border-[1.5px] border-primary bg-white text-primary",
  };
  const cls = `${base} ${styles[variant]}`;
  const content = (
    <>
      {loading ? <Spinner /> : icon}
      {children}
    </>
  );

  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={cls}>
      {content}
    </button>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white ${className}`}
    />
  );
}

// ── 角丸カード ──
export function Card({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-md bg-white shadow-card ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

// ── セクション見出し ──
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[13px] font-semibold text-sub">{children}</p>;
}

// ── ピル（フィルター・タグ・選択肢） ──
export function Chip({
  children,
  selected,
  onClick,
  size = "md",
}: {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm";
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full font-semibold transition ${pad} ${
        selected
          ? "bg-navy text-white"
          : "border border-line bg-white text-sub"
      }`}
    >
      {children}
    </button>
  );
}

// 雰囲気タグ（読み取り専用の小チップ）
export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-sm bg-navy/10 px-2 py-0.5 text-xs font-semibold text-navy">
      {children}
    </span>
  );
}

// ── 簡易QRコード（モック・トークンから決定的にブロックを描画）──
export function QrCode({ token, size = 120 }: { token: string; size?: number }) {
  const cells = 21;
  // トークンから疑似ランダムなビット列を生成（外部依存なし）
  const bits: boolean[] = [];
  let h = 0;
  for (let i = 0; i < token.length; i++) h = (h * 31 + token.charCodeAt(i)) >>> 0;
  for (let i = 0; i < cells * cells; i++) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    bits.push((h >> 16) % 2 === 0);
  }
  const cell = size / cells;
  return (
    <svg width={size} height={size} className="rounded-sm bg-white" aria-label="QRコード">
      <rect width={size} height={size} fill="#fff" />
      {bits.map((on, i) => {
        if (!on) return null;
        const x = (i % cells) * cell;
        const y = Math.floor(i / cells) * cell;
        return <rect key={i} x={x} y={y} width={cell} height={cell} fill="#1A1A1A" />;
      })}
      {/* 位置検出パターン（3隅） */}
      {[
        [0, 0],
        [cells - 7, 0],
        [0, cells - 7],
      ].map(([fx, fy], k) => (
        <g key={k}>
          <rect x={fx * cell} y={fy * cell} width={cell * 7} height={cell * 7} fill="#1A1A1A" />
          <rect x={(fx + 1) * cell} y={(fy + 1) * cell} width={cell * 5} height={cell * 5} fill="#fff" />
          <rect x={(fx + 2) * cell} y={(fy + 2) * cell} width={cell * 3} height={cell * 3} fill="#1A1A1A" />
        </g>
      ))}
    </svg>
  );
}

// 空状態
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="mb-3 text-4xl">🏮</div>
      <p className="text-base font-bold text-ink">{title}</p>
      {description && <p className="mt-1 text-sm text-sub">{description}</p>}
      {action && <div className="mt-5 w-full">{action}</div>}
    </div>
  );
}
