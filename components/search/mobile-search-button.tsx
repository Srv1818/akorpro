"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { createPortal } from "react-dom";

export function MobileSearchButton() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      inputRef.current?.focus();
      return;
    }
    close();
    router.push(`/arama?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Aramayı aç"
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition hover:bg-surface/80"
      >
        <SearchIcon className="h-4 w-4" />
      </button>

      {open && mounted
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Aramayı kapat"
                className="fixed inset-0 z-[90] bg-zinc-950/50 backdrop-blur-sm dark:bg-black/60"
                onClick={close}
              />
              <div className="fixed inset-x-0 top-0 z-[100] border-b border-border bg-bg px-3 py-3 shadow-lg">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                  <div className="relative flex min-w-0 flex-1 items-center">
                    <SearchIcon className="pointer-events-none absolute left-3 h-4 w-4 shrink-0 text-muted" />
                    <input
                      ref={inputRef}
                      type="text"
                      enterKeyHint="search"
                      inputMode="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Şarkı veya sanatçı ara..."
                      className="min-w-0 w-full rounded-xl border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent"
                      aria-label="Arama"
                    />
                  </div>
                  <button
                    type="submit"
                    className="shrink-0 rounded-xl border border-border bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:bg-accent-muted active:scale-95"
                  >
                    Ara
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="shrink-0 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface/80"
                  >
                    İptal
                  </button>
                </form>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
