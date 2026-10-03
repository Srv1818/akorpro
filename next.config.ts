import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withBundleAnalyzerFactory from "@next/bundle-analyzer";
import { withPayload } from "@payloadcms/next/withPayload";

const withBundleAnalyzer = withBundleAnalyzerFactory({
  enabled: process.env.ANALYZE === "true",
});

/** Üst dizinde başka lockfile varken Turbopack’in yanlış kök seçmesini engeller (dev/build). */
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));

/** package.json artık "type": "module" — ESM kapsamında `require` tanımsız. */
const require = createRequire(import.meta.url);

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

if (process.env.NODE_ENV === "production") {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

const nextConfig: NextConfig = {
  // Docker imajı için: .next/standalone altında kendi kendine yeten sunucu üretir.
  // node_modules kopyalamaya gerek kalmaz; imaj küçülür, VPS'te build yapılmaz.
  output: "standalone",
  experimental: {
    inlineCss: true,
    optimizePackageImports: ["lucide-react"],
  },
  turbopack: {
    root: turbopackRoot,
    // Replace Next.js's hardcoded polyfill-module with a minimal build.
    // polyfill-module is imported unconditionally by next/dist/client/app-globals.js
    // and contains feature-detected polyfills that Lighthouse flags even though they
    // never execute on our targets (chrome 96+, firefox 94+, safari 15.4+, edge 96+).
    // The only polyfill still needed is URL.canParse (added in Safari 17).
    resolveAlias: {
      "next/dist/build/polyfills/polyfill-module": "./lib/polyfill-module-minimal.js",
      "next/dist/esm/build/polyfills/polyfill-module": "./lib/polyfill-module-minimal.js",
    },
  },
  // DİKKAT: Next 16'da varsayılan bundler Turbopack, yani `next build` bu bloğu
  // HİÇ çalıştırmıyor (build logu: "Next.js 16.3.6 (Turbopack)"). Aşağıdaki
  // polyfill değişimi webpack döneminde yazılmıştı ve yükseltmeyle sessizce
  // devre dışı kaldı — Lighthouse "Eski JavaScript ~14 KiB" uyarısı buradan.
  //
  // Turbopack'te karşılığı `turbopack.resolveAlias`, ama o istek dizesiyle
  // eşleştiriyor; app-globals.js modülü göreli yolla (`../build/polyfills/...`)
  // çağırdığı için ne paket yolu anahtarı ne de glob (`*/polyfills/...`) tutuyor
  // — ikisi de denendi, build çıktısında polyfill duruyor.
  //
  // Bilerek bırakıldı: maliyet sıkıştırılmış ~4 KiB ve `next build --webpack`
  // ile hâlâ çalışıyor. Turbopack bunu desteklerse buraya taşınmalı.
  webpack: (config, { isServer }) => {
    config.ignoreWarnings = config.ignoreWarnings ?? [];
    config.ignoreWarnings.push({
      module: /@opentelemetry\/instrumentation/,
      message: /Critical dependency: the request of a dependency is an expression/,
    });

    if (!isServer) {
      // Same replacement for webpack (production builds).
      // resolve.alias keyed by the absolute resolved path intercepts the relative
      // require("../build/polyfills/polyfill-module") inside app-globals.js.
      const polyfillModulePath = require.resolve("next/dist/build/polyfills/polyfill-module");
      config.resolve.alias = {
        ...config.resolve.alias,
        [polyfillModulePath]: path.resolve(turbopackRoot, "lib/polyfill-module-minimal.js"),
      };
    }

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [64, 96, 128, 256, 384],
  },

  async redirects() {
    return [
      // Eski URL'ler → kanonik (Faz 2 + Faz 8 tutarlılık)
      { source: "/tum-sarkilar", destination: "/gitar-akorlari", permanent: true },
      { source: "/sarkilar", destination: "/gitar-akorlari", permanent: true },
      { source: "/songs", destination: "/gitar-akorlari", permanent: true },
      { source: "/songs/:path*", destination: "/gitar-akorlari", permanent: true },
      { source: "/artist/:slug", destination: "/sanatci/:slug", permanent: true },
      { source: "/artists/:slug", destination: "/sanatci/:slug", permanent: true },
      { source: "/chord/:artist/:song", destination: "/akor/:artist/:song", permanent: true },
      { source: "/chords", destination: "/akor-kutuphanesi", permanent: true },
      { source: "/chord-library", destination: "/akor-kutuphanesi", permanent: true },
      { source: "/scales", destination: "/gamlar", permanent: true },
      { source: "/circle-of-fifths", destination: "/besli-cember", permanent: true },
      { source: "/discover", destination: "/", permanent: true },
      { source: "/explore", destination: "/", permanent: true },
      { source: "/kesfet", destination: "/", permanent: true },
      { source: "/playlists", destination: "/calma-listeleri", permanent: true },
      { source: "/login", destination: "/giris", permanent: true },
      { source: "/search", destination: "/arama", permanent: true },
      { source: "/contribute", destination: "/iletisim", permanent: true },
      /**
       * Taşımada düzeltilen şarkı slug'ları.
       *
       * .com.tr'deki slug'lar hatalıydı ("yagmu" eksik harfli, "anlasana"
       * yerine yeni kayıt "anlasan"). Yeni yazımlar doğru ama Google ve
       * dışarıdan verilen bağlantılar eskisini biliyor; 308 ile kalıcı
       * olarak yönlendiriliyor, böylece birikmiş değer yeni adrese geçiyor.
       *
       * Buraya yeni satır eklerken: hedef slug'ın gerçekten var olduğundan
       * emin olun. Hedef sonradan yeniden adlandırılırsa bu satır 404'e
       * yönlendirir; slug değiştiren herkes bu listeyi de güncellemeli.
       */
      {
        source: "/akor/ersay-uner/yagmu",
        destination: "/akor/ersay-uner/yagmur",
        permanent: true,
      },
      {
        source: "/akor/haluk-levent/anlasana",
        destination: "/akor/haluk-levent/anlasan",
        permanent: true,
      },

      // Trailing slash normalisation
      { source: "/gitar-akorlari/", destination: "/gitar-akorlari", permanent: true },
      { source: "/kesfet/", destination: "/", permanent: true },
      { source: "/akor-kutuphanesi/", destination: "/akor-kutuphanesi", permanent: true },
      { source: "/gamlar/", destination: "/gamlar", permanent: true },
      { source: "/besli-cember/", destination: "/besli-cember", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // `public/` altındaki statikler Next'ten Cache-Control'süz çıkıyor ve
        // Cloudflare kendi varsayılanını (Browser Cache TTL = 4 saat) uyguluyor.
        // Logo her sayfa görüntülemesinde yeniden isteniyordu. İçerik değişirse
        // dosya adı değişsin diye değil — bunlar sabit varlıklar, uzun TTL doğru.
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

const hasSentryEnv =
  Boolean(process.env.SENTRY_AUTH_TOKEN) &&
  Boolean(process.env.SENTRY_ORG) &&
  Boolean(process.env.SENTRY_PROJECT);

const composed = hasSentryEnv
  ? withBundleAnalyzer(withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      disableLogger: true,
      tunnelRoute: "/monitoring",
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },
    }))
  : withBundleAnalyzer(nextConfig);

/**
 * withPayload en dışta: admin panelini Next derlemesine bağlar ve Payload'ın
 * sunucu paketlerini (pg, sharp vb.) bundle dışında tutar.
 */
export default withPayload(composed, { devBundleServerPackages: false });
