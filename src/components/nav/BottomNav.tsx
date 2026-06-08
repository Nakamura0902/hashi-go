"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconMap,
  IconHeart,
  IconClock,
  IconUser,
} from "@/components/ui/icons";

const TABS = [
  { href: "/", label: "ホーム", Icon: IconHome },
  { href: "/map", label: "地図", Icon: IconMap },
  { href: "/favorites", label: "お気に入り", Icon: IconHeart },
  { href: "/history", label: "履歴", Icon: IconClock },
  { href: "/mypage", label: "マイページ", Icon: IconUser },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-app border-t border-line bg-white pb-safe shadow-bottombar">
      <ul className="flex h-16 items-stretch">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className="relative flex h-full flex-col items-center justify-center gap-1"
              >
                {active && (
                  <span className="absolute top-0 h-[3px] w-8 rounded-full bg-primary" />
                )}
                <Icon
                  size={22}
                  className={active ? "text-primary" : "text-muted"}
                />
                <span
                  className={`text-[10px] ${active ? "font-bold text-primary" : "font-medium text-muted"}`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
