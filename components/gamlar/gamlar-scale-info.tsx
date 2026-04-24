"use client";

import { gamlarScaleById, normalizeGamlarScaleId } from "@/data/gamlar-scale-catalog";
import { useGamlarPageToolsStore } from "@/lib/stores/tooling-page-stores";

export function GamlarScaleInfo() {
  const scaleId = useGamlarPageToolsStore((s) => s.selectedScaleId);
  const resolved = normalizeGamlarScaleId(scaleId) ?? "maj-ionian";
  const entry = gamlarScaleById(resolved);

  if (!entry) return null;

  const text = entry.description ?? entry.subtitle;
  if (!text) return null;

  return (
    <div className="mt-4 rounded-2xl border border-border bg-surface px-5 py-4">
      <h3 className="mb-1 text-sm font-semibold text-foreground">{entry.name}</h3>
      <p className="text-sm leading-relaxed text-muted">{text}</p>
    </div>
  );
}
