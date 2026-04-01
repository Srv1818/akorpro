export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertEnvOrWarn, warnFirestoreEmulatorVsNextDev } = await import("./lib/security/validate-env");
    assertEnvOrWarn();
    warnFirestoreEmulatorVsNextDev();

    const { assertNoClientSecrets } = await import("./lib/security/check-env-safety");
    assertNoClientSecrets();

    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = async (...args: Parameters<NonNullable<typeof import("@sentry/nextjs").captureRequestError>>) => {
  const Sentry = await import("@sentry/nextjs");
  if (Sentry.captureRequestError) {
    Sentry.captureRequestError(...args);
  }
};
