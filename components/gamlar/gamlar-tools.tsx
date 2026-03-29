"use client";

import { GamlarScaleExplorer } from "@/components/gamlar/gamlar-scale-explorer";
import { PreviewToolsProvider } from "@/lib/stores/preview-tools-store";

export function GamlarTools() {
  return (
    <PreviewToolsProvider instanceKey="gamlar-page" initialScaleId="major">
      <GamlarScaleExplorer />
    </PreviewToolsProvider>
  );
}
