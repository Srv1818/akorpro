import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { verifyFirebaseJwt } from "@/lib/auth/verify-firebase-jwt";
import { getAdminAuth } from "@/lib/firebase/admin";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const AUTH_ROUTES = ["/calma-listeleri", "/katki", "/admin"];

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );
}

function buildCsp(nonce: string): string {
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "";
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "";

  const directives: string[] = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://*.googleusercontent.com https://www.google-analytics.com${storageBucket ? ` https://${storageBucket}` : ""}`,
    "font-src 'self'",
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
    ].join(" "),
    `frame-src 'self'${authDomain ? ` https://${authDomain}` : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  return directives.join("; ");
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  if (isAuthRoute(request.nextUrl.pathname)) {
    if (projectId) {
      const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      if (!token) return redirectToLogin(request, csp);
      const adminAuth = getAdminAuth();
      try {
        if (adminAuth) {
          /** Giriş API’si `createSessionCookie` üretir; ID token JWKS ile doğrulanamaz. */
          await adminAuth.verifySessionCookie(token, true);
        } else {
          await verifyFirebaseJwt(token, projectId);
        }
      } catch {
        return redirectToLogin(request, csp);
      }
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

function redirectToLogin(request: NextRequest, csp: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/giris";
  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (returnTo && returnTo !== "/giris") {
    url.searchParams.set("returnTo", returnTo);
  }
  const res = NextResponse.redirect(url);
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
