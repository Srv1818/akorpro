"use client";

import { usePathname } from "next/navigation";
import { mainNav } from "@/lib/nav";

export function MobilePageTitle() {
  const pathname = usePathname();
  const current = mainNav.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  );
  if (!current) return null;
  return (
    <span className="truncate text-sm font-semibold text-display">
      {current.label}
    </span>
  );
}
