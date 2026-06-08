// シンプルな線アイコン（絵文字併用、装飾は最小限）

type P = { className?: string; size?: number };

function base(size = 24, className = "") {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };
}

export function IconHome({ className, size }: P) {
  return (
    <svg {...base(size, className)}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

export function IconMap({ className, size }: P) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function IconHeart({ className, size, filled }: P & { filled?: boolean }) {
  return (
    <svg {...base(size, className)} fill={filled ? "currentColor" : "none"}>
      <path d="M12 20s-7-4.5-9.5-9A5 5 0 0112 5a5 5 0 019.5 6c-2.5 4.5-9.5 9-9.5 9z" />
    </svg>
  );
}

export function IconClock({ className, size }: P) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function IconUser({ className, size }: P) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

export function IconSearch({ className, size }: P) {
  return (
    <svg {...base(size, className)}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </svg>
  );
}

export function IconChevronLeft({ className, size }: P) {
  return (
    <svg {...base(size, className)}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function IconArrowRight({ className, size }: P) {
  return (
    <svg {...base(size, className)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconPlus({ className, size }: P) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconMinus({ className, size }: P) {
  return (
    <svg {...base(size, className)}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconCheck({ className, size }: P) {
  return (
    <svg {...base(size, className)}>
      <path d="M4 12.5l5 5L20 6" />
    </svg>
  );
}

export function IconTarget({ className, size }: P) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

export function IconPhone({ className, size }: P) {
  return (
    <svg {...base(size, className)}>
      <path d="M5 4h4l2 5-3 2a12 12 0 005 5l2-3 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
    </svg>
  );
}

export function IconSort({ className, size }: P) {
  return (
    <svg {...base(size, className)}>
      <path d="M7 4v16M7 20l-3-3M7 4l3 3M17 20V4M17 4l3 3M17 20l-3-3" />
    </svg>
  );
}

export function IconLock({ className, size }: P) {
  return (
    <svg {...base(size, className)}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}

export function IconStore({ className, size }: P) {
  return (
    <svg {...base(size, className)}>
      <path d="M4 9l1-4h14l1 4M4 9v11h16V9M4 9h16M9 20v-6h6v6" />
    </svg>
  );
}

export function IconChart({ className, size }: P) {
  return (
    <svg {...base(size, className)}>
      <path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" />
    </svg>
  );
}

export function IconShare({ className, size }: P) {
  return (
    <svg {...base(size, className)}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

// ロゴの提灯（装飾）
export function IconLantern({ className, size }: P) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 3v2M9 5h6" />
      <ellipse cx="12" cy="12" rx="5" ry="6" />
      <path d="M7.5 9h9M7.5 15h9M12 18v2" />
    </svg>
  );
}
