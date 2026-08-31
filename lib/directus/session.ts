import "server-only";

import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { directusUrl } from "@/lib/directus/client";

/**
 * Kullanıcı bağlamlı Directus istekleri.
 *
 * Statik sunucu token'ı yerine **kullanıcının kendi oturum token'ı** kullanılır;
 * böylece "kimin hangi çalma listesini görebileceği/düzenleyebileceği" kararını
 * uygulama kodu değil Directus izinleri verir (bkz. scripts/directus-roles.mjs —
 * `playlists` ve `playlist_items` filtreleri `owner = $CURRENT_USER`).
 */

export class NotAuthenticatedError extends Error {
  constructor() {
    super("Oturum gerekli.");
    this.name = "NotAuthenticatedError";
  }
}

export async function sessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE_NAME)?.value ?? null;
}

type Options = {
  method?: string;
  body?: unknown;
  /** Directus query string'i, `?` olmadan. */
  query?: string;
};

/**
 * Directus'a kullanıcının oturumuyla istek atar.
 * Oturum yoksa `NotAuthenticatedError`, Directus reddederse hata fırlatır.
 */
export async function directusAsUser<T>(path: string, options: Options = {}): Promise<T> {
  const token = await sessionToken();
  if (!token) throw new NotAuthenticatedError();

  const url = `${directusUrl()}${path}${options.query ? `?${options.query}` : ""}`;
  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) throw new NotAuthenticatedError();

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Directus ${res.status}: ${text.slice(0, 200)}`);
  }

  if (res.status === 204) return null as T;
  return (await res.json()).data as T;
}
