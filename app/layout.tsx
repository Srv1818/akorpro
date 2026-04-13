import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { Inter, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { ThemeProvider } from "@/components/theme/providers";
import { THEME_COOKIE, defaultThemeFromCookie } from "@/lib/theme";
import { SITE_URL } from "@/lib/paths";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { WebVitalsReporter } from "@/components/analytics/web-vitals";
import { GoogleAnalytics } from "@/components/analytics/ga4";
import { CookieBanner } from "@/components/consent/cookie-banner";
import { SwRegister } from "@/components/pwa/sw-register";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteName = "AkorPro";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#6D5DFC",
};

/** Geçici: içerik hazır olana kadar (ör. 2–3 gün) `.env` → BLOCK_SEARCH_INDEXING=true */
export async function generateMetadata(): Promise<Metadata> {
  const blockSearchIndexing = process.env.BLOCK_SEARCH_INDEXING === "true";

  return {
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
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/icons/icon.svg", type: "image/svg+xml" },
      ],
      apple: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    },
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
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [jar, hdrs] = await Promise.all([cookies(), headers()]);
  const defaultTheme = defaultThemeFromCookie(jar.get(THEME_COOKIE)?.value);
  const nonce = hdrs.get("x-nonce") ?? undefined;

  const firebaseAuthHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {firebaseAuthHost ? (
          <>
            <link rel="preconnect" href={`https://${firebaseAuthHost}`} crossOrigin="" />
            <link rel="dns-prefetch" href="https://www.googleapis.com" />
          </>
        ) : null}
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable} neu-theme flex min-h-full flex-col font-sans antialiased`}
      >
        <GoogleAnalytics />
        <SiteJsonLd />
        <WebVitalsReporter />
        <SwRegister />
        <ThemeProvider defaultTheme={defaultTheme} nonce={nonce}>
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
