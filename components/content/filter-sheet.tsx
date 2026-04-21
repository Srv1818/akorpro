"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal, X } from "lucide-react";

export function FilterSheet({
  children,
  activeCount = 0,
}: {
  children: React.ReactNode;
  activeCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-surface/80 active:scale-95"
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
        Filtrele
        {activeCount > 0 && (
          <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-accent-foreground">
            {activeCount}
          </span>
        )}
      </button>

      {open && mounted
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-[90] bg-zinc-950/40 backdrop-blur-sm dark:bg-black/60"
                aria-label="Kapat"
                onClick={close}
              />
              <div
                className="fixed inset-x-0 bottom-0 z-[100] flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-border bg-bg shadow-xl"
                role="dialog"
                aria-modal="true"
                aria-label="Filtrele"
              >
                <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
                  <h2 className="text-base font-semibold text-foreground">Filtrele</h2>
                  <button
                    type="button"
                    onClick={close}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface"
                    aria-label="Kapat"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <div className="overflow-y-auto px-4 py-4">
                  {children}
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
