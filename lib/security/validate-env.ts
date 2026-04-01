/**
 * Production env doğrulama — sunucu başlangıcında çağrılır (instrumentation.ts).
 * Kritik değişkenler eksikse production'da hata fırlatır, dev'de uyarır.
 */

const REQUIRED: string[] = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

const REQUIRED_IN_PROD: string[] = [
  "FIREBASE_SERVICE_ACCOUNT_KEY",
];

export function assertEnvOrWarn(): void {
  const isProd = process.env.NODE_ENV === "production";
  const isCi = process.env.CI === "true";
  const missing: string[] = [];

  for (const key of REQUIRED) {
    if (!process.env[key]?.trim()) missing.push(key);
  }

  if (isProd) {
    for (const key of REQUIRED_IN_PROD) {
      if (!process.env[key]?.trim()) missing.push(key);
    }

    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "1") {
      missing.push("NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1 (production'da kaldırılmalı)");
    }
  }

  if (missing.length === 0) return;

  const msg = `[env] Eksik: ${missing.join(", ")}`;

  if (isProd && !isCi) {
    throw new Error(msg);
  }
  console.warn(msg);
}

/** Dev: Firestore emülatör env’i Admin SDK’yı etkiler — şarkı sayfaları boş/404 olabilir. */
export function warnFirestoreEmulatorVsNextDev(): void {
  if (process.env.NODE_ENV === "production") return;
  if (!process.env.FIRESTORE_EMULATOR_HOST?.trim()) return;
  if (process.env.AKORPRO_ADMIN_USE_CLOUD_FIRESTORE === "1") return;

  console.warn(
    "[env] FIRESTORE_EMULATOR_HOST tanımlı: Next sunucusu Firestore’a emülatörden bağlanır. " +
      "Emülatör kapalı/boşsa yerelde şarkılar açılmaz; canlıda sorun olmaz. " +
      "Çözüm: .env.local’dan bu satırı kaldırın, emülatörü çalıştırıp seed edin veya AKORPRO_ADMIN_USE_CLOUD_FIRESTORE=1 ekleyin.",
  );
}
