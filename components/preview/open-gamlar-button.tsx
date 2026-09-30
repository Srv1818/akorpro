"use client";

import { Music2 } from "lucide-react";

/** PreviewClient dinliyor; Solo/Gam panelini sayfanın başka yerinden açmak için. */
export const OPEN_GAMLAR_EVENT = "akorpro:open-gamlar";

/**
 * Şarkı sayfasının altındaki solo gam bölümünden sap panelini açar.
 * Eskiden metin "akorların üstündeki Solo/Gam düğmesine bas" diyordu ve
 * okuyanı sayfanın başına geri gönderiyordu.
 */
export function OpenGamlarButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_GAMLAR_EVENT))}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-accent/60 bg-accent/10 px-3 text-xs font-semibold text-accent transition hover:bg-accent/20"
    >
      <Music2 className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
      Sapta göster
    </button>
  );
}
