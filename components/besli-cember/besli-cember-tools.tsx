"use client";

import { CircleOfFifths } from "@/components/tools/circle-of-fifths";
import { Fretboard } from "@/components/tools/fretboard";
import { PreviewToolsProvider } from "@/lib/stores/preview-tools-store";

export function BesliCemberTools() {
  return (
    <PreviewToolsProvider instanceKey="besli-cember-page">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <CircleOfFifths variant="full" />
        <div>
          <p className="text-sm text-muted">
            Tonal merkez seçimi fretboard&apos;da majör üçlü perdeleri vurgular. Bu sayfa kendi Preview store örneğini
            oluşturur; önizleme rotasından bağımsız state.
          </p>
          <Fretboard mode="chord" maxFret={12} className="mt-6" />
        </div>
      </div>
    </PreviewToolsProvider>
  );
}
