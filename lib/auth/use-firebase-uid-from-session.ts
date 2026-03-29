"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { getFirebasePublicConfig } from "@/lib/firebase/public-config";
import { getClientAuth } from "@/lib/firebase/client";

/**
 * HTTP-only oturum çerezi varken Firebase Auth bazen boş kalır; Firestore kuralları
 * `request.auth` istediği için `/api/auth/custom-token` ile istemci oturumu eşitlenir.
 *
 * Aynı sayfada çok sayıda bileşen bu hook’u kullandığı için senkron tek bir Promise
 * üzerinden paylaşılır; aksi halde `/api/auth/custom-token` ve rate limit taşar.
 */
let sessionToFirebaseSync: Promise<void> | null = null;

async function syncHttpSessionToFirebaseOnce(): Promise<void> {
  const auth = getClientAuth();
  await auth.authStateReady();
  if (auth.currentUser) return;

  if (!sessionToFirebaseSync) {
    sessionToFirebaseSync = (async () => {
      try {
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        if (!meRes.ok) return;
        const meData = (await meRes.json()) as { user: unknown };
        if (!meData.user) return;

        const res = await fetch("/api/auth/custom-token", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { token?: string };
        if (data.token) {
          const { signInWithCustomToken } = await import("firebase/auth");
          await signInWithCustomToken(auth, data.token);
        }
      } catch {
        /* ağ / yapılandırma */
      } finally {
        sessionToFirebaseSync = null;
      }
    })();
  }

  await sessionToFirebaseSync;
}

export function useFirebaseUidFromSession(): string | null | undefined {
  const [firebaseUid, setFirebaseUid] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!getFirebasePublicConfig()) {
      setFirebaseUid(null);
      return;
    }

    const auth = getClientAuth();
    let cancelled = false;
    let unsub: (() => void) | undefined;

    void (async () => {
      try {
        await syncHttpSessionToFirebaseOnce();
      } catch {
        /* sync içinde yutuldu */
      }
      if (cancelled) return;
      setFirebaseUid(auth.currentUser?.uid ?? null);

      unsub = onAuthStateChanged(auth, (u) => {
        if (cancelled) return;
        setFirebaseUid(u?.uid ?? null);
      });
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  return firebaseUid;
}
