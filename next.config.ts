import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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
      { source: "/discover", destination: "/kesfet", permanent: true },
      { source: "/explore", destination: "/kesfet", permanent: true },
      { source: "/playlists", destination: "/calma-listeleri", permanent: true },
      { source: "/login", destination: "/giris", permanent: true },
      { source: "/search", destination: "/arama", permanent: true },
      { source: "/contribute", destination: "/katki", permanent: true },
      // Trailing slash normalisation
      { source: "/gitar-akorlari/", destination: "/gitar-akorlari", permanent: true },
      { source: "/kesfet/", destination: "/kesfet", permanent: true },
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

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  tunnelRoute: "/monitoring",
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
