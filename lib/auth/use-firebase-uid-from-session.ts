"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { getFirebasePublicConfig } from "@/lib/firebase/public-config";
import { getClientAuth } from "@/lib/firebase/client";

/**
 * HTTP-only oturum çerezi varken Firebase Auth bazen boş kalır; Firestore kuralları
 * `request.auth` istediği için `/api/auth/custom-token` ile istemci oturumu eşitlenir.
 */
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
        await auth.authStateReady();
        if (cancelled) return;
        if (!auth.currentUser) {
          const res = await fetch("/api/auth/custom-token", { credentials: "include" });
          if (res.ok) {
            const data = (await res.json()) as { token?: string };
            if (data.token) {
              const { signInWithCustomToken } = await import("firebase/auth");
              await signInWithCustomToken(auth, data.token);
            }
          }
        }
      } catch {
        /* ağ / yapılandırma */
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
