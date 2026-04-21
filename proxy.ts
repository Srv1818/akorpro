import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { verifyFirebaseJwt } from "@/lib/auth/verify-firebase-jwt";
import { getAdminAuth } from "@/lib/firebase/admin";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const AUTH_ROUTES = ["/calma-listeleri", "/admin"];

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );
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
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "";
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "";
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = [
    "script-src 'self'",
    "'unsafe-inline'",
    "https://www.googletagmanager.com",
    "https://va.vercel-scripts.com",
    "https://apis.google.com",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(" ");

  const directives: string[] = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src 'self' data: blob: https://*.googleusercontent.com https://www.google-analytics.com https://firebasestorage.googleapis.com${storageBucket ? ` https://${storageBucket}` : ""}`,
    "font-src 'self' https://fonts.gstatic.com",
    [
      "connect-src 'self'",
      "https://*.googleapis.com",
      "https://*.firebaseio.com",
      "wss://*.firebaseio.com",
      "https://firestore.googleapis.com",
      "https://identitytoolkit.googleapis.com",
      "https://securetoken.googleapis.com",
      "https://www.google-analytics.com",
      "https://analytics.google.com",
      "https://*.sentry.io",
      "https://vitals.vercel-insights.com",
    ].join(" "),
    `frame-src 'self' https://apis.google.com${authDomain ? ` https://${authDomain}` : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  return directives.join("; ");
}

const CSP = buildCsp();

export async function proxy(request: NextRequest) {
  if (isAuthRoute(request.nextUrl.pathname)) {
    if (projectId) {
      const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      if (!token) return redirectToLogin(request);
      const adminAuth = getAdminAuth();
      try {
        if (adminAuth) {
          /** Giriş API'si `createSessionCookie` üretir; ID token JWKS ile doğrulanamaz. */
          await adminAuth.verifySessionCookie(token, true);
        } else {
          await verifyFirebaseJwt(token, projectId);
        }
      } catch {
        return redirectToLogin(request);
      }
    }
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
