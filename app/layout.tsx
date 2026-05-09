import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { ThemeProvider } from "@/components/theme/providers";
import { SITE_URL } from "@/lib/paths";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { WebVitalsReporter } from "@/components/analytics/web-vitals";
import { GoogleAnalytics } from "@/components/analytics/ga4";
import { CookieBanner } from "@/components/consent/cookie-banner";
import { SwRegister } from "@/components/pwa/sw-register";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Arial", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["ui-monospace", "Consolas", "monospace"],
});

const siteName = "AkorPro";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#6D5DFC",
};

const blockSearchIndexing = process.env.BLOCK_SEARCH_INDEXING === "true";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AkorPro — Gitar akorları ve müzik araçları",
    template: "%s · AkorPro",
  },
  description:
    "Şarkı akorları, akorlar, gamlar ve 5'li çember ile çalışmayı kolaylaştıran modern bir platform. Topluluk ve erişilebilirlik odaklı.",
  ...(blockSearchIndexing
    ? {
        robots: {
          index: false,
          follow: false,
          googleBot: { index: false, follow: false },
        },
      }
    : {}),
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName,
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${inter.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="dns-prefetch" href="https://www.googleapis.com" />
      </head>
      <body
        className="neu-theme flex min-h-full flex-col font-sans antialiased"
      >
        <Analytics />
        <GoogleAnalytics />
        <SiteJsonLd />
        <WebVitalsReporter />
        <SwRegister />
        <ThemeProvider>
          <nav aria-label="Erişim kısayolları" className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:left-4 focus-within:top-4 focus-within:z-[100] focus-within:flex focus-within:gap-2">
            <a
              href="#icerik"
              className="rounded-lg bg-accent px-4 py-2 text-accent-foreground focus:outline-2 focus:outline-accent"
            >
              İçeriğe atla
            </a>
            <a
              href="#ana-menu"
              className="rounded-lg bg-accent px-4 py-2 text-accent-foreground focus:outline-2 focus:outline-accent"
            >
              Menüye atla
            </a>
          </nav>
          <SiteNavbar />
          <main id="icerik" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <CookieBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
