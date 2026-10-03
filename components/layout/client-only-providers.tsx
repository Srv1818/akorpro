"use client";

import dynamic from "next/dynamic";

// CookieBanner bilerek burada DEĞİL: `ssr: false` onu hidrasyondan sonra
// yüklenen ayrı bir chunk'a çeviriyordu ve mobilde LCP öğesi o band oluyordu
// (6,4 sn, %86'sı render gecikmesi). Artık layout'tan doğrudan, sunucuda
// render ediliyor. Gerekçenin tamamı `components/consent/cookie-banner.tsx`'te.
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
    </>
  );
}
