"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import type { SessionUser } from "@/lib/auth/session-user";
import { getClientAuth } from "@/lib/firebase/client";
import { MessageCircle, PenLine, User, LogOut } from "lucide-react";

type MeResponse = { user: SessionUser | null };

function AuthedMenu({ user, onSignOut }: { user: SessionUser; onSignOut: () => Promise<void> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const close = useCallback(() => setIsOpen(false), []);

  // Navigasyon başladığında menüyü kapat (transition sırasında eski ağaç görünürken de çalışır)
  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(e: PointerEvent) {
      const el = containerRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) close();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, close]);

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-surface border border-border transition hover:bg-surface/80 hover:ring-2 hover:ring-accent focus:outline-none"
      >
        <span className="text-sm font-medium text-foreground">{userInitial}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-md border border-border bg-bg py-1 shadow-lg shadow-black/50 ring-1 ring-black ring-opacity-5">
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-sm font-medium text-foreground truncate">Hesabım</p>
            <p className="text-xs text-muted truncate mt-0.5">{user.email || "Kullanıcı"}</p>
          </div>

          <div className="py-1">
            <Link
              href={`/profil/${user.uid}`}
              onClick={close}
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-surface transition-colors"
            >
              <User className="h-4 w-4 text-muted" />
              Profil
            </Link>
            <Link
              href="/iletisim"
              onClick={close}
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-surface transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-muted" />
              İletişim
            </Link>
            {user.admin ? (
              <Link
                href="/katki"
                onClick={close}
                className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-surface transition-colors"
              >
                <PenLine className="h-4 w-4 text-muted" />
                Katkı girişi
              </Link>
            ) : null}
          </div>

          <div className="border-t border-border/50 py-1">
            <button
              onClick={() => {
                close();
                void onSignOut();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AuthHeaderActions() {
  const router = useRouter();
  const pathname = usePathname();
  // Sadece maili değil, tüm kullanıcı objesini tutalım (eğer profil resmi vs. varsa kullanırız)
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  /* pathname: /giris sonrası layout unmount olmaz; rota değişince oturumu yeniden oku (önceki UI’ı tutup arka planda güncelle). */
  useEffect(() => {
    const ac = new AbortController();
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include", signal: ac.signal });
        if (!res.ok) {
          startTransition(() => setUser(null));
          return;
        }
        const data = (await res.json()) as MeResponse;
        startTransition(() => {
          setUser(data.user);
        });
      } catch {
        if (ac.signal.aborted) return;
        startTransition(() => setUser(null));
      }
    })();
    return () => ac.abort();
  }, [pathname]);

  async function onSignOut() {
    await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
    try {
      const auth = getClientAuth();
      await signOut(auth);
    } catch {
      /* İstemci yapılandırması yoksa yalnızca çerez silinir. */
    }
    startTransition(() => setUser(null));
    window.dispatchEvent(new Event("akorpro:auth-change"));
    router.refresh();
  }

  // Yükleniyor durumu
  if (user === undefined) {
    return (
      <span className="inline-flex h-9 min-w-[4.5rem] items-center justify-center rounded-lg border border-border bg-surface px-3 text-xs text-muted">
        <span className="animate-pulse">…</span>
      </span>
    );
  }

  // Giriş yapmamış kullanıcı durumu
  if (user === null) {
    return (
      <Link
        href="/giris"
        className="inline-flex h-9 items-center justify-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground shadow-sm transition hover:bg-accent-muted sm:px-4"
      >
        Giriş Yap
      </Link>
    );
  }

  // Rota değişince menüyü kapatmak için effect yerine remount kullanıyoruz.
  return <AuthedMenu key={pathname} user={user} onSignOut={onSignOut} />;
}

function useSessionUser() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const pathname = usePathname();

  useEffect(() => {
    const ac = new AbortController();
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include", signal: ac.signal });
        if (!res.ok) { startTransition(() => setUser(null)); return; }
        const data = (await res.json()) as MeResponse;
        startTransition(() => setUser(data.user));
      } catch {
        if (ac.signal.aborted) return;
        startTransition(() => setUser(null));
      }
    })();
    return () => ac.abort();
  }, [pathname]);

  return user;
}

/** Mobil navbar'da yalnızca giriş yapılmamışken "Giriş Yap" butonunu gösterir. */
export function MobileNavLoginButton() {
  const user = useSessionUser();

  if (user === null) {
    return (
      <Link
        href="/giris"
        className="inline-flex h-9 items-center justify-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground shadow-sm transition hover:bg-accent-muted sm:px-4"
      >
        Giriş Yap
      </Link>
    );
  }

  return null;
}

/** Hamburger menü içinde giriş yapılmış kullanıcı bölümünü gösterir. */
export function MobileNavUserSection({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const user = useSessionUser();

  async function handleSignOut() {
    await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
    try {
      const auth = getClientAuth();
      await signOut(auth);
    } catch { /* İstemci yapılandırması yoksa yalnızca çerez silinir. */ }
    startTransition(() => {});
    window.dispatchEvent(new Event("akorpro:auth-change"));
    router.refresh();
    onClose();
  }

  if (!user) return null;

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <div className="border-t border-border/50 mt-1 pt-1">
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface border border-border">
          <span className="text-sm font-medium text-foreground">{userInitial}</span>
        </div>
        <p className="truncate text-xs text-muted">{user.email}</p>
      </div>
      <Link
        href={`/profil/${user.uid}`}
        onClick={onClose}
        className="flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-3 text-base font-medium text-foreground hover:bg-white/30 dark:hover:bg-white/[0.07]"
      >
        <User className="size-[1.125rem] shrink-0" strokeWidth={1.75} aria-hidden />
        Profil
      </Link>
      <Link
        href="/iletisim"
        onClick={onClose}
        className="flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-3 text-base font-medium text-foreground hover:bg-white/30 dark:hover:bg-white/[0.07]"
      >
        <MessageCircle className="size-[1.125rem] shrink-0" strokeWidth={1.75} aria-hidden />
        İletişim
      </Link>
      {user.admin ? (
        <Link
          href="/katki"
          onClick={onClose}
          className="flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-3 text-base font-medium text-foreground hover:bg-white/30 dark:hover:bg-white/[0.07]"
        >
          <PenLine className="size-[1.125rem] shrink-0" strokeWidth={1.75} aria-hidden />
          Katkı girişi
        </Link>
      ) : null}
      <button
        onClick={() => void handleSignOut()}
        className="flex w-full min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-3 text-base font-medium text-red-500 hover:bg-red-500/10 transition-colors"
      >
        <LogOut className="size-[1.125rem] shrink-0" strokeWidth={1.75} aria-hidden />
        Çıkış Yap
      </button>
    </div>
  );
}