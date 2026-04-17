"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";

type Item = { readonly href: string; readonly label: string };

export function MobileNav({ items }: { items: readonly Item[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const id = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface text-foreground shadow-sm"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      {open && mounted
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-[90] bg-zinc-950/40 backdrop-blur-sm dark:bg-black/60"
                aria-label="Menüyü kapat"
                onClick={close}
              />
              <div
                id={id}
                className="fixed inset-x-0 top-14 z-[100] border-b border-border bg-bg px-4 py-4 shadow-lg sm:top-16"
                role="dialog"
                aria-modal="true"
                onClick={close}
              >
                <nav className="flex flex-col gap-0.5" aria-label="Mobil menü">
                  {items.map((item) => {
                    const active =
                      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={[
                          "flex min-h-[44px] items-center rounded-xl px-3 py-3 text-base font-medium transition-all duration-150",
                          active
                            ? "text-accent bg-white/50 dark:bg-white/[0.10] border border-white/60 dark:border-white/[0.16] shadow-sm"
                            : "text-foreground hover:bg-white/30 dark:hover:bg-white/[0.07]",
                        ].join(" ")}
                        onClick={close}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
