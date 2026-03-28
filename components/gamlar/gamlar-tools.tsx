"use client";

import { CircleOfFifths } from "@/components/tools/circle-of-fifths";
import { Fretboard } from "@/components/tools/fretboard";
import { mockScales } from "@/data/mock/scales";
import { PreviewToolsProvider, usePreviewToolsStore } from "@/lib/stores/preview-tools-store";

function GamlarScaleList() {
  const selectedId = usePreviewToolsStore((s) => s.selectedScaleId);
  const setSelectedScaleId = usePreviewToolsStore((s) => s.setSelectedScaleId);

  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {mockScales.map((s) => {
        const active = (selectedId ?? "ionian") === s.id;
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setSelectedScaleId(s.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                active ? "border-accent bg-surface ring-1 ring-accent/40" : "border-border bg-surface hover:border-accent/30"
              }`}
            >
              <span className="font-semibold text-foreground">{s.name}</span>
              <p className="mt-2 font-mono text-sm text-accent">{s.notesC.join(" — ")}</p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function GamlarTools() {
  return (
    <PreviewToolsProvider instanceKey="gamlar-page" initialScaleId="ionian">
      <div className="space-y-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="text-sm font-medium text-foreground">Gam listesi</h2>
            <p className="mt-1 text-xs text-muted">Seçim `selectedScaleId` store alanına yazar; fretboard aynı store&apos;u okur.</p>
            <div className="mt-4">
              <GamlarScaleList />
            </div>
          </div>
          <div>
            <CircleOfFifths variant="widget" />
            <Fretboard mode="scale" maxFret={12} className="mt-6" />
          </div>
        </div>
      </div>
    </PreviewToolsProvider>
  );
}
