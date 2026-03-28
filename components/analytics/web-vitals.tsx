"use client";

import { useEffect } from "react";

/**
 * Client component that bootstraps Core Web Vitals measurement.
 * Placed inside the root layout; no UI output.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_VITALS_ENDPOINT) {
      void import("@/lib/vitals/report-web-vitals").then((m) => m.initWebVitals());
    }
  }, []);

  return null;
}
