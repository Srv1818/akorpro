"use client";

import { useEffect } from "react";
import {
  BesliCemberScaleControls,
  BesliCemberScaleFormulaPanel,
} from "@/components/gamlar/gamlar-scale-controls";
import { BesliCemberCircleOfFifths } from "@/components/tools/circle-of-fifths";
import { gamlarScaleById, normalizeGamlarScaleId } from "@/data/gamlar-scale-catalog";
import {
  BesliCemberPageToolsProvider,
  useBesliCemberPageToolsStore,
} from "@/lib/stores/tooling-page-stores";

function BesliCemberBluesGuard() {
  const scaleId = useBesliCemberPageToolsStore((s) => s.selectedScaleId);
  const setScaleId = useBesliCemberPageToolsStore((s) => s.setSelectedScaleId);
  useEffect(() => {
    const id = normalizeGamlarScaleId(scaleId) ?? "";
    const e = gamlarScaleById(id);
    if (e?.category === "blues") setScaleId("maj-ionian");
  }, [scaleId, setScaleId]);
  return null;
}

export function BesliCemberTools() {
  return (
    <BesliCemberPageToolsProvider instanceKey="besli-cember-page" initialScaleId="maj-ionian">
      <BesliCemberBluesGuard />
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <BesliCemberScaleControls
          hideBlues
          hideTonicRow
          hideFamilyBlurb
          hideFormulaPanel
        />
        <BesliCemberCircleOfFifths variant="full" chordSource="gamlar" />
        <section aria-label="Gam formülü ve diyatonik akor örnekleri">
          <BesliCemberScaleFormulaPanel />
        </section>
      </div>
    </BesliCemberPageToolsProvider>
  );
}
