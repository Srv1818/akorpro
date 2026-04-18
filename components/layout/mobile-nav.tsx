"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AuthHeaderActions } from "@/components/auth/auth-header-actions";
import type { SessionUser } from "@/lib/auth/session-user";

type Item = { readonly href: string; readonly label: string };
type MeResponse = { user: SessionUser | null };

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

  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const fetchingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (cancelled) return;
        if (!res.ok) { setUser(null); return; }
        const data = (await res.json()) as MeResponse;
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        fetchingRef.current = false;
      }
    }

    void fetchUser();

    function onAuthChange() { void fetchUser(); }
    function onFocus() { void fetchUser(); }

    window.addEventListener("akorpro:auth-change", onAuthChange);
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("akorpro:auth-change", onAuthChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [pathname]);

  useEffect(() => {
    close();
  }, [pathname, close]);

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

  // Logged out → show "Giriş Yap" button
  if (user === null) {
    return (
      <Link
        href={`/giris?returnTo=${encodeURIComponent(pathname)}`}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground shadow-sm transition hover:bg-accent-muted"
      >
        Giriş Yap
      </Link>
    );
  }

  // Loading → show placeholder same size as button
  if (user === undefined) {
    return (
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface">
        <span className="h-4 w-4 animate-pulse rounded bg-border" />
      </span>
    );
  }

  // Logged in → hamburger
  return (
    <div className="md:hidden">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-foreground shadow-sm"
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
                className="fixed inset-x-0 top-14 z-[100] border-b border-border bg-bg shadow-lg"
                role="dialog"
                aria-modal="true"
              >
                <nav className="flex flex-col gap-0.5 px-4 pt-4 pb-3" aria-label="Mobil menü">
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

                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                  
                <div className="flex items-center gap-2 ml-auto">
                    <ThemeToggle />
                    <AuthHeaderActions />
                  </div>
                </div>
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
