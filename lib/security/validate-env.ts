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

  if (isProd) {
    throw new Error(msg);
  }
  console.warn(msg);
}
