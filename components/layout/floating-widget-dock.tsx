"use client";

import type { ReactNode } from "react";

/**
 * Fixed-height reservation area at the bottom of the viewport for
 * floating widgets (transpose bar, auto-scroll, metronome).
 * Height is always reserved to prevent CLS when widgets mount late.
 */
export function FloatingWidgetDock({
  children,
  open = true,
  zClassName = "z-40",
}: {
  children?: ReactNode;
  open?: boolean;
  zClassName?: string;
}) {
  return (
    <>
      {/* Spacer reserves vertical space so content above doesn't shift */}
      <div className="h-16 sm:h-14" aria-hidden="true" />
      <div
        role="toolbar"
        aria-label="Araç çubuğu"
        aria-hidden={!open}
        className={`fixed inset-x-0 bottom-0 ${zClassName} h-16 border-t border-border bg-surface/95 backdrop-blur-sm sm:h-14 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="mx-auto flex h-full max-w-3xl items-center gap-2 px-4">
          {children}
        </div>
      </div>
    </>
  );
}
