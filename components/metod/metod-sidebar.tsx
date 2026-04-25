"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function MetodSidebar({ konular }: { konular: string[] }) {
  const [acik, setAcik] = useState(true);

  return (
    <aside
      className={[
        "sticky top-0 h-screen shrink-0 overflow-hidden border-r border-border bg-surface transition-all duration-300 ease-in-out",
        acik ? "w-64" : "w-12",
      ].join(" ")}
    >
      {/* Toggle butonu */}
      <button
        onClick={() => setAcik((v) => !v)}
        className="flex h-12 w-full items-center justify-end border-b border-border px-3 text-muted hover:text-foreground transition-colors"
        aria-label={acik ? "Menüyü kapat" : "Menüyü aç"}
      >
        {acik ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
      </button>

      {/* Konu listesi */}
      <div className={["overflow-y-auto h-[calc(100%-3rem)] transition-opacity duration-200", acik ? "opacity-100" : "opacity-0 pointer-events-none"].join(" ")}>
        <div className="p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
            Konular
          </p>
          <ul className="flex flex-col gap-2">
            {konular.map((konu, i) => (
              <li key={i}>
                <button className="flex w-full items-center gap-3 rounded-lg border border-border bg-bg p-3 text-left text-sm font-medium text-foreground transition hover:border-accent/40 hover:text-accent">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                    {i + 1}
                  </span>
                  <span className="line-clamp-2 leading-snug">{konu}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
