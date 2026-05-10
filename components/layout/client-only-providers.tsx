"use client";

import dynamic from "next/dynamic";

const CookieBanner = dynamic(
  () => import("@/components/consent/cookie-banner").then((m) => m.CookieBanner),
  { ssr: false },
);
const WebVitalsReporter = dynamic(
  () => import("@/components/analytics/web-vitals").then((m) => m.WebVitalsReporter),
  { ssr: false },
);
const SwRegister = dynamic(
  () => import("@/components/pwa/sw-register").then((m) => m.SwRegister),
  { ssr: false },
);

export function ClientOnlyProviders() {
  return (
    <>
      <WebVitalsReporter />
      <SwRegister />
      <CookieBanner />
    </>
  );
}
