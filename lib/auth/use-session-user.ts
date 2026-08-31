"use client";

import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth/session-user";

/**
 * İstemci tarafı oturum durumu.
 *
 * `use-firebase-uid-from-session.ts`'in yerini alır: Firestore kuralları için
 * tarayıcıda ayrı bir Firebase oturumu açma (custom token senkronizasyonu)
 * ihtiyacı kalktı; tek kaynak `/api/auth/me`.
 *
 * Modül-seviyesi önbellek: tüm bileşenler tek kaynağa abone olur, `/api/auth/me`
 * sayfa ömrü boyunca bir kez çağrılır. Navigasyon veya remount yeniden istek
 * tetiklemez — yalnızca `akorpro:auth-change` eventi yeniler.
 */

export type SessionState = SessionUser | null | undefined;

type MeResponse = { user: SessionUser | null };

let cachedSession: SessionState = undefined;
let inflight: Promise<void> | null = null;
let hasFetched = false;
const listeners = new Set<(value: SessionState) => void>();

export function publishSession(value: SessionState) {
  cachedSession = value;
  listeners.forEach((fn) => fn(value));
}

function fetchSessionOnce(): Promise<void> {
  if (inflight) return inflight;
  hasFetched = true;
  inflight = (async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        publishSession(null);
        return;
      }
      const data = (await res.json()) as MeResponse;
      publishSession(data.user);
    } catch {
      publishSession(null);
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

let authChangeInstalled = false;
function ensureAuthChangeListener() {
  if (authChangeInstalled || typeof window === "undefined") return;
  authChangeInstalled = true;
  window.addEventListener("akorpro:auth-change", () => {
    hasFetched = false;
    void fetchSessionOnce();
  });
}

export function useSessionUser(): SessionState {
  const [state, setState] = useState<SessionState>(cachedSession);

  useEffect(() => {
    ensureAuthChangeListener();
    listeners.add(setState);
    if (!hasFetched) {
      void fetchSessionOnce();
    } else if (cachedSession !== state) {
      setState(cachedSession);
    }
    return () => {
      listeners.delete(setState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}

/** Oturumdaki kullanıcının id'si — `undefined` yükleniyor, `null` giriş yok. */
export function useSessionUid(): string | null | undefined {
  const user = useSessionUser();
  if (user === undefined) return undefined;
  return user?.uid ?? null;
}
