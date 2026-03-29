"use client";

import { CircleOfFifths } from "@/components/tools/circle-of-fifths";
import { PreviewToolsProvider } from "@/lib/stores/preview-tools-store";

export function BesliCemberTools() {
  return (
    <PreviewToolsProvider instanceKey="besli-cember-page">
      <div className="mx-auto max-w-4xl">
        <p className="mb-8 text-sm text-muted">
          Ana dizi + mod, Tonal.js ile diyatonik diziyi hesaplar; çember vurgusu ve yan paneller aynı store üzerinden
          güncellenir (önceki sayfa örneğinden bağımsız store).
        </p>
        <CircleOfFifths variant="full" />
      </div>
    </PreviewToolsProvider>
  );
}
