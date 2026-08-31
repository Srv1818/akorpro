import "server-only";

import { createDirectus, rest, staticToken, withToken } from "@directus/sdk";
import type { DirectusSchema } from "@/lib/directus/schema";

/**
 * Directus istemcileri (yalnız sunucu tarafı).
 *
 * İki kullanım var:
 * - `directus()`   — statik sunucu token'ı. Public okuma ve sistem yazmaları için.
 * - `asUser(token)`— kullanıcının kendi access token'ı. İzinler Directus'ta
 *                    kullanıcı bazında uygulanır (kendi playlist'i, kendi katkısı).
 *
 * Firebase Admin SDK'nın (`lib/firebase/admin.ts`) yerini alır.
 */

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} tanımlı değil — Directus istemcisi başlatılamadı.`);
  }
  return value;
}

/** Tarayıcıya da açık olan taban URL (görsel/asset linkleri için). */
export function directusUrl(): string {
  return (process.env.NEXT_PUBLIC_DIRECTUS_URL ?? requiredEnv("DIRECTUS_URL")).replace(/\/$/, "");
}

let cached: ReturnType<typeof buildClient> | null = null;

function buildClient() {
  return createDirectus<DirectusSchema>(directusUrl())
    .with(rest())
    .with(staticToken(requiredEnv("DIRECTUS_TOKEN")));
}

/** Sunucu token'lı paylaşılan istemci. */
export function directus() {
  cached ??= buildClient();
  return cached;
}

/**
 * Kullanıcı bağlamlı istek sarmalayıcısı.
 * `directus().request(asUser(token, readItems(...)))` biçiminde kullanılır.
 */
export const asUser = withToken;
