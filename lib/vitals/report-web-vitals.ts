import type { Metric } from "web-vitals";

const VITALS_ENDPOINT = process.env.NEXT_PUBLIC_VITALS_ENDPOINT;

/**
 * Send a single Web Vitals metric to the analytics endpoint.
 * Falls back to console.debug in development.
 */
function sendMetric(metric: Metric) {
  const body = JSON.stringify({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    navigationType: metric.navigationType,
    url: window.location.href,
    ts: Date.now(),
  });

  if (VITALS_ENDPOINT) {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(VITALS_ENDPOINT, blob);
    } else {
      fetch(VITALS_ENDPOINT, { body, method: "POST", keepalive: true }).catch(
        () => {},
      );
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.debug(`[web-vitals] ${metric.name}`, metric.value, metric.rating);
  }
}

/**
 * Initialise Core Web Vitals observers.
 * Call once from a client component mounted at layout level.
 */
export async function initWebVitals() {
  const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import("web-vitals");

  onCLS(sendMetric);
  onINP(sendMetric);
  onLCP(sendMetric);
  onFCP(sendMetric);
  onTTFB(sendMetric);
}
