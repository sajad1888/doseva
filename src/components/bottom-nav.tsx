"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const ICON = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ITEMS: { href: string; label: string; icon: ReactNode; also?: string[] }[] = [
  {
    href: "/home",
    also: ["/schedule"],
    label: "خانه",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...ICON} aria-hidden="true">
        <path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    href: "/medicines",
    label: "داروها",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...ICON} aria-hidden="true">
        <rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)" />
        <path d="M9 9l6 6" />
      </svg>
    ),
  },
  {
    href: "/appointments",
    label: "نوبت‌ها",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...ICON} aria-hidden="true">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M4 10h16M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    href: "/reports",
    label: "گزارش‌ها",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...ICON} aria-hidden="true">
        <path d="M6 20V11M12 20V5M18 20v-6" />
      </svg>
    ),
  },
  {
    href: "/account",
    label: "حساب من",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...ICON} aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      dir="rtl"
      aria-label="منوی اصلی"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-[#e6eef9] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 px-2 py-2">
        {ITEMS.map((item) => {
          const active = [item.href, ...(item.also ?? [])].some(
            (p) => pathname === p || pathname.startsWith(p + "/")
          );
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  "mx-auto flex w-16 flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] transition " +
                  (active ? "bg-[#e8f2fe] text-[#1583db] font-bold" : "text-[#7b8ba6]")
                }
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}