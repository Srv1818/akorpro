/**
 * Production env doğrulama — sunucu başlangıcında çağrılır (instrumentation.ts).
 * Kritik değişkenler eksikse production'da hata fırlatır, dev'de uyarır.
 *
 * Veri ve kimlik katmanı Payload'da; Directus değişkenleri kaldırıldı.
 */

/** Payload olmadan hiçbir sayfa render edilemez. */
const REQUIRED_IN_PROD: string[] = [
  // Postgres bağlantısı. Yoksa her istek 500.
  "DATABASE_URI",
  // Oturum çerezlerini imzalar. Değişirse herkesin oturumu düşer.
  "PAYLOAD_SECRET",
];

/** Tarayıcıya açılan adres: giriş yönlendirmesi ve canonical/sitemap üretimi buna dayanıyor. */
const REQUIRED_PUBLIC_IN_PROD: string[] = [
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
