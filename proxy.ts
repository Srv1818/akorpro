import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

/**
 * `/admin` bilerek listede değil: orası artık Payload admin paneli ve kendi
 * giriş ekranı var. Buraya eklenirse Payload'ın `/admin/login` sayfası da
 * `/giris`e yönlendirilir ve panele hiç girilemez.
 */
const AUTH_ROUTES = ["/calma-listeleri"];

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
  const isDev = process.env.NODE_ENV !== "production";
  // Yüklenen dosyalar R2'den servis ediliyorsa o kaynak da izinli olmalı.
  const media = (process.env.NEXT_PUBLIC_MEDIA_URL ?? "").replace(/\/$/, "");

  // GTM kapsayıcısının içinden yüklenen her araç burada da izinli olmalı:
  // kapsayıcı bir etiket ekleyince CSP otomatik genişlemiyor, sessizce bloke
  // olur. Clarity iki aşamalı yükleniyor — önyükleyici www.clarity.ms'ten,
  // asıl kayıt motoru scripts.clarity.ms'ten geliyor — bu yüzden tam alan adı
  // değil joker gerekiyor.
  const scriptSrc = [
    "script-src 'self'",
    "'unsafe-inline'",
    "https://www.googletagmanager.com",
    "https://*.clarity.ms",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(" ");

  const directives: string[] = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Kullanıcı avatarları Google'dan, yüklenen dosyalar R2'den geliyor.
    `img-src 'self' data: blob: https://*.googleusercontent.com https://www.google-analytics.com${media ? ` ${media}` : ""}`,
    "font-src 'self' https://fonts.gstatic.com",
    [
      // Veri artık aynı origin'den geliyor; ayrı bir API adresi yok.
      "connect-src 'self'",
      // GA4 isteği bölgesel uca gidiyor (region1.google-analytics.com gibi),
      // bu yüzden tam alan adı yetmiyor.
      "https://*.google-analytics.com",
      "https://www.google-analytics.com",
      "https://analytics.google.com",
      "https://www.googletagmanager.com",
      "https://*.clarity.ms",
      "https://*.sentry.io",
    ]
      .filter(Boolean)
      .join(" "),
    "object-src 'none'",
    "base-uri 'self'",
    // Google'a yönlendirme tam sayfa redirect ile olur; form gönderimi yok.
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  return directives.join("; ");
}

const CSP = buildCsp();

/**
 * Korumalı yollarda hızlı bir çerez kontrolü yapar. Asıl doğrulama sunucu
 * bileşenlerinde `getServerSessionUser()` ile yapılıyor; buradaki kontrol
 * yalnız girişsiz kullanıcıyı boş sayfaya düşürmemek için.
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
    /* `admin` ve `payload-api` de hariç: Payload paneli kendi CSP'sini ve
       oturumunu yönetiyor, buradaki CSP panelin çalışmasını engelliyor. */
    "/((?!api|payload-api|admin|_next/static|_next/image|favicon\\.ico|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
