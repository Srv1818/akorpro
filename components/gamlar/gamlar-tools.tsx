"use client";

import { GamlarScaleExplorer } from "@/components/gamlar/gamlar-scale-explorer";
import { GamlarScaleInfo } from "@/components/gamlar/gamlar-scale-info";
import { GamlarPageToolsProvider } from "@/lib/stores/tooling-page-stores";

export function GamlarTools() {
  return (
    <GamlarPageToolsProvider instanceKey="gamlar-page" initialScaleId="maj-ionian">
      <GamlarScaleExplorer />
      <GamlarScaleInfo />
    </GamlarPageToolsProvider>
  );
}
