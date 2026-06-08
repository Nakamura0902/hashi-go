"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconStore, IconLantern, IconUser, IconCheck, IconMap } from "@/components/ui/icons";

const TABS = [
  { href: "/merchant", label: "ダッシュ", Icon: IconHome, exact: true },
  { href: "/merchant/seats", label: "空席更新", Icon: IconStore },
  { href: "/merchant/offers", label: "特典", Icon: IconLantern },
  { href: "/merchant/visits", label: "来店", Icon: IconCheck },
  { href: "/merchant/nearby", label: "近隣", Icon: IconMap },
  { href: "/merchant/profile", label: "店舗", Icon: IconUser },
];

export function MerchantNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-app border-t border-line bg-white pb-safe shadow-bottombar">
      <ul className="flex h-16 items-stretch">
        {TABS.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link href={href} className="relative flex h-full flex-col items-center justify-center gap-1">
                {active && <span className="absolute top-0 h-[3px] w-8 rounded-full bg-primary" />}
                <Icon size={22} className={active ? "text-navy-light" : "text-muted"} />
                <span className={`text-[10px] font-medium ${active ? "text-navy-light" : "text-muted"}`}>
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
