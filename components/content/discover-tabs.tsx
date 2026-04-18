"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import type { DiscoverAccent } from "@/components/content/discover-block";

type DiscoverTab = {
  id: string;
  label: string;
  icon: ReactNode;
  accent: DiscoverAccent;
  panel: ReactNode;
};

const TAB_ACTIVE_TEXT: Record<DiscoverAccent, string> = {
  rose: "text-rose-500",
  emerald: "text-emerald-500",
  amber: "text-amber-500",
};

export function DiscoverTabs({ tabs }: { tabs: DiscoverTab[] }) {
  const [active, setActive] = useState(() => tabs[0]?.id ?? "");
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === active),
  );

  return (
    <>
      <div
        role="tablist"
        aria-label="Keşfet kategorileri"
        className="relative z-10 flex gap-1 px-1 lg:hidden"
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`discover-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`discover-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={`relative flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-t-xl px-2 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? `-mb-px border border-b-0 border-border bg-surface ${TAB_ACTIVE_TEXT[tab.accent]}`
                  : "border border-transparent text-muted hover:text-display"
              }`}
            >
              <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden lg:overflow-visible">
        <div
          className="flex translate-x-[var(--discover-slide)] transition-transform duration-300 ease-out lg:grid lg:grid-cols-3 lg:gap-6 lg:translate-x-0"
          style={{ "--discover-slide": `-${activeIndex * 100}%` } as CSSProperties}
        >
          {tabs.map((tab) => (
            <div
              key={tab.id}
              role="tabpanel"
              id={`discover-panel-${tab.id}`}
              aria-labelledby={`discover-tab-${tab.id}`}
              aria-hidden={active !== tab.id ? true : undefined}
              className="w-full shrink-0 px-0.5 lg:w-auto lg:shrink lg:px-0"
            >
              {tab.panel}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
