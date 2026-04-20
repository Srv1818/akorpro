/**
 * Firebase App Check — client-side activation.
 *
 * Protects sensitive Firestore writes (songOverrides, playlists) from abuse.
 * Requires NEXT_PUBLIC_RECAPTCHA_SITE_KEY in .env.local.
 *
 * When App Check is enabled, Firestore SDK automatically attaches the App
 * Check token to every request. Server-side enforcement is configured in
 * Firebase Console → App Check → Firestore (enforce).
 *
 * In development, debug tokens are used automatically when
 * NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1.
 */

import {
  type AppCheck,
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import { getApp } from "firebase/app";

let appCheck: AppCheck | null = null;

export function activateAppCheck(): AppCheck | null {
  if (appCheck) return appCheck;

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) return null;

  const isDebug =
    typeof window !== "undefined" &&
    (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "1" ||
      process.env.NODE_ENV === "development");

  if (isDebug && typeof window !== "undefined") {
    (self as unknown as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  try {
    const app = getApp();
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
    return appCheck;
  } catch {
    return null;
  }
}
