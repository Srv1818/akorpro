"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";
import type { SessionUser } from "@/lib/auth/session-user";
import { getClientAuth } from "@/lib/firebase/client";
// Dropdown ikonları için Lucide-react (shadcn projelerinde standarttır)
import { MessageCircle, User, LogOut } from "lucide-react";

type MeResponse = { user: SessionUser | null };

function AuthedMenu({ user, onSignOut }: { user: SessionUser; onSignOut: () => Promise<void> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(e: PointerEvent) {
      const el = containerRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setIsOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

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
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-surface transition-colors"
            >
              <User className="h-4 w-4 text-muted" />
              Profil
            </Link>
            <Link
              href="/iletisim"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-surface transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-muted" />
              İletişim
            </Link>
          </div>

          <div className="border-t border-border/50 py-1">
            <button
              onClick={() => {
                setIsOpen(false);
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