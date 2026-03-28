/**
 * Build-time / runtime assertion: sensitive env vars must NOT be exposed to
 * the client bundle.
 *
 * Call from a server-only entry point (e.g. instrumentation.ts or a CI script).
 * Any variable here that starts with NEXT_PUBLIC_ is a configuration error.
 */

const SENSITIVE_KEYS = [
  "FIREBASE_SERVICE_ACCOUNT_KEY",
] as const;

export function assertNoClientSecrets(): void {
  for (const key of SENSITIVE_KEYS) {
    if (key.startsWith("NEXT_PUBLIC_")) {
      throw new Error(
        `[security] ${key} must NOT use the NEXT_PUBLIC_ prefix — it would be exposed to the client bundle.`,
      );
    }

    if (typeof window !== "undefined" && key in (globalThis as unknown as Record<string, unknown>)) {
      throw new Error(
        `[security] ${key} is accessible on the client. Review your bundler configuration.`,
      );
    }
  }
}
