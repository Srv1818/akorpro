/**
 * Production env doğrulama — sunucu başlangıcında çağrılır (instrumentation.ts).
 * Kritik değişkenler eksikse production'da hata fırlatır, dev'de uyarır.
 *
 * Firebase değişkenleri kaldırıldı (Faz 3): veri ve kimlik katmanı Directus'ta.
 */

/** Uygulamanın Directus'a bağlanabilmesi için zorunlu — bunlar yoksa hiçbir sayfa render edilemez. */
const REQUIRED_IN_PROD: string[] = [
  "DIRECTUS_URL",
  "DIRECTUS_TOKEN",
];

/** Tarayıcıya açılan adresler: giriş yönlendirmesi ve canonical/sitemap üretimi bunlara dayanıyor. */
const REQUIRED_PUBLIC_IN_PROD: string[] = [
  "NEXT_PUBLIC_DIRECTUS_URL",
  "NEXT_PUBLIC_SITE_URL",
];

export function assertEnvOrWarn(): void {
  const isProd = process.env.NODE_ENV === "production";
  const isCi = process.env.CI === "true";

  const missing = [...REQUIRED_IN_PROD, ...REQUIRED_PUBLIC_IN_PROD].filter(
    (key) => !process.env[key]?.trim(),
  );

  if (missing.length === 0) return;

  const msg = `[env] Eksik: ${missing.join(", ")}`;

  if (isProd && !isCi) {
    throw new Error(msg);
  }
  console.warn(msg);
}
