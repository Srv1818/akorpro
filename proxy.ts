import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const AUTH_ROUTES = ["/calma-listeleri", "/admin"];

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

/**
 * CSP, modül yükleme zamanında bir kez hesaplanır — request başına nonce üretmiyoruz.
 * Bu sayede root layout `headers()` çağrısı yapmadan tamamen statik prerender edilebilir.
 *
 * Trade-off: `'strict-dynamic'` + nonce kombinasyonu yerine `'self'` + `'unsafe-inline'`
 * kullanıyoruz. `'unsafe-inline'`, next-themes'in FOUC önleyici inline scripti için gerekli.
 * Diğer XSS koruma katmanları (input sanitize, escape) korunuyor.
 */
function buildCsp(): string {
  const directus = (process.env.NEXT_PUBLIC_DIRECTUS_URL ?? "").replace(/\/$/, "");
  const isDev = process.env.NODE_ENV !== "production";

  const scriptSrc = [
    "script-src 'self'",
    "'unsafe-inline'",
    "https://www.googletagmanager.com",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(" ");

  const directives: string[] = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Kullanıcı avatarları Google'dan, dosyalar Directus/R2'den geliyor.
    `img-src 'self' data: blob: https://*.googleusercontent.com https://www.google-analytics.com${directus ? ` ${directus}` : ""}`,
    "font-src 'self' https://fonts.gstatic.com",
    [
      "connect-src 'self'",
      directus,
      "https://www.google-analytics.com",
      "https://analytics.google.com",
      "https://*.sentry.io",
    ]
      .filter(Boolean)
      .join(" "),
    "object-src 'none'",
    "base-uri 'self'",
    // Google SSO'ya yönlendirme tam sayfa redirect ile olur; form gönderimi yok.
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  return directives.join("; ");
}

const CSP = buildCsp();

/**
 * Korumalı yollarda hızlı bir çerez kontrolü yapar. Asıl doğrulama sunucu
 * bileşenlerinde `getServerSessionUser()` ile Directus'a sorularak yapılıyor;
 * buradaki kontrol yalnız girişsiz kullanıcıyı boş sayfaya düşürmemek için.
 */
export async function proxy(request: NextRequest) {
  if (isAuthRoute(request.nextUrl.pathname)) {
    const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!hasSession) return redirectToLogin(request);
  }

  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", CSP);
  return response;
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/giris";
  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (returnTo && returnTo !== "/giris") {
    url.searchParams.set("returnTo", returnTo);
  }
  const res = NextResponse.redirect(url);
  res.headers.set("Content-Security-Policy", CSP);
  return res;
}

export const config = {
  matcher: [
    /* API route'ları hariç tut (Next önerisi); aksi halde /api/auth/me vb. 404 veya bozuk yanıt görülebilir. */
    "/((?!api|_next/static|_next/image|favicon\\.ico|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
