"use client";

import { useMemo } from "react";
import { CircleOfFifths } from "@/components/tools/circle-of-fifths";
import { Fretboard } from "@/components/tools/fretboard";
import { scales } from "@/data/mock/scales";
import { PreviewToolsProvider, usePreviewToolsStore } from "@/lib/stores/preview-tools-store";

function GamlarScaleList() {
  const selectedId = usePreviewToolsStore((s) => s.selectedScaleId);
  const setSelectedScaleId = usePreviewToolsStore((s) => s.setSelectedScaleId);

  const categories = useMemo(() => {
    const map = new Map<string, typeof scales>();
    for (const s of scales) {
      const cat = s.category ?? "Diğer";
      const arr = map.get(cat) ?? [];
      arr.push(s);
      map.set(cat, arr);
    }
    return [...map.entries()];
  }, []);

  return (
    <div className="space-y-6">
      {categories.map(([cat, items]) => (
        <div key={cat}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{cat}</h3>
          <ul className="grid gap-2 md:grid-cols-2">
            {items.map((s) => {
              const active = (selectedId ?? "ionian") === s.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedScaleId(s.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-accent bg-surface ring-1 ring-accent/40"
                        : "border-border bg-surface hover:border-accent/30"
                    }`}
                  >
                    <span className="font-semibold text-foreground">{s.name}</span>
                    <p className="mt-1 font-mono text-xs text-accent">{s.notesC.join(" — ")}</p>
                    {s.description ? (
                      <p className="mt-1 text-[11px] text-muted">{s.description}</p>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function GamlarTools() {
  return (
    <PreviewToolsProvider instanceKey="gamlar-page" initialScaleId="ionian">
      <div className="space-y-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="text-sm font-medium text-foreground">Gam listesi</h2>
            <div className="mt-4">
              <GamlarScaleList />
            </div>
          </div>
          <div className="sticky top-20">
            <CircleOfFifths variant="widget" />
            <Fretboard mode="scale" maxFret={12} className="mt-6" />
          </div>
        </div>
      </div>
    </PreviewToolsProvider>
  );
}
