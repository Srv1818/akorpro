"use client";

import Link from "next/link";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth/session-user";
import { getFirebaseApp } from "@/lib/firebase/client";

type MeResponse = { user: SessionUser | null };

export function AuthHeaderActions() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const ac = new AbortController();
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include", signal: ac.signal });
        if (!res.ok) {
          startTransition(() => setEmail(null));
          return;
        }
        const data = (await res.json()) as MeResponse;
        startTransition(() => {
          setEmail(data.user?.email ?? (data.user ? "" : null));
        });
      } catch {
        if (ac.signal.aborted) return;
        startTransition(() => setEmail(null));
      }
    })();
    return () => ac.abort();
  }, []);

  async function onSignOut() {
    await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
    try {
      const auth = getAuth(getFirebaseApp());
      await signOut(auth);
    } catch {
      /* İstemci yapılandırması yoksa yalnızca çerez silinir. */
    }
    startTransition(() => setEmail(null));
    router.refresh();
  }

  if (email === undefined) {
    return (
      <span className="inline-flex h-9 min-w-[4.5rem] items-center justify-center rounded-lg border border-border bg-surface px-3 text-xs text-muted">
        …
      </span>
    );
  }

  if (email === null) {
    return (
      <Link
        href="/giris"
        className="inline-flex h-9 items-center justify-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground shadow-sm transition hover:bg-accent-muted sm:px-4"
      >
        Giriş
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[10rem] truncate text-xs text-muted sm:inline" title={email || undefined}>
        {email || "Hesap"}
      </span>
      <button
        type="button"
        onClick={() => void onSignOut()}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-surface/80"
      >
        Çıkış
      </button>
    </div>
  );
}
