"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Circle, Compass, Guitar, ListMusic, Music, type LucideIcon } from "lucide-react";
import { mainNav } from "@/lib/nav";

const iconMap: Record<string, LucideIcon> = {
  Compass, Music, Guitar, BookOpen, Circle, ListMusic,
};

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="flex items-center gap-0.5 rounded-2xl p-1
        backdrop-blur-md
        bg-white/20 dark:bg-white/[0.06]
        border border-white/40 dark:border-white/[0.12]
        shadow-[0_4px_24px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]"
      aria-label="Ana menü"
    >
      {mainNav.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-sm font-medium",
              "transition-all duration-200 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent",
              active
                ? [
                    "text-accent",
                    "bg-white/70 dark:bg-white/[0.14]",
                    "border border-white/80 dark:border-white/[0.22]",
                    "shadow-[0_1px_8px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_1px_8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]",
                  ].join(" ")
                : "text-muted hover:text-foreground hover:bg-white/25 dark:hover:bg-white/[0.08] active:scale-95",
            ].join(" ")}
          >
            {(() => { const Icon = iconMap[item.icon]; return Icon ? <Icon className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden /> : null; })()}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
