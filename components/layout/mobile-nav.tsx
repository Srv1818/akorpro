"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { BookOpen, Circle, Compass, Guitar, ListMusic, Moon, Music, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { MobileNavUserSection } from "@/components/auth/auth-header-actions";

const iconMap: Record<string, LucideIcon> = {
  Compass, Music, Guitar, BookOpen, Circle, ListMusic,
};

type Item = { readonly href: string; readonly label: string; readonly icon?: string };

export function MobileNav({ items }: { items: readonly Item[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const id = useId();
  const close = useCallback(() => setOpen(false), []);

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
                <nav className="flex flex-col gap-0.5 px-4 py-4" aria-label="Mobil menü">
                  {items.map((item) => {
                    const active =
                      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={[
                          "flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-3 text-base font-medium transition-all duration-150",
                          active
                            ? "text-accent bg-white/50 dark:bg-white/[0.10] border border-white/60 dark:border-white/[0.16] shadow-sm"
                            : "text-foreground hover:bg-white/30 dark:hover:bg-white/[0.07]",
                        ].join(" ")}
                        onClick={close}
                      >
                        {(() => { const Icon = item.icon ? iconMap[item.icon] : undefined; return Icon ? <Icon className="size-4.5 shrink-0" strokeWidth={1.75} aria-hidden /> : null; })()}
                        {item.label}
                      </Link>
                    );
                  })}

                  {/* Tema değiştirici */}
                  {mounted ? (
                    <div className="border-t border-border/50 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                        className="flex w-full min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-3 text-base font-medium text-foreground hover:bg-white/30 dark:hover:bg-white/[0.07] transition-colors"
                      >
                        {resolvedTheme === "dark"
                          ? <Sun className="size-[1.125rem] shrink-0 text-amber-400" strokeWidth={1.75} aria-hidden />
                          : <Moon className="size-[1.125rem] shrink-0 text-zinc-500" strokeWidth={1.75} aria-hidden />
                        }
                        {resolvedTheme === "dark" ? "Açık tema" : "Koyu tema"}
                      </button>
                    </div>
                  ) : null}

                  {/* Giriş yapmış kullanıcı bölümü */}
                  <MobileNavUserSection onClose={close} />
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
