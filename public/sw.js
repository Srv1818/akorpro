/// <reference lib="webworker" />

/**
 * AkorPro Service Worker
 *
 * Strateji:
 * - Uygulama kabuğu (JS, CSS, font): StaleWhileRevalidate
 * - Sayfa gezinmeleri: NetworkFirst → çevrimdışı yedeği
 * - Akor/şarkı içeriği çevrimdışı saklanmıyor (telif)
 * - Görseller: StaleWhileRevalidate
 *
 * ⚠️ Görsel veya ikon değiştirdiğinizde CACHE_VERSION'ı artırın.
 * `activate` eski adı taşıyan bütün önbellekleri siliyor, yani sürüm artışı
 * kullanıcıdaki eski dosyaları temizlemenin tek garantili yolu.
 */
const CACHE_VERSION = "v2-2026-09-30";
const CACHE_NAME = `akorpro-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

// Ana sayfa da duruyor: çevrimdışıyken "/" isteği buradan karşılanıyor.
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

/**
 * Önce önbellekten ver, arka planda tazele.
 *
 * Görseller eskiden CacheFirst idi ve hiçbir son kullanma tarihi yoktu
 * ("7 gün" yazan yorum gerçekte uygulanmıyordu). Bir kez saklanan ikon
 * sonsuza kadar servis ediliyordu: logonun köşe yarıçapı değiştiğinde
 * kullanıcılar eski kare ikonu görmeye devam etti ve ancak üst üste hard
 * refresh service worker'ı atlattığında yeni hali geldi. (2026-09-30)
 */
function staleWhileRevalidate(event) {
  const { request } = event;
  return caches.open(CACHE_NAME).then((cache) =>
    cache.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      // Önbellekte varsa anında ver, tazeleme arka planda sürsün.
      // waitUntil şart: aksi halde yanıt dönünce tarayıcı worker'ı
      // uyutabiliyor ve arka plandaki tazeleme yarıda kalıyor — önbellek
      // hiç güncellenmiyordu.
      if (cached) event.waitUntil(network);
      return cached || network;
    }),
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // API ve dış kaynaklar service worker'a girmiyor.
  if (url.pathname.startsWith("/api/") || url.origin !== self.location.origin) {
    return;
  }

  // Panel ve Payload API'si asla önbelleğe alınmaz: oturum ve yazma yolları.
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/payload-api/")) {
    return;
  }

  const isSongPage =
    url.pathname.startsWith("/akor/") || url.pathname.startsWith("/preview/");

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        if (isSongPage) {
          return (await caches.match(OFFLINE_URL)) ?? new Response("Çevrimdışı", { status: 503 });
        }
        return (
          (await caches.match(request)) ??
          (await caches.match(OFFLINE_URL)) ??
          new Response("Çevrimdışı", { status: 503 })
        );
      }),
    );
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(js|css|woff2?)$/) ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|avif|svg|gif|ico)$/)
  ) {
    event.respondWith(staleWhileRevalidate(event));
  }
});
