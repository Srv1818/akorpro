import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/** Üst dizinde başka lockfile varken Turbopack’in yanlış kök seçmesini engeller (dev/build). */
const turbopackRoot = path.dirname(fileURLToPath(import.meta.url));

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
    ];
  },
};

const hasSentryEnv =
  Boolean(process.env.SENTRY_AUTH_TOKEN) &&
  Boolean(process.env.SENTRY_ORG) &&
  Boolean(process.env.SENTRY_PROJECT);

export default hasSentryEnv
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      disableLogger: true,
      tunnelRoute: "/monitoring",
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },
    })
  : nextConfig;
