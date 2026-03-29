"use client";

import { CircleOfFifths } from "@/components/tools/circle-of-fifths";
import { PreviewToolsProvider } from "@/lib/stores/preview-tools-store";

export function BesliCemberTools() {
  return (
    <PreviewToolsProvider instanceKey="besli-cember-page">
      <div className="mx-auto max-w-5xl">
        <CircleOfFifths variant="full" />
      </div>
    </PreviewToolsProvider>
  );
}
