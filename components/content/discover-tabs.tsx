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

const TAB_ACTIVE: Record<DiscoverAccent, string> = {
  rose: "bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/30 shadow-sm",
  emerald: "bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30 shadow-sm",
  amber: "bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/30 shadow-sm",
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
        className="grid grid-cols-3 gap-1.5 rounded-t-2xl border border-b-0 border-border bg-surface p-1.5 lg:hidden"
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
              className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all ${
                isActive ? TAB_ACTIVE[tab.accent] : "text-muted hover:text-display"
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
