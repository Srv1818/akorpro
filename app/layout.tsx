import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { ThemeProvider } from "@/components/theme/providers";
import { THEME_COOKIE, defaultThemeFromCookie } from "@/lib/theme";
import { SITE_URL } from "@/lib/paths";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteName = "AkorPro";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AkorPro — Gitar akorları ve müzik araçları",
    template: "%s · AkorPro",
  },
  description:
    "Şarkı akorları, kütüphane, gamlar ve 5'li çember ile çalışmayı kolaylaştıran modern bir platform. Topluluk ve erişilebilirlik odaklı.",
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
        {firebaseAuthHost ? (
          <>
            <link rel="preconnect" href={`https://${firebaseAuthHost}`} crossOrigin="" />
            <link rel="dns-prefetch" href="https://www.googleapis.com" />
          </>
        ) : null}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-full flex-col font-sans antialiased`}
      >
        <SiteJsonLd />
        <ThemeProvider defaultTheme={defaultTheme} nonce={nonce}>
          <a
            href="#icerik"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground"
          >
            İçeriğe atla
          </a>
          <SiteNavbar />
          <main id="icerik" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
