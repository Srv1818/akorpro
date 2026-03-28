/// <reference lib="webworker" />

/**
 * AkorPro Service Worker (Faz 8)
 *
 * Strategy:
 * - App shell (JS, CSS, fonts): StaleWhileRevalidate
 * - Page navigations: NetworkFirst → offline fallback
 * - Chord/song content is NOT cached offline (copyright consideration)
 * - Images: CacheFirst with 7-day expiry
 */

const CACHE_NAME = "akorpro-v1";
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = ["/", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // Skip: API routes, Firebase, analytics, external origins
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("firebaseio.com") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("google-analytics.com") ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // Skip caching chord/song pages offline (copyright)
  const isSongPage =
    url.pathname.startsWith("/akor/") || url.pathname.startsWith("/preview/");

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        if (isSongPage) {
          return caches.match(OFFLINE_URL) || new Response("Çevrimdışı", { status: 503 });
        }
        return caches.match(request).then(
          (cached) => cached || caches.match(OFFLINE_URL) || new Response("Çevrimdışı", { status: 503 }),
        );
      }),
    );
    return;
  }

  // Static assets — StaleWhileRevalidate
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(js|css|woff2?)$/)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const networkFetch = fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
          return cached || networkFetch;
        }),
      ),
    );
    return;
  }

  // Images — CacheFirst (7 days)
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|avif|svg|gif|ico)$/)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            }),
        ),
      ),
    );
    return;
  }
});
