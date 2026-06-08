"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconStore, IconChart } from "@/components/ui/icons";

const TABS = [
  { href: "/admin", label: "店舗管理", Icon: IconStore, exact: true },
  { href: "/admin/analytics", label: "分析", Icon: IconChart },
];

export function AdminNav() {
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
