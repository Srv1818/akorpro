"use client";

import { GamlarScaleExplorer } from "@/components/gamlar/gamlar-scale-explorer";
import { GamlarPageToolsProvider } from "@/lib/stores/tooling-page-stores";

export function GamlarTools() {
  return (
    <GamlarPageToolsProvider instanceKey="gamlar-page" initialScaleId="maj-ionian">
      <GamlarScaleExplorer />
    </GamlarPageToolsProvider>
  );
}
