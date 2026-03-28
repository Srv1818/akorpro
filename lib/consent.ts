/**
 * Cookie consent state management.
 *
 * Consent is stored in a first-party cookie (`akorpro-consent`) so the
 * banner can be hidden on repeat visits via SSR/middleware.
 */

export const CONSENT_COOKIE = "akorpro-consent";
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export type ConsentValue = "all" | "essential" | null;

export function readConsentCookie(raw: string | undefined): ConsentValue {
  if (raw === "all" || raw === "essential") return raw;
  return null;
}

export function setConsentCookie(value: "all" | "essential") {
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${CONSENT_MAX_AGE}; SameSite=Lax`;
}
